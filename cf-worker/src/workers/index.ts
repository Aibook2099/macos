import { WebSocketDO } from '../durable-objects/websocket';
import { WebSocketMessage } from '../../shared/types/websocket';

export interface Env {
  WEBSOCKET: DurableObjectNamespace;
  MESSAGES: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // 处理 WebSocket 连接
    if (request.headers.get('Upgrade') === 'websocket') {
      const id = env.WEBSOCKET.idFromName(url.pathname);
      const stub = env.WEBSOCKET.get(id);
      return stub.fetch(request);
    }

    // 处理普通 HTTP 请求
    if (url.pathname === '/api/messages') {
      if (request.method === 'POST') {
        const message = await request.json() as WebSocketMessage;
        const id = env.WEBSOCKET.idFromName('broadcast');
        const stub = env.WEBSOCKET.get(id);
        return stub.fetch(request);
      }
    }

    // 处理静态文件请求
    if (url.pathname === '/') {
      return new Response('WebSocket Server Running', {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response('Not found', { status: 404 });
  }
}; 