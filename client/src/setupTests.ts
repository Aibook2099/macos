import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'
import { vi } from 'vitest'

// 扩展 expect 匹配器
expect.extend(matchers)

// 在每个测试后清理
afterEach(() => {
  cleanup()
})

// 模拟 ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// 模拟 matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock fetch
global.fetch = vi.fn()

// Mock WebSocket
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.readyState = MockWebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      if (this.onerror) {
        this.onerror(new Event('error'));
      }
      return;
    }
    // Mock successful send
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }));
      }
    }, 0);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  addEventListener(event: string, handler: Function) {
    switch (event) {
      case 'open':
        this.onopen = handler as (event: Event) => void;
        break;
      case 'close':
        this.onclose = handler as (event: CloseEvent) => void;
        break;
      case 'error':
        this.onerror = handler as (event: Event) => void;
        break;
      case 'message':
        this.onmessage = handler as (event: MessageEvent) => void;
        break;
    }
  }

  removeEventListener(event: string, handler: Function) {
    switch (event) {
      case 'open':
        if (this.onopen === handler) this.onopen = null;
        break;
      case 'close':
        if (this.onclose === handler) this.onclose = null;
        break;
      case 'error':
        if (this.onerror === handler) this.onerror = null;
        break;
      case 'message':
        if (this.onmessage === handler) this.onmessage = null;
        break;
    }
  }
}

global.WebSocket = MockWebSocket as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
}) 