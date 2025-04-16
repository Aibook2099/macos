export type ProgressCallback = (progress: number) => void

export interface ProgressConfig {
  onProgress?: ProgressCallback
  onStart?: () => void
  onComplete?: () => void
  onError?: (error: Error) => void
}

export interface ProgressState {
  loaded: number
  total: number
  percentage: number
}

export interface ProgressTracker {
  update(loaded: number, total: number): void
  complete(): void
  error(error: Error): void
} 