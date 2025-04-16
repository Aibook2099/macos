import { WebSocketMessage } from './types'

export class WebSocketPerformanceMonitor {
  private static instance: WebSocketPerformanceMonitor
  private messageStats: Map<string, {
    count: number
    totalSize: number
    avgSize: number
    minSize: number
    maxSize: number
  }> = new Map()
  private connectionStats: {
    totalConnections: number
    successfulConnections: number
    failedConnections: number
    avgConnectionTime: number
    totalConnectionTime: number
  } = {
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    avgConnectionTime: 0,
    totalConnectionTime: 0
  }
  private readonly statsWindow = 3600000 // 1 hour in milliseconds
  private messageTimestamps: number[] = []

  private constructor() {}

  static getInstance(): WebSocketPerformanceMonitor {
    if (!WebSocketPerformanceMonitor.instance) {
      WebSocketPerformanceMonitor.instance = new WebSocketPerformanceMonitor()
    }
    return WebSocketPerformanceMonitor.instance
  }

  trackMessage(message: WebSocketMessage): void {
    const messageSize = this.calculateMessageSize(message)
    const messageType = message.type

    if (!this.messageStats.has(messageType)) {
      this.messageStats.set(messageType, {
        count: 0,
        totalSize: 0,
        avgSize: 0,
        minSize: Infinity,
        maxSize: 0
      })
    }

    const stats = this.messageStats.get(messageType)!
    stats.count++
    stats.totalSize += messageSize
    stats.avgSize = stats.totalSize / stats.count
    stats.minSize = Math.min(stats.minSize, messageSize)
    stats.maxSize = Math.max(stats.maxSize, messageSize)

    this.messageTimestamps.push(Date.now())
    this.cleanupOldStats()
  }

  trackConnection(success: boolean, connectionTime: number): void {
    this.connectionStats.totalConnections++
    if (success) {
      this.connectionStats.successfulConnections++
    } else {
      this.connectionStats.failedConnections++
    }

    this.connectionStats.totalConnectionTime += connectionTime
    this.connectionStats.avgConnectionTime =
      this.connectionStats.totalConnectionTime / this.connectionStats.totalConnections
  }

  private calculateMessageSize(message: WebSocketMessage): number {
    return new Blob([JSON.stringify(message)]).size
  }

  private cleanupOldStats(): void {
    const now = Date.now()
    this.messageTimestamps = this.messageTimestamps.filter(
      timestamp => now - timestamp < this.statsWindow
    )
  }

  getMessageStats(): Map<string, {
    count: number
    totalSize: number
    avgSize: number
    minSize: number
    maxSize: number
  }> {
    return this.messageStats
  }

  getConnectionStats(): {
    totalConnections: number
    successfulConnections: number
    failedConnections: number
    avgConnectionTime: number
    totalConnectionTime: number
  } {
    return this.connectionStats
  }

  getMessageRate(): number {
    const now = Date.now()
    const recentMessages = this.messageTimestamps.filter(
      timestamp => now - timestamp < this.statsWindow
    )
    return recentMessages.length / (this.statsWindow / 1000) // messages per second
  }

  reset(): void {
    this.messageStats.clear()
    this.messageTimestamps = []
    this.connectionStats = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      avgConnectionTime: 0,
      totalConnectionTime: 0
    }
  }
} 