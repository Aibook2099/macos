import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSocketClientImpl } from '../client'
import { WebSocketAuth } from '../auth'
import { WebSocketMessage, HeartbeatMessage, AuthResponse, ErrorMessage, SystemMessage } from '../types'

interface MockWebSocket {
  readyState: number
  send: (data: string) => void
  close: () => void
  onopen: (() => void) | null
  onmessage: ((event: { data: string }) => void) | null
  onerror: (() => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
}

describe('WebSocket Integration', () => {
  let client: WebSocketClientImpl
  let auth: WebSocketAuth
  let mockWs: MockWebSocket
  const mockUrl = 'ws://localhost:8080'
  const mockToken = 'test-token'
  const mockUserId = 'test-user'

  beforeEach(() => {
    vi.useFakeTimers()
    mockWs = {
      readyState: 1,
      send: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    }

    const MockWebSocketClass = vi.fn().mockImplementation(() => mockWs)
    MockWebSocketClass.CONNECTING = 0
    MockWebSocketClass.OPEN = 1
    MockWebSocketClass.CLOSING = 2
    MockWebSocketClass.CLOSED = 3

    global.WebSocket = MockWebSocketClass as any

    client = new WebSocketClientImpl(
      mockUrl,
      vi.fn(),
      vi.fn(),
      vi.fn()
    )
    auth = new WebSocketAuth(mockToken, mockUserId, vi.fn())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('authentication flow', () => {
    it('should complete authentication successfully', async () => {
      const authPromise = new Promise<AuthResponse>((resolve) => {
        auth.onAuthResult(resolve)
      })

      client.connect()
      client.send(auth.getAuthMessage())

      const authResponse: AuthResponse = {
        type: 'auth_response',
        data: {
          success: true,
          error: null,
          content: 'Authentication successful'
        }
      }

      mockWs.onmessage?.({ data: JSON.stringify(authResponse) })
      const result = await authPromise

      expect(result).toEqual(authResponse)
      expect(auth.isAuthenticated()).toBe(true)
    })

    it('should handle authentication failure', async () => {
      const authPromise = new Promise<AuthResponse>((resolve) => {
        auth.onAuthResult(resolve)
      })

      client.connect()
      client.send(auth.getAuthMessage())

      const authResponse: AuthResponse = {
        type: 'auth_response',
        data: {
          success: false,
          error: 'Invalid token',
          content: 'Authentication failed'
        }
      }

      mockWs.onmessage?.({ data: JSON.stringify(authResponse) })
      const result = await authPromise

      expect(result).toEqual(authResponse)
      expect(auth.isAuthenticated()).toBe(false)
    })
  })

  describe('message queue integration', () => {
    it('should queue messages when disconnected', () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { content: 'test message' }
      }

      client.send(message)
      expect(mockWs.send).not.toHaveBeenCalled()

      client.connect()
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message))
    })

    it('should respect message priority', () => {
      const highPriority: WebSocketMessage = {
        type: 'test',
        data: { content: 'high priority' }
      }
      const lowPriority: WebSocketMessage = {
        type: 'test',
        data: { content: 'low priority' }
      }

      client.send(lowPriority)
      client.send(highPriority)

      client.connect()
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(highPriority))
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(lowPriority))
    })
  })

  describe('heartbeat integration', () => {
    it('should maintain connection with heartbeat', () => {
      client.connect()
      const heartbeatHandler = vi.fn()
      client.onHeartbeat(heartbeatHandler)

      const heartbeatMessage: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          timestamp: Date.now(),
          content: 'heartbeat'
        }
      }

      mockWs.onmessage?.({ data: JSON.stringify(heartbeatMessage) })
      expect(heartbeatHandler).toHaveBeenCalledWith(heartbeatMessage)
    })

    it('should reconnect on heartbeat timeout', () => {
      client.connect()
      vi.advanceTimersByTime(30000) // Advance past heartbeat timeout
      expect(mockWs.close).toHaveBeenCalled()
    })
  })

  describe('error handling integration', () => {
    it('should handle and propagate errors', () => {
      const errorHandler = vi.fn()
      client.on('error', errorHandler)

      const errorMessage: ErrorMessage = {
        type: 'error',
        data: {
          code: 'TEST_ERROR',
          message: 'Test error',
          content: 'error content'
        }
      }

      mockWs.onmessage?.({ data: JSON.stringify(errorMessage) })
      expect(errorHandler).toHaveBeenCalledWith(errorMessage)
    })

    it('should handle connection errors', () => {
      const errorHandler = vi.fn()
      client.on('error', errorHandler)

      mockWs.onerror?.()
      expect(errorHandler).toHaveBeenCalled()
    })
  })

  describe('system message integration', () => {
    it('should handle system messages', () => {
      const systemHandler = vi.fn()
      client.on('system', systemHandler)

      const systemMessage: SystemMessage = {
        type: 'system',
        data: {
          event: 'test_event',
          payload: { test: 'data' },
          content: 'system message'
        }
      }

      mockWs.onmessage?.({ data: JSON.stringify(systemMessage) })
      expect(systemHandler).toHaveBeenCalledWith(systemMessage)
    })
  })
}) 