import { WebSocketMessage } from './types'
import {
  AuthMessage,
  AuthResponse,
  ChatMessage,
  ChatResponse,
  ErrorMessage,
  HeartbeatMessage,
  SystemMessage,
  isAuthMessage,
  isAuthResponse,
  isChatMessage,
  isChatResponse,
  isErrorMessage,
  isHeartbeatMessage,
  isSystemMessage,
} from './messages'

type MessageHandler<T extends WebSocketMessage> = (message: T) => void | Promise<void>

export class WebSocketMessageHandler {
  private authHandlers: Set<MessageHandler<AuthResponse>> = new Set()
  private chatHandlers: Set<MessageHandler<ChatResponse>> = new Set()
  private errorHandlers: Set<MessageHandler<ErrorMessage>> = new Set()
  private heartbeatHandlers: Set<MessageHandler<HeartbeatMessage>> = new Set()
  private systemHandlers: Set<MessageHandler<SystemMessage>> = new Set()

  public onAuth(handler: MessageHandler<AuthResponse>): void {
    this.authHandlers.add(handler)
  }

  public onChat(handler: MessageHandler<ChatResponse>): void {
    this.chatHandlers.add(handler)
  }

  public onError(handler: MessageHandler<ErrorMessage>): void {
    this.errorHandlers.add(handler)
  }

  public onHeartbeat(handler: MessageHandler<HeartbeatMessage>): void {
    this.heartbeatHandlers.add(handler)
  }

  public onSystem(handler: MessageHandler<SystemMessage>): void {
    this.systemHandlers.add(handler)
  }

  public offAuth(handler: MessageHandler<AuthResponse>): void {
    this.authHandlers.delete(handler)
  }

  public offChat(handler: MessageHandler<ChatResponse>): void {
    this.chatHandlers.delete(handler)
  }

  public offError(handler: MessageHandler<ErrorMessage>): void {
    this.errorHandlers.delete(handler)
  }

  public offHeartbeat(handler: MessageHandler<HeartbeatMessage>): void {
    this.heartbeatHandlers.delete(handler)
  }

  public offSystem(handler: MessageHandler<SystemMessage>): void {
    this.systemHandlers.delete(handler)
  }

  public async handleMessage(message: WebSocketMessage): Promise<void> {
    try {
      if (isAuthResponse(message)) {
        await this.handleAuthResponse(message)
      } else if (isChatResponse(message)) {
        await this.handleChatResponse(message)
      } else if (isErrorMessage(message)) {
        await this.handleError(message)
      } else if (isHeartbeatMessage(message)) {
        await this.handleHeartbeat(message)
      } else if (isSystemMessage(message)) {
        await this.handleSystem(message)
      } else {
        console.warn('Unknown message type:', message.type)
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  private async handleAuthResponse(message: AuthResponse): Promise<void> {
    for (const handler of this.authHandlers) {
      await handler(message)
    }
  }

  private async handleChatResponse(message: ChatResponse): Promise<void> {
    for (const handler of this.chatHandlers) {
      await handler(message)
    }
  }

  private async handleError(message: ErrorMessage): Promise<void> {
    for (const handler of this.errorHandlers) {
      await handler(message)
    }
  }

  private async handleHeartbeat(message: HeartbeatMessage): Promise<void> {
    for (const handler of this.heartbeatHandlers) {
      await handler(message)
    }
  }

  private async handleSystem(message: SystemMessage): Promise<void> {
    for (const handler of this.systemHandlers) {
      await handler(message)
    }
  }
} 