import * as Sentry from '@sentry/browser'
import { ErrorMessage } from './types'

export class WebSocketMonitor {
  private static instance: WebSocketMonitor
  private errorCount = 0
  private readonly maxErrors = 100
  private readonly errorWindow = 3600000 // 1 hour in milliseconds
  private errorTimestamps: number[] = []

  private constructor() {
    this.initializeSentry()
  }

  static getInstance(): WebSocketMonitor {
    if (!WebSocketMonitor.instance) {
      WebSocketMonitor.instance = new WebSocketMonitor()
    }
    return WebSocketMonitor.instance
  }

  private initializeSentry(): void {
    if (process.env.NODE_ENV === 'production') {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.APP_VERSION,
        tracesSampleRate: 1.0,
        beforeSend: (event) => {
          // Filter out non-critical errors in development
          if (process.env.NODE_ENV === 'development' && event.level !== 'error') {
            return null
          }
          return event
        }
      })
    }
  }

  trackError(error: Error | ErrorMessage): void {
    this.errorCount++
    this.errorTimestamps.push(Date.now())
    this.cleanupOldErrors()

    if (this.shouldReportError()) {
      this.reportError(error)
    }
  }

  private cleanupOldErrors(): void {
    const now = Date.now()
    this.errorTimestamps = this.errorTimestamps.filter(
      timestamp => now - timestamp < this.errorWindow
    )
  }

  private shouldReportError(): boolean {
    return (
      this.errorCount >= this.maxErrors ||
      this.errorTimestamps.length >= this.maxErrors
    )
  }

  private reportError(error: Error | ErrorMessage): void {
    if (process.env.NODE_ENV === 'production') {
      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(JSON.stringify(error), {
          level: 'error',
          extra: {
            code: error.data.code,
            message: error.data.message
          }
        })
      }
    }

    console.error('WebSocket Error:', error)
  }

  getErrorStats(): {
    count: number
    rate: number
    window: number
  } {
    return {
      count: this.errorCount,
      rate: this.errorTimestamps.length,
      window: this.errorWindow
    }
  }

  reset(): void {
    this.errorCount = 0
    this.errorTimestamps = []
  }
} 