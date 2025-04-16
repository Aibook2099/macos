import { WebSocketMessage } from './types'

interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
}

export class WebSocketRetryManager {
  private static instance: WebSocketRetryManager
  private retryTimers: Map<string, number> = new Map()
  private retryCounts: Map<string, number> = new Map()
  private onRetry: ((message: WebSocketMessage) => void) | null = null

  private constructor() {}

  static getInstance(): WebSocketRetryManager {
    if (!WebSocketRetryManager.instance) {
      WebSocketRetryManager.instance = new WebSocketRetryManager()
    }
    return WebSocketRetryManager.instance
  }

  setOnRetry(callback: (message: WebSocketMessage) => void): void {
    this.onRetry = callback
  }

  scheduleRetry(message: WebSocketMessage, config: Partial<RetryConfig> = {}): void {
    const messageId = this.getMessageId(message)
    const currentAttempt = (this.retryCounts.get(messageId) || 0) + 1
    this.retryCounts.set(messageId, currentAttempt)

    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    if (currentAttempt > retryConfig.maxAttempts) {
      console.error(`Max retry attempts reached for message: ${messageId}`)
      this.cleanup(messageId)
      return
    }

    const delay = this.calculateDelay(currentAttempt, retryConfig)
    console.log(`Scheduling retry ${currentAttempt}/${retryConfig.maxAttempts} for message: ${messageId} in ${delay}ms`)

    const timer = window.setTimeout(() => {
      if (this.onRetry) {
        this.onRetry(message)
      }
      this.cleanup(messageId)
    }, delay)

    this.retryTimers.set(messageId, timer)
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1)
    return Math.min(delay, config.maxDelay)
  }

  private getMessageId(message: WebSocketMessage): string {
    return `${message.type}-${message.timestamp}`
  }

  private cleanup(messageId: string): void {
    const timer = this.retryTimers.get(messageId)
    if (timer) {
      clearTimeout(timer)
      this.retryTimers.delete(messageId)
    }
    this.retryCounts.delete(messageId)
  }

  cancelRetry(message: WebSocketMessage): void {
    const messageId = this.getMessageId(message)
    this.cleanup(messageId)
  }

  clearAll(): void {
    this.retryTimers.forEach((timer) => clearTimeout(timer))
    this.retryTimers.clear()
    this.retryCounts.clear()
  }
} 