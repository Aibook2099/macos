import { WebSocketClient, WebSocketMessage, WebSocketConfig } from '../../../shared/types/websocket';

export class WebSocketClientImpl implements WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;

  constructor(url: string, options: WebSocketConfig = {}) {
    this.url = url;
    this.options = options;
  }

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to connect:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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

  private handleMessage(message: WebSocketMessage): void {
    // 根据消息类型处理不同的消息
    switch (message.type) {
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'auth':
        this.handleAuth(message);
        break;
      case 'error':
        this.handleError(message);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleHeartbeat(message: WebSocketMessage): void {
    // 处理心跳消息
    console.log('Received heartbeat:', message);
  }

  private handleAuth(message: WebSocketMessage): void {
    // 处理认证消息
    console.log('Received auth message:', message);
  }

  private handleError(message: WebSocketMessage): void {
    // 处理错误消息
    console.error('Received error message:', message);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts));
  }

  send(message: WebSocketMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
} 