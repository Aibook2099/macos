import { WebSocketEvent, WebSocketMessage } from './types'

type Handler = (message: WebSocketMessage) => void

export class WebSocketMessageHandler {
  private static instance: WebSocketMessageHandler
  private handlers: Map<WebSocketEvent, Set<Handler>> = new Map()

  private constructor() {
    // 初始化所有事件类型的处理器集合
    const events: WebSocketEvent[] = ['open', 'message', 'error', 'close']
    events.forEach(event => this.handlers.set(event, new Set()))
  }

  static getInstance(): WebSocketMessageHandler {
    if (!WebSocketMessageHandler.instance) {
      WebSocketMessageHandler.instance = new WebSocketMessageHandler()
    }
    return WebSocketMessageHandler.instance
  }

  register(event: WebSocketEvent, handler: Handler): void {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.add(handler)
    }
  }

  unregister(event: WebSocketEvent, handler: Handler): void {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.delete(handler)
    }
  }

  handleMessage(event: WebSocketEvent, message: WebSocketMessage): void {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.forEach(handler => handler(message))
    }
  }

  handleEvent(event: WebSocketEvent, message: WebSocketMessage): void {
    switch (event) {
      case 'message':
        this.handleMessage('message', message)
        break
      case 'error':
        console.error('WebSocket error:', message)
        break
      case 'close':
        console.log('WebSocket connection closed:', message)
        break
      default:
        console.log(`Unhandled WebSocket event: ${event}`, message)
    }
  }

  cleanup(): void {
    this.handlers.forEach(handlers => handlers.clear())
    this.handlers.clear()
  }
} 