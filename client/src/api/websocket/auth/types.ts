export interface AuthMessage {
  type: 'auth'
  token: string
}

export interface AuthResponse {
  type: 'auth_response'
  success: boolean
  error?: string
}

export interface AuthConfig {
  token: string
  onAuthSuccess?: () => void
  onAuthError?: (error: string) => void
  onAuthTimeout?: () => void
  authTimeout?: number
} 