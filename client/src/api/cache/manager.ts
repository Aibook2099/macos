import { CacheConfig, CacheEntry, CacheStore } from './types'
import { MemoryStore } from './memoryStore'
import { LocalStorageStore } from './localStorageStore'

export class CacheManager {
  private store: CacheStore
  private config: Required<CacheConfig>

  constructor(config: CacheConfig) {
    this.config = {
      ttl: config.ttl,
      maxSize: config.maxSize || 100,
      storage: config.storage || 'memory',
    }

    this.store = this.createStore()
  }

  private createStore(): CacheStore {
    switch (this.config.storage) {
      case 'localStorage':
        return new LocalStorageStore('cache_', this.config.maxSize)
      case 'memory':
      default:
        return new MemoryStore(this.config.maxSize)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get<T>(key)
    if (!entry) return null
    return entry.data
  }

  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.ttl,
    }
    this.store.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  size(): number {
    return this.store.size()
  }

  generateKey(path: string, params?: Record<string, string>): string {
    const key = [path]
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&')
      key.push(sortedParams)
    }
    return key.join('?')
  }
} 