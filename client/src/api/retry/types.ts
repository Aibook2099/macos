export interface RetryConfig {
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffFactor: number
  retryOnStatus?: number[]
  retryOnError?: (error: Error) => boolean
}

export interface RetryContext {
  attempt: number
  lastError: Error | null
  lastDelay: number
}

export type RetryFunction<T> = (context: RetryContext) => Promise<T> 