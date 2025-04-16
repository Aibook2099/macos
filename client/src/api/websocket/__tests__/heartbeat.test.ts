import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HeartbeatManager } from '../heartbeat'
import { HeartbeatMessage } from '../messages'
import { WebSocketClientImpl } from '../client'

describe('HeartbeatManager', () => {
  let heartbeatManager: HeartbeatManager
  let mockClient: WebSocketClientImpl
  let mockCallback: (message: HeartbeatMessage) => void

  beforeEach(() => {
    vi.useFakeTimers()
    mockClient = {
      isConnected: vi.fn().mockReturnValue(true),
      send: vi.fn(),
      onHeartbeat: vi.fn(),
      reconnect: vi.fn()
    } as unknown as WebSocketClientImpl
    heartbeatManager = new HeartbeatManager(mockClient)
    mockCallback = vi.fn()
    // @ts-expect-error - Accessing private property for testing
    heartbeatManager.onHeartbeat = mockCallback
  })

  afterEach(() => {
    vi.useRealTimers()
    heartbeatManager.stop()
  })

  it('should start and stop heartbeat', () => {
    vi.advanceTimersByTime(30000) // Advance by heartbeat interval
    expect(mockClient.send).toHaveBeenCalled()

    heartbeatManager.stop()
    vi.advanceTimersByTime(30000)
    expect(mockClient.send).toHaveBeenCalledTimes(1) // Should not increase
  })

  it('should handle heartbeat response', () => {
    const message: HeartbeatMessage = {
      type: 'heartbeat',
      data: { timestamp: Date.now() },
      timestamp: Date.now()
    }
    // @ts-expect-error - Accessing private method for testing
    heartbeatManager.handleHeartbeatResponse(message)
    // @ts-expect-error - Accessing private property for testing
    expect(heartbeatManager.lastHeartbeatTime).toBe(message.data.timestamp)
  })

  it('should check connection health', () => {
    // @ts-expect-error - Accessing private method for testing
    expect(heartbeatManager.checkTimeout()).toBe(true)

    // Simulate missed heartbeats
    for (let i = 0; i < 3; i++) {
      vi.advanceTimersByTime(60000) // 2 * heartbeat interval
    }

    // @ts-expect-error - Accessing private method for testing
    expect(heartbeatManager.checkTimeout()).toBe(false)
  })

  it('should reset state', () => {
    heartbeatManager.reset()
    // @ts-expect-error - Accessing private property for testing
    expect(heartbeatManager.retryCount).toBe(0)
    // @ts-expect-error - Accessing private property for testing
    expect(heartbeatManager.lastHeartbeatTime).toBeGreaterThan(0)
  })
}) 