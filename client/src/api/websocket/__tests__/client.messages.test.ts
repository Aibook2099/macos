import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { WebSocketClientImpl } from '../client'
import {
  WebSocketEvent,
  WebSocketConfig,
  SystemMessages,
  HeartbeatMessage,
  BatchMessage,
  ErrorMessage,
  SystemMessage,
  ChatMessage,
  ChatResponse,
  WebSocketEventHandler
} from '../types'
import { MessagePriority } from '../queue'

class MockWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readyState: number
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null

  send: Mock
  close: Mock
  addEventListener: Mock
  removeEventListener: Mock

  constructor() {
    this.readyState = MockWebSocket.CONNECTING
    this.send = vi.fn()
    this.close = vi.fn()
    this.addEventListener = vi.fn((event: string, handler: Function) => {
      switch (event) {
        case 'open':
          this.onopen = handler as (event: Event) => void
          break
        case 'close':
          this.onclose = handler as (event: CloseEvent) => void
          break
        case 'error':
          this.onerror = handler as (event: Event) => void
          break
        case 'message':
          this.onmessage = handler as (event: MessageEvent) => void
          break
      }
    })
    this.removeEventListener = vi.fn()
  }
}

describe('WebSocketClientImpl', () => {
  let client: WebSocketClientImpl
  let mockWebSocket: MockWebSocket
  let mockHandler: WebSocketEventHandler
  let config: WebSocketConfig

  beforeEach(() => {
    mockWebSocket = new MockWebSocket()
    config = {
      url: 'ws://test.com',
      reconnectInterval: 1000,
      heartbeatInterval: 5000,
      maxRetries: 3
    }

    vi.stubGlobal('WebSocket', vi.fn().mockImplementation(() => mockWebSocket))
    mockHandler = vi.fn()
    client = new WebSocketClientImpl(config)
    
    // Register event handlers
    client.on('message', mockHandler)
    client.on('heartbeat', mockHandler)
    client.on('error', mockHandler)
    client.on('system', mockHandler)
    client.on('chat', mockHandler)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('message handling', () => {
    it('should handle heartbeat messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'ping',
          timestamp: Date.now()
        }
      }

      client['handleMessage'](message)
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'heartbeat',
        message
      })
    })

    it('should handle batch messages', () => {
      const message: BatchMessage = {
        type: 'batch',
        data: {
          content: 'batch',
          timestamp: Date.now(),
          messages: [
            {
              content: 'test',
              timestamp: Date.now()
            }
          ],
          count: 1
        }
      }

      client['handleMessage'](message)
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'message',
        message
      })
    })

    it('should handle error messages', () => {
      const message: ErrorMessage = {
        type: 'error',
        data: {
          content: 'error',
          timestamp: Date.now(),
          code: 'TEST_ERROR',
          message: 'Test error message'
        }
      }

      client['handleMessage'](message)
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'error',
        message
      })
    })

    it('should handle system messages', () => {
      const message: SystemMessage = {
        type: 'system',
        data: {
          content: 'system',
          timestamp: Date.now(),
          event: 'test',
          payload: {}
        }
      }

      client['handleMessage'](message)
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'system',
        message
      })
    })

    it('should handle chat messages', () => {
      const message: ChatMessage = {
        type: 'chat',
        data: {
          content: 'chat',
          timestamp: Date.now(),
          messageId: '123',
          conversationId: '456'
        }
      }

      client['handleMessage'](message)
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'chat',
        message
      })
    })

    it('should handle chat responses', () => {
      const message: ChatResponse = {
        type: 'chat_response',
        data: {
          content: 'response',
          timestamp: Date.now(),
          messageId: '123',
          conversationId: '456'
        }
      }

      client['handleMessage'](message)
      expect(mockHandler).toHaveBeenCalledWith({
        type: 'chat',
        message
      })
    })

    it('should handle invalid messages', () => {
      const invalidMessage = {
        type: 'invalid',
        data: {
          content: 'invalid',
          timestamp: Date.now()
        }
      } as any

      client['handleMessage'](invalidMessage)
      expect(mockHandler).not.toHaveBeenCalled()
    })
  })

  describe('message queue', () => {
    it('should queue messages when disconnected', () => {
      mockWebSocket.readyState = MockWebSocket.CLOSED
      const message: SystemMessage = {
        type: 'system',
        data: {
          content: 'test',
          timestamp: Date.now(),
          event: 'test',
          payload: {}
        }
      }

      client.send(message)
      expect(client['messageQueue'].getQueueStats().total).toBe(1)
    })

    it('should process queued messages on reconnect', () => {
      mockWebSocket.readyState = MockWebSocket.CLOSED
      const message: SystemMessage = {
        type: 'system',
        data: {
          content: 'test',
          timestamp: Date.now(),
          event: 'test',
          payload: {}
        }
      }

      client.send(message)
      expect(client['messageQueue'].getQueueStats().total).toBe(1)

      mockWebSocket.readyState = MockWebSocket.OPEN
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'))
      }
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message))
      expect(client['messageQueue'].getQueueStats().total).toBe(0)
    })

    it('should handle message priority correctly', () => {
      const highPriorityMessage: SystemMessage = {
        type: 'system',
        data: {
          content: 'high priority',
          timestamp: Date.now(),
          event: 'test',
          payload: {}
        }
      }

      const normalPriorityMessage: SystemMessage = {
        type: 'system',
        data: {
          content: 'normal priority',
          timestamp: Date.now(),
          event: 'test',
          payload: {}
        }
      }

      mockWebSocket.readyState = MockWebSocket.CLOSED
      client.send(normalPriorityMessage)
      client.send(highPriorityMessage, MessagePriority.HIGH)

      mockWebSocket.readyState = MockWebSocket.OPEN
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen(new Event('open'))
      }

      expect(mockWebSocket.send).toHaveBeenNthCalledWith(1, JSON.stringify(highPriorityMessage))
      expect(mockWebSocket.send).toHaveBeenNthCalledWith(2, JSON.stringify(normalPriorityMessage))
    })
  })

  describe('reconnection', () => {
    it('should attempt reconnection when connection is lost', () => {
      const connectSpy = vi.spyOn(client, 'connect')
      
      // Simulate connection loss
      mockWebSocket.readyState = MockWebSocket.CLOSED
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose(new CloseEvent('close'))
      }

      // Wait for reconnect interval
      vi.advanceTimersByTime(config.reconnectInterval ?? 1000)

      expect(connectSpy).toHaveBeenCalled()
    })

    it('should respect max retries', () => {
      const errorHandler = vi.fn()
      client.on('error', errorHandler)

      const maxRetries = config.maxRetries ?? 3

      // Simulate multiple connection failures
      for (let i = 0; i < maxRetries + 1; i++) {
        mockWebSocket.readyState = MockWebSocket.CLOSED
        if (mockWebSocket.onclose) {
          mockWebSocket.onclose(new CloseEvent('close'))
        }
        vi.advanceTimersByTime(config.reconnectInterval ?? 1000)
      }

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
        type: 'error',
        message: expect.objectContaining({
          type: 'error',
          data: expect.objectContaining({
            code: 'MAX_RETRIES'
          })
        })
      }))
    })
  })

  describe('performance', () => {
    it('should handle multiple messages efficiently', () => {
      const messageCount = 1000
      const messages: SystemMessages[] = Array.from({ length: messageCount }, (_, i) => ({
        type: 'system',
        data: {
          content: `message ${i}`,
          timestamp: Date.now(),
          event: 'test',
          payload: {}
        }
      }))

      const startTime = performance.now()
      messages.forEach(message => client.send(message))
      const endTime = performance.now()

      // Verify that sending 1000 messages takes less than 1 second
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
}) 