import { AuthMessage, AuthResponse } from './types'

export class WebSocketAuth {
  private authenticated = false
  private authPromise: Promise<AuthResponse> | null = null
  private resolveAuth: ((response: AuthResponse) => void) | null = null

  constructor(
    private readonly token: string,
    private readonly userId: string,
    private readonly onAuthResult: (response: AuthResponse) => void
  ) {
    this.authPromise = new Promise<AuthResponse>((resolve) => {
      this.resolveAuth = resolve
    })
  }

  getAuthMessage(): AuthMessage {
    return {
      type: 'auth',
      data: {
        token: this.token,
        userId: this.userId,
        content: 'Authentication request'
      }
    }
  }

  handleAuthResponse(response: AuthResponse): void {
    if (!this.resolveAuth) {
      throw new Error('Auth promise not initialized')
    }

    this.resolveAuth(response)
    this.onAuthResult(response)
    this.authenticated = response.data.success
  }

  isAuthenticated(): boolean {
    return this.authenticated
  }

  onAuthResult(callback: (response: AuthResponse) => void): void {
    this.authPromise?.then(callback)
  }
} 