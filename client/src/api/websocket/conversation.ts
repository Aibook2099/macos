import { WebSocketClient } from './client'
import { WebSocketMessage } from './types'

export class ConversationService {
  private wsClient: WebSocketClient
  private currentConversationId: string | null = null

  constructor() {
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3000'}/ws`
    this.wsClient = new WebSocketClient({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 3,
    })
  }

  connect(conversationId: string): void {
    this.currentConversationId = conversationId
    this.wsClient.connect()
  }

  disconnect(): void {
    this.currentConversationId = null
    this.wsClient.disconnect()
  }

  sendMessage(text: string): void {
    if (!this.currentConversationId) {
      throw new Error('No active conversation')
    }

    const message: WebSocketMessage = {
      type: 'message',
      conversationId: this.currentConversationId,
      data: { text },
      timestamp: new Date().toISOString(),
    }

    this.wsClient.send(message)
  }

  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.wsClient.on('message', callback)
  }

  onError(callback: (message: WebSocketMessage) => void): void {
    this.wsClient.on('error', callback)
  }

  onConnect(callback: () => void): void {
    this.wsClient.on('connect', () => {
      callback()
    })
  }

  onDisconnect(callback: () => void): void {
    this.wsClient.on('disconnect', () => {
      callback()
    })
  }
} 