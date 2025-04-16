import { 
  WebSocketMessage,
  WebSocketConfig,
  WebSocketState,
  WebSocketEvent,
  WebSocketEventHandler
} from './types';
import { 
  isBatchMessage,
  isHeartbeatMessage,
  isAuthMessage,
  isAuthResponse,
  isSystemMessage
} from './messages';
import { MessageQueue, MessagePriority } from './queue';

export class WebSocketClientImpl {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private heartbeatInterval: number;
  private maxRetries: number;
  private retryCount = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private messageQueue: MessageQueue;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private state: WebSocketState = 'closed';

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.reconnectInterval = config.reconnectInterval || 5000;
    this.heartbeatInterval = config.heartbeatInterval || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.messageQueue = new MessageQueue();
    this.messageQueue.setSendMethod(this.rawSend.bind(this));
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.ws = new WebSocket(this.url);
    this.state = 'connecting';

    this.ws.onopen = () => {
      this.state = 'open';
      this.retryCount = 0;
      this.startHeartbeat();
      this.emit({ type: 'system', message: { type: 'system', data: { event: 'connected', payload: {}, content: 'Connected', timestamp: Date.now() } } });
    };

    this.ws.onclose = () => {
      this.state = 'closed';
      this.cleanup();
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      this.emit({ type: 'error', message: { type: 'error', data: { code: 'WS_ERROR', message: error.toString(), content: 'WebSocket error', timestamp: Date.now() } } });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.state = 'closing';
      this.ws.close();
      this.cleanup();
    }
  }

  public send(message: WebSocketMessage, priority: MessagePriority = MessagePriority.NORMAL): void {
    this.messageQueue.enqueue(message, { priority });
  }

  private async rawSend(message: WebSocketMessage | WebSocketMessage[]): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    if (Array.isArray(message)) {
      const batchMessage: WebSocketMessage = {
        type: 'batch',
        data: {
          messages: message,
          count: message.length,
          content: 'Batch message',
          timestamp: Date.now()
        }
      };
      this.ws.send(JSON.stringify(batchMessage));
    } else {
      this.ws.send(JSON.stringify(message));
    }
  }

  public handleMessage(message: WebSocketMessage): void {
    if (isBatchMessage(message)) {
      message.data.messages.forEach(msg => this.handleMessage(msg as WebSocketMessage));
      return;
    }

    if (isHeartbeatMessage(message)) {
      this.emit({ type: 'heartbeat', message });
    } else if (isAuthMessage(message) || isAuthResponse(message)) {
      this.emit({ type: 'auth', message });
    } else if (isSystemMessage(message)) {
      this.emit({ type: 'system', message });
    }

    this.emit({ type: 'message', message });
  }

  public on(eventType: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)?.add(handler);
  }

  public off(eventType: string, handler: WebSocketEventHandler): void {
    this.eventHandlers.get(eventType)?.delete(handler);
  }

  private emit(event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'heartbeat',
        data: {
          timestamp: Date.now(),
          content: 'Heartbeat'
        }
      }, MessagePriority.HIGH);
    }, this.heartbeatInterval);
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      this.emit({ type: 'error', message: { type: 'error', data: { code: 'MAX_RETRIES', message: 'Max retries reached', content: 'Connection failed', timestamp: Date.now() } } });
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.retryCount++;
      this.connect();
    }, this.reconnectInterval);
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.ws = null;
  }

  public get isConnected(): boolean {
    return this.state === 'open';
  }

  public reconnect(): void {
    this.disconnect();
    this.connect();
  }
}