import { CacheEntry, CacheStore } from './types'

export class LocalStorageStore implements CacheStore {
  private prefix: string
  private maxSize: number

  constructor(prefix: string = 'cache_', maxSize: number = 100) {
    this.prefix = prefix
    this.maxSize = maxSize
  }

  get<T>(key: string): CacheEntry<T> | null {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (!item) return null

      const entry = JSON.parse(item) as CacheEntry<T>
      if (entry.expiresAt < Date.now()) {
        this.delete(key)
        return null
      }

      return entry
    } catch (error) {
      console.error('Cache read error:', error)
      return null
    }
  }

  set<T>(key: string, value: CacheEntry<T>): void {
    try {
      if (this.size() >= this.maxSize) {
        this.evictOldest()
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(value))
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key))
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  size(): number {
    try {
      return Object.keys(localStorage).filter(key => key.startsWith(this.prefix)).length
    } catch (error) {
      console.error('Cache size error:', error)
      return 0
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private evictOldest(): void {
    try {
      const entries = Object.entries(localStorage)
        .filter(([key]) => key.startsWith(this.prefix))
        .map(([key, value]) => {
          const entry = JSON.parse(value) as CacheEntry<unknown>
          return { key, timestamp: entry.timestamp }
        })
        .sort((a, b) => a.timestamp - b.timestamp)

      if (entries.length > 0) {
        localStorage.removeItem(entries[0].key)
      }
    } catch (error) {
      console.error('Cache eviction error:', error)
    }
  }
} 