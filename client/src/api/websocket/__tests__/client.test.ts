import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSocketClientImpl } from '../client'
import { 
  WebSocketMessage,
  WebSocketConfig,
  WebSocketEvent,
  WebSocketEventHandler,
  WebSocketMessageData
} from '../types'
import { 
  isBatchMessage,
  isHeartbeatMessage,
  isAuthMessage,
  isAuthResponse,
  isSystemMessage
} from '../messages'
import { MessageQueue, MessagePriority } from '../queue'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((this: MockWebSocket, ev: Event) => void) | null = null
  onmessage: ((this: MockWebSocket, ev: MessageEvent) => void) | null = null
  onerror: ((this: MockWebSocket, ev: Event) => void) | null = null
  onclose: ((this: MockWebSocket, ev: CloseEvent) => void) | null = null

  constructor(url: string) {
    this.url = url
  }

  send = vi.fn()
  close = vi.fn()
}

vi.stubGlobal('WebSocket', MockWebSocket)

describe('WebSocketClient', () => {
  let client: WebSocketClientImpl
  let mockMessageQueue: MessageQueue
  let mockWS: MockWebSocket
  const config: WebSocketConfig = {
    url: 'ws://localhost:8080',
    reconnectInterval: 1000,
    heartbeatInterval: 30000,
    maxRetries: 3
  }

  beforeEach(() => {
    vi.useFakeTimers()
    
    mockMessageQueue = {
      enqueue: vi.fn(),
      processQueue: vi.fn(),
      setSendMethod: vi.fn(),
      stop: vi.fn(),
      getQueueStats: vi.fn(),
    } as unknown as MessageQueue

    client = new WebSocketClientImpl(config)
    mockWS = new MockWebSocket(config.url)
  })

  afterEach(() => {
    client.disconnect()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should connect to WebSocket server', () => {
    client.connect()
    expect(global.WebSocket).toHaveBeenCalledWith(config.url)
  })

  it('should handle connection errors', () => {
    client.connect()
    mockWS.onerror!(new Event('error'))
    expect(mockWS.send).not.toHaveBeenCalled()
  })

  it('should handle connection close', () => {
    client.connect()
    mockWS.onclose!(new CloseEvent('close', { code: 1000, reason: 'Normal closure' }))
    expect(mockWS.close).toHaveBeenCalled()
  })

  it('should send messages when connected', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN
    
    const message: WebSocketMessage = {
      type: 'system',
      data: {
        event: 'test',
        content: 'test message',
        payload: {},
        timestamp: Date.now()
      }
    }

    client.send(message)
    expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(message))
  })

  it('should queue messages when not connected', () => {
    const message: WebSocketMessage = {
      type: 'system',
      data: {
        event: 'test',
        content: 'test message',
        payload: {},
        timestamp: Date.now()
      }
    }

    client.send(message)
    expect(mockMessageQueue.enqueue).toHaveBeenCalledWith(message, { priority: MessagePriority.NORMAL })
  })

  it('should handle heartbeat messages', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN

    const heartbeatMessage: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'heartbeat'
      }
    }

    const heartbeatHandler = vi.fn()
    client.on('heartbeat', heartbeatHandler)

    mockWS.onmessage!(new MessageEvent('message', {
      data: JSON.stringify(heartbeatMessage)
    }))

    expect(heartbeatHandler).toHaveBeenCalledWith({ type: 'heartbeat', message: heartbeatMessage })
  })

  it('should handle batch messages', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN

    const batchMessage: WebSocketMessage = {
      type: 'batch',
      data: {
        messages: [
          {
            type: 'system',
            data: {
              event: 'test',
              content: 'test message 1',
              payload: {},
              timestamp: Date.now()
            }
          },
          {
            type: 'system',
            data: {
              event: 'test',
              content: 'test message 2',
              payload: {},
              timestamp: Date.now()
            }
          }
        ],
        count: 2,
        content: 'batch',
        timestamp: Date.now()
      }
    }

    const messageHandler = vi.fn()
    client.on('message', messageHandler)

    mockWS.onmessage!(new MessageEvent('message', {
      data: JSON.stringify(batchMessage)
    }))

    expect(messageHandler).toHaveBeenCalledTimes(2)
  })

  it('should handle message events', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN

    const message: WebSocketMessage = {
      type: 'system',
      data: {
        event: 'test',
        content: 'test message',
        payload: {},
        timestamp: Date.now()
      }
    }

    const messageHandler = vi.fn()
    client.on('message', messageHandler)

    mockWS.onmessage!(new MessageEvent('message', {
      data: JSON.stringify(message)
    }))

    expect(messageHandler).toHaveBeenCalledWith({ type: 'message', message })
  })

  it('should handle error events', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN

    const errorMessage: WebSocketMessage = {
      type: 'error',
      data: {
        code: 'ERROR_CODE',
        message: 'Error message',
        content: 'error',
        timestamp: Date.now()
      }
    }

    const errorHandler = vi.fn()
    client.on('error', errorHandler)

    mockWS.onmessage!(new MessageEvent('message', {
      data: JSON.stringify(errorMessage)
    }))

    expect(errorHandler).toHaveBeenCalledWith({ type: 'error', message: errorMessage })
  })

  it('should handle system events', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN

    const systemMessage: WebSocketMessage = {
      type: 'system',
      data: {
        event: 'custom_event',
        content: 'system message',
        payload: {
          key: 'value'
        },
        timestamp: Date.now()
      }
    }

    const systemHandler = vi.fn()
    client.on('system', systemHandler)

    mockWS.onmessage!(new MessageEvent('message', {
      data: JSON.stringify(systemMessage)
    }))

    expect(systemHandler).toHaveBeenCalledWith({ type: 'system', message: systemMessage })
  })

  it('should handle auth response', () => {
    client.connect()
    mockWS.readyState = MockWebSocket.OPEN

    const authResponse: WebSocketMessage = {
      type: 'auth_response',
      data: {
        success: true,
        error: null,
        content: 'auth success',
        timestamp: Date.now()
      }
    }

    const authHandler = vi.fn()
    client.on('auth', authHandler)

    mockWS.onmessage!(new MessageEvent('message', {
      data: JSON.stringify(authResponse)
    }))

    expect(authHandler).toHaveBeenCalledWith({ type: 'auth', message: authResponse })
  })

  it('should handle reconnection', async () => {
    client.connect()
    mockWS.onclose!(new CloseEvent('close', { code: 1006, reason: 'Connection lost' }))

    // Fast-forward past reconnect delay
    await vi.advanceTimersByTimeAsync(config.reconnectInterval || 1000)

    expect(global.WebSocket).toHaveBeenCalledTimes(2)
  })

  it('should stop reconnecting after max attempts', async () => {
    client.connect()

    for (let i = 0; i < (config.maxRetries || 3); i++) {
      mockWS.onclose!(new CloseEvent('close', { code: 1006, reason: 'Connection lost' }))
      await vi.advanceTimersByTimeAsync(config.reconnectInterval || 1000)
    }

    expect(global.WebSocket).toHaveBeenCalledTimes(config.maxRetries || 3)
  })
}) 