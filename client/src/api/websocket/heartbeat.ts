import { WebSocketClientImpl } from './client'
import { HeartbeatMessage } from './messages'

const DEFAULT_HEARTBEAT_INTERVAL = 30000 // 30 seconds
const DEFAULT_TIMEOUT = 90000 // 90 seconds
const DEFAULT_MAX_RETRIES = 3

export class HeartbeatManager {
  private heartbeatInterval: number | null = null
  private lastHeartbeatTime: number = 0
  private timeoutTimer: number | null = null
  private retryCount = 0

  constructor(
    private client: WebSocketClientImpl,
    private config: {
      interval?: number
      timeout?: number
      maxRetries?: number
      onTimeout?: () => void
    } = {}
  ) {
    this.setupHeartbeat()
  }

  private setupHeartbeat(): void {
    // 清除现有的定时器
    this.clearTimers()

    // 设置心跳发送定时器
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.config.interval ?? DEFAULT_HEARTBEAT_INTERVAL)

    // 设置超时检测定时器
    this.timeoutTimer = window.setInterval(() => {
      this.checkTimeout()
    }, 1000) // 每秒检查一次

    // 监听心跳响应
    this.client.onHeartbeat((message: HeartbeatMessage) => {
      this.handleHeartbeatResponse(message)
    })
  }

  private sendHeartbeat(): void {
    if (this.client.isConnected()) {
      const heartbeat: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          timestamp: Date.now()
        },
        timestamp: Date.now()
      }
      this.client.send(heartbeat)
    }
  }

  private handleHeartbeatResponse(message: HeartbeatMessage): void {
    this.lastHeartbeatTime = message.data.timestamp
    this.retryCount = 0 // 重置重试计数
  }

  private checkTimeout(): void {
    const now = Date.now()
    const timeout = this.config.timeout ?? DEFAULT_TIMEOUT
    const maxRetries = this.config.maxRetries ?? DEFAULT_MAX_RETRIES

    if (now - this.lastHeartbeatTime > timeout) {
      this.retryCount++
      
      if (this.retryCount >= maxRetries) {
        this.clearTimers()
        this.config.onTimeout?.()
      } else {
        // 尝试重新连接
        this.client.reconnect()
      }
    }
  }

  private clearTimers(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    if (this.timeoutTimer) {
      clearInterval(this.timeoutTimer)
      this.timeoutTimer = null
    }
  }

  public stop(): void {
    this.clearTimers()
  }

  public reset(): void {
    this.retryCount = 0
    this.lastHeartbeatTime = Date.now()
    this.setupHeartbeat()
  }
} 