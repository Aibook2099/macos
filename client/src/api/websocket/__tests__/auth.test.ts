import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebSocketAuth } from '../auth'
import { AuthMessage, AuthResponse } from '../types'

describe('WebSocketAuth', () => {
  let auth: WebSocketAuth
  const mockToken = 'test-token'
  const mockUserId = 'test-user'
  const mockOnAuthResult = vi.fn()

  beforeEach(() => {
    auth = new WebSocketAuth(mockToken, mockUserId, mockOnAuthResult)
    vi.clearAllMocks()
  })

  describe('authentication', () => {
    it('should create auth message with correct data', () => {
      const message = auth.getAuthMessage()
      expect(message).toEqual({
        type: 'auth',
        data: {
          token: mockToken,
          userId: mockUserId,
          content: 'Authentication request'
        }
      })
    })

    it('should handle successful authentication', () => {
      const response: AuthResponse = {
        type: 'auth_response',
        data: {
          success: true,
          error: null,
          content: 'Authentication successful'
        }
      }

      auth.handleAuthResponse(response)
      expect(mockOnAuthResult).toHaveBeenCalledWith(response)
      expect(auth.isAuthenticated()).toBe(true)
    })

    it('should handle failed authentication', () => {
      const response: AuthResponse = {
        type: 'auth_response',
        data: {
          success: false,
          error: 'Invalid token',
          content: 'Authentication failed'
        }
      }

      auth.handleAuthResponse(response)
      expect(mockOnAuthResult).toHaveBeenCalledWith(response)
      expect(auth.isAuthenticated()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle malformed auth response', () => {
      const invalidResponse = {
        type: 'auth_response',
        data: {
          success: true
        }
      }

      expect(() => {
        auth.handleAuthResponse(invalidResponse as AuthResponse)
      }).toThrow('Invalid auth response')
    })

    it('should handle null error in failed auth', () => {
      const response: AuthResponse = {
        type: 'auth_response',
        data: {
          success: false,
          error: null,
          content: 'Authentication failed'
        }
      }

      auth.handleAuthResponse(response)
      expect(auth.isAuthenticated()).toBe(false)
    })
  })

  describe('state management', () => {
    it('should maintain authentication state', () => {
      expect(auth.isAuthenticated()).toBe(false)

      const successResponse: AuthResponse = {
        type: 'auth_response',
        data: {
          success: true,
          error: null,
          content: 'Authentication successful'
        }
      }

      auth.handleAuthResponse(successResponse)
      expect(auth.isAuthenticated()).toBe(true)

      const failResponse: AuthResponse = {
        type: 'auth_response',
        data: {
          success: false,
          error: 'Token expired',
          content: 'Authentication failed'
        }
      }

      auth.handleAuthResponse(failResponse)
      expect(auth.isAuthenticated()).toBe(false)
    })
  })
}) 