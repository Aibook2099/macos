import { API_BASE_URL, getHeaders } from './config'
import { withRetry } from './retry/retry'
import { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ServerError } from './errors'
import { CacheManager } from './cache/manager'
import { ProgressConfig, ProgressTrackerImpl } from './progress/tracker'

export interface RequestOptions {
  headers?: HeadersInit
  query?: Record<string, string>
  useCache?: boolean
  cacheTtl?: number
  progress?: ProgressConfig
}

const cacheManager = new CacheManager({
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 100,
  storage: 'memory',
})

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    switch (response.status) {
      case 400:
        throw new ValidationError(error.message || 'Invalid request', error.details)
      case 401:
        throw new AuthenticationError(error.message)
      case 403:
        throw new AuthorizationError(error.message)
      case 404:
        throw new NotFoundError(error.message)
      case 500:
        throw new ServerError(error.message)
      default:
        throw new Error(error.message || 'Request failed')
    }
  }

  return response.json()
}

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(path, API_BASE_URL)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  return url.toString()
}

async function fetchWithProgress<T>(
  url: string,
  options: RequestInit & { progress?: ProgressConfig }
): Promise<T> {
  const { progress, ...fetchOptions } = options
  const tracker = progress ? new ProgressTrackerImpl(progress) : null

  if (tracker && progress?.onStart) {
    progress.onStart()
  }

  const response = await fetch(url, {
    ...fetchOptions,
    ...(tracker && {
      onUploadProgress: (event: ProgressEvent) => {
        tracker.update(event.loaded, event.total)
      },
    }),
  })

  if (tracker) {
    const reader = response.body?.getReader()
    if (reader) {
      let loaded = 0
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          tracker.complete()
          break
        }
        loaded += value.length
        tracker.update(loaded, total)
      }
    } else {
      tracker.complete()
    }
  }

  return handleResponse<T>(response)
}

export async function get<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { useCache = true, ...restOptions } = options
  const cacheKey = cacheManager.generateKey(path, restOptions.query)

  if (useCache) {
    const cached = await cacheManager.get<T>(cacheKey)
    if (cached) {
      return cached
    }
  }

  return withRetry(async () => {
    const data = await fetchWithProgress<T>(buildUrl(path, restOptions.query), {
      method: 'GET',
      headers: { ...getHeaders(), ...restOptions.headers },
      progress: restOptions.progress,
    })

    if (useCache) {
      await cacheManager.set(cacheKey, data)
    }

    return data
  })
}

export async function post<T>(path: string, data: unknown, options: RequestOptions = {}): Promise<T> {
  return withRetry(async () => {
    return fetchWithProgress<T>(buildUrl(path, options.query), {
      method: 'POST',
      headers: { ...getHeaders(), ...options.headers },
      body: data ? JSON.stringify(data) : undefined,
      progress: options.progress,
    })
  })
}

export async function put<T>(path: string, data: unknown, options: RequestOptions = {}): Promise<T> {
  return withRetry(async () => {
    return fetchWithProgress<T>(buildUrl(path, options.query), {
      method: 'PUT',
      headers: { ...getHeaders(), ...options.headers },
      body: JSON.stringify(data),
      progress: options.progress,
    })
  })
}

export async function patch<T>(path: string, data: unknown, options: RequestOptions = {}): Promise<T> {
  return withRetry(async () => {
    return fetchWithProgress<T>(buildUrl(path, options.query), {
      method: 'PATCH',
      headers: { ...getHeaders(), ...options.headers },
      body: JSON.stringify(data),
      progress: options.progress,
    })
  })
}

export async function del<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return withRetry(async () => {
    return fetchWithProgress<T>(buildUrl(path, options.query), {
      method: 'DELETE',
      headers: { ...getHeaders(), ...options.headers },
      progress: options.progress,
    })
  })
} 