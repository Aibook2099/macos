import { ProgressConfig, ProgressState, ProgressTracker } from './types'

export type { ProgressConfig } from './types'

export class ProgressTrackerImpl implements ProgressTracker {
  private state: ProgressState = {
    loaded: 0,
    total: 0,
    percentage: 0,
  }

  constructor(private config: ProgressConfig) {}

  update(loaded: number, total: number): void {
    this.state = {
      loaded,
      total,
      percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
    }

    if (this.config.onProgress) {
      this.config.onProgress(this.state.percentage)
    }
  }

  complete(): void {
    this.state = {
      loaded: this.state.total,
      total: this.state.total,
      percentage: 100,
    }

    if (this.config.onProgress) {
      this.config.onProgress(100)
    }

    if (this.config.onComplete) {
      this.config.onComplete()
    }
  }

  error(error: Error): void {
    if (this.config.onError) {
      this.config.onError(error)
    }
  }
} 