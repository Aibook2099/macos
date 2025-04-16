import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSocketClientImpl } from '../client'
import { WebSocketMessage } from '../types'
import { MessageQueue, MessagePriority } from '../queue'

describe('WebSocket Handlers', () => {
  let client: WebSocketClientImpl
  let mockQueue: MessageQueue
  const config = {
    url: 'ws://localhost:8080',
    reconnectInterval: 1000,
    heartbeatInterval: 30000,
    maxRetries: 3
  }

  beforeEach(() => {
    vi.useFakeTimers()
    mockQueue = {
      enqueue: vi.fn(),
      processQueue: vi.fn(),
      setSendMethod: vi.fn(),
      stop: vi.fn(),
      getQueueStats: vi.fn(),
    } as unknown as MessageQueue
    client = new WebSocketClientImpl(config)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should handle heartbeat messages', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'heartbeat'
      }
    }

    const handler = vi.fn()
    client.on('heartbeat', handler)
    client.handleMessage(message)

    expect(handler).toHaveBeenCalledWith({ type: 'heartbeat', message })
  })

  it('should handle batch messages', () => {
    const message: WebSocketMessage = {
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
          }
        ],
        count: 1,
        content: 'batch',
        timestamp: Date.now()
      }
    }

    const handler = vi.fn()
    client.on('message', handler)
    client.handleMessage(message)

    expect(handler).toHaveBeenCalledWith({ 
      type: 'message', 
      message: message.data.messages[0] 
    })
  })

  it('should handle error messages', () => {
    const message: WebSocketMessage = {
      type: 'error',
      data: {
        code: 'ERROR_CODE',
        message: 'Error message',
        content: 'error',
        timestamp: Date.now()
      }
    }

    const handler = vi.fn()
    client.on('error', handler)
    client.handleMessage(message)

    expect(handler).toHaveBeenCalledWith({ type: 'error', message })
  })

  it('should handle system messages', () => {
    const message: WebSocketMessage = {
      type: 'system',
      data: {
        event: 'test',
        content: 'system message',
        payload: {},
        timestamp: Date.now()
      }
    }

    const handler = vi.fn()
    client.on('system', handler)
    client.handleMessage(message)

    expect(handler).toHaveBeenCalledWith({ type: 'system', message })
  })

  it('should handle auth messages', () => {
    const message: WebSocketMessage = {
      type: 'auth',
      data: {
        token: 'test-token',
        userId: 'test-user',
        content: 'auth',
        timestamp: Date.now()
      }
    }

    const handler = vi.fn()
    client.on('auth', handler)
    client.handleMessage(message)

    expect(handler).toHaveBeenCalledWith({ type: 'auth', message })
  })
}) 