import { CacheEntry, CacheStore } from './types'

export class MemoryStore implements CacheStore {
  private store: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt < Date.now()) {
      this.delete(key)
      return null
    }

    return entry as CacheEntry<T>
  }

  set<T>(key: string, value: CacheEntry<T>): void {
    if (this.store.size >= this.maxSize) {
      this.evictOldest()
    }
    this.store.set(key, value)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }

  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.store.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key
        oldestTimestamp = entry.timestamp
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }
} 