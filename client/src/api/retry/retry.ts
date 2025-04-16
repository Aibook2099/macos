import { RetryConfig, RetryContext, RetryFunction } from './types'

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryOnStatus: [408, 429, 500, 502, 503, 504],
}

export async function withRetry<T>(
  fn: RetryFunction<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config }
  const context: RetryContext = {
    attempt: 0,
    lastError: null,
    lastDelay: 0,
  }

  while (context.attempt < finalConfig.maxAttempts) {
    try {
      return await fn(context)
    } catch (error) {
      context.lastError = error as Error
      context.attempt++

      if (context.attempt >= finalConfig.maxAttempts) {
        throw error
      }

      if (shouldRetry(error as Error, finalConfig)) {
        const delay = calculateDelay(context, finalConfig)
        context.lastDelay = delay
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw context.lastError
}

function shouldRetry(error: Error, config: RetryConfig): boolean {
  if (config.retryOnError) {
    return config.retryOnError(error)
  }

  if (error instanceof Response && config.retryOnStatus) {
    return config.retryOnStatus.includes(error.status)
  }

  return true
}

function calculateDelay(context: RetryContext, config: RetryConfig): number {
  const exponentialDelay = config.initialDelay * Math.pow(config.backoffFactor, context.attempt - 1)
  const jitter = Math.random() * 0.1 * exponentialDelay
  return Math.min(exponentialDelay + jitter, config.maxDelay)
} 