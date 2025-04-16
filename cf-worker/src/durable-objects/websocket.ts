import { WebSocketMessage, WebSocketEvent } from '../../shared/types/websocket';

export class WebSocketDO {
  private state: DurableObjectState;
  private sessions: Map<string, WebSocket>;
  private messageQueue: Message[];

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
    this.messageQueue = [];
  }

  async fetch(request: Request) {
    // 处理 WebSocket 升级请求
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      await this.handleSession(server);
      
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // 处理普通 HTTP 请求
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');

    if (!clientId) {
      return new Response('Missing clientId', { status: 400 });
    }

    const session = this.sessions.get(clientId);
    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    // 处理消息发送
    if (request.method === 'POST') {
      const message = await request.json() as WebSocketMessage;
      session.send(JSON.stringify(message));
      return new Response('Message sent');
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleSession(webSocket: WebSocket) {
    webSocket.accept();

    webSocket.addEventListener('message', async (msg) => {
      try {
        const message = JSON.parse(msg.data as string) as WebSocketMessage;
        await this.handleMessage(webSocket, message);
      } catch (error) {
        console.error('Error handling message:', error);
        webSocket.send(JSON.stringify({
          type: 'error',
          data: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse message'
          }
        }));
      }
    });

    webSocket.addEventListener('close', () => {
      this.cleanupSession(webSocket);
    });
  }

  private async handleMessage(webSocket: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(webSocket, message);
        break;
      case 'heartbeat':
        await this.handleHeartbeat(webSocket, message);
        break;
      case 'message':
        await this.handleRegularMessage(webSocket, message);
        break;
      default:
        webSocket.send(JSON.stringify({
          type: 'error',
          data: {
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: `Unknown message type: ${message.type}`
          }
        }));
    }
  }

  private async handleAuth(webSocket: WebSocket, message: WebSocketMessage) {
    const { token, userId } = message.data as any;
    
    // 验证 token
    const isValid = await this.validateToken(token);
    
    if (isValid) {
      this.sessions.set(userId, webSocket);
      webSocket.send(JSON.stringify({
        type: 'auth_response',
        data: {
          success: true,
          error: null
        }
      }));
    } else {
      webSocket.send(JSON.stringify({
        type: 'auth_response',
        data: {
          success: false,
          error: 'Invalid token'
        }
      }));
      webSocket.close(1008, 'Authentication failed');
    }
  }

  private async handleHeartbeat(webSocket: WebSocket, message: WebSocketMessage) {
    webSocket.send(JSON.stringify({
      type: 'heartbeat',
      data: {
        timestamp: Date.now()
      }
    }));
  }

  private async handleRegularMessage(webSocket: WebSocket, message: WebSocketMessage) {
    // 处理普通消息
    this.messageQueue.push(message);
    await this.processMessageQueue();
  }

  private async processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.broadcastMessage(message);
      }
    }
  }

  private async broadcastMessage(message: WebSocketMessage) {
    for (const [userId, session] of this.sessions.entries()) {
      try {
        session.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Error sending message to ${userId}:`, error);
        this.cleanupSession(session);
      }
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    // 实现 token 验证逻辑
    return true; // 临时实现
  }

  private cleanupSession(webSocket: WebSocket) {
    for (const [userId, session] of this.sessions.entries()) {
      if (session === webSocket) {
        this.sessions.delete(userId);
        break;
      }
    }
  }
} 