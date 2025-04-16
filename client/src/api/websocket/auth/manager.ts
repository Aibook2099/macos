import { AuthConfig, AuthMessage, AuthResponse } from './types'
import { WebSocketMessage } from '../types'

export class WebSocketAuthManager {
  private authTimeoutId: number | null = null
  private isAuthenticated = false

  constructor(private config: AuthConfig) {}

  async authenticate(ws: WebSocket): Promise<boolean> {
    if (this.isAuthenticated) {
      return true
    }

    return new Promise((resolve) => {
      const authMessage: AuthMessage = {
        type: 'auth',
        token: this.config.token,
      }

      const messageHandler = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          if (message.type === 'auth_response') {
            const response = message as AuthResponse
            if (response.success) {
              this.handleAuthSuccess()
              resolve(true)
            } else {
              this.handleAuthError(response.error || 'Authentication failed')
              resolve(false)
            }
            ws.removeEventListener('message', messageHandler)
          }
        } catch (error) {
          console.error('Failed to parse auth response:', error)
        }
      }

      ws.addEventListener('message', messageHandler)
      ws.send(JSON.stringify(authMessage))

      if (this.config.authTimeout) {
        this.authTimeoutId = window.setTimeout(() => {
          this.handleAuthTimeout()
          resolve(false)
        }, this.config.authTimeout)
      }
    })
  }

  private handleAuthSuccess(): void {
    this.isAuthenticated = true
    if (this.authTimeoutId) {
      clearTimeout(this.authTimeoutId)
      this.authTimeoutId = null
    }
    if (this.config.onAuthSuccess) {
      this.config.onAuthSuccess()
    }
  }

  private handleAuthError(error: string): void {
    this.isAuthenticated = false
    if (this.authTimeoutId) {
      clearTimeout(this.authTimeoutId)
      this.authTimeoutId = null
    }
    if (this.config.onAuthError) {
      this.config.onAuthError(error)
    }
  }

  private handleAuthTimeout(): void {
    this.isAuthenticated = false
    if (this.config.onAuthTimeout) {
      this.config.onAuthTimeout()
    }
  }

  isAuth(): boolean {
    return this.isAuthenticated
  }
} 