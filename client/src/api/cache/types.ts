export interface CacheConfig {
  ttl: number // 缓存过期时间（毫秒）
  maxSize?: number // 最大缓存条目数
  storage?: 'memory' | 'localStorage' // 存储方式
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export interface CacheStore {
  get<T>(key: string): CacheEntry<T> | null
  set<T>(key: string, value: CacheEntry<T>): void
  delete(key: string): void
  clear(): void
  size(): number
} 