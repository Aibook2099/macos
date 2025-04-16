import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketClientImpl } from '../client';
import { WebSocketMessage } from '../../../../shared/types/websocket';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public onopen: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.({});
    }, 0);
  }

  send(data: string): void {}
  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({});
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketClient', () => {
  let client: WebSocketClientImpl;
  const url = 'ws://localhost:8080';

  beforeEach(() => {
    client = new WebSocketClientImpl(url);
    vi.useFakeTimers();
  });

  it('should connect to WebSocket server', () => {
    const connectSpy = vi.spyOn(client, 'connect');
    client.connect();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle connection success', () => {
    client.connect();
    vi.runAllTimers();
    expect(client.isConnected()).toBe(true);
  });

  it('should handle disconnection', () => {
    client.connect();
    vi.runAllTimers();
    client.disconnect();
    expect(client.isConnected()).toBe(false);
  });

  it('should send messages when connected', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'ping'
      }
    };

    client.connect();
    vi.runAllTimers();
    client.send(message);
    expect(client.isConnected()).toBe(true);
  });

  it('should not send messages when disconnected', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'ping'
      }
    };

    client.connect();
    vi.runAllTimers();
    client.disconnect();
    client.send(message);
    expect(client.isConnected()).toBe(false);
  });
}); 