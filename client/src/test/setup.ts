import '@testing-library/jest-dom/vitest'
import { vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((this: WebSocket, ev: Event) => void) | null = null
  onmessage: ((this: WebSocket, ev: MessageEvent) => void) | null = null
  onerror: ((this: WebSocket, ev: Event) => void) | null = null
  onclose: ((this: WebSocket, ev: CloseEvent) => void) | null = null
  url: string

  constructor(url: string) {
    this.url = url
  }

  send = vi.fn()
  close = vi.fn()
}

Object.defineProperty(window, 'WebSocket', {
  value: MockWebSocket,
})

// Mock fetch
global.fetch = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Clear mocks, localStorage, and reset fetch before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  global.fetch = vi.fn()
  vi.useFakeTimers()
})

// Restore mocks and cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
}) 