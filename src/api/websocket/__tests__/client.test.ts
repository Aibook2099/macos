import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClientImpl } from '../client';
import { WebSocketConfig } from '../types';
import { MessageQueue } from '../queue';
import { AuthMessage, HeartbeatMessage } from '../messages';

// Mock WebSocket
const mockWebSocket = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 0,
};

// Mock global WebSocket
global.WebSocket = vi.fn(() => mockWebSocket) as any;

describe('WebSocketClient', () => {
  let client: WebSocketClientImpl;
  const config: WebSocketConfig = {
    url: 'ws://localhost:8080',
    heartbeatInterval: 30000,
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
  };

  beforeEach(() => {
    client = new WebSocketClientImpl(config);
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.disconnect();
  });

  describe('Connection', () => {
    it('should connect to WebSocket server', () => {
      client.connect();
      expect(global.WebSocket).toHaveBeenCalledWith(config.url);
    });

    it('should handle connection open', () => {
      const onOpen = vi.fn();
      client.on('open', onOpen);
      client.connect();
      
      // Simulate connection open
      const openEvent = new Event('open');
      mockWebSocket.addEventListener.mock.calls[0][1](openEvent);
      
      expect(onOpen).toHaveBeenCalled();
      expect(client.isConnected()).toBe(true);
    });

    it('should handle connection close', () => {
      const onClose = vi.fn();
      client.on('close', onClose);
      client.connect();
      
      // Simulate connection close
      const closeEvent = new CloseEvent('close', { code: 1000 });
      mockWebSocket.addEventListener.mock.calls[1][1](closeEvent);
      
      expect(onClose).toHaveBeenCalled();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('should send messages when connected', () => {
      client.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      const message: AuthMessage = {
        type: 'auth',
        data: {
          token: 'test-token',
          userId: 'user-123',
          content: 'Authentication request'
        }
      };
      
      client.send(message);
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should queue messages when disconnected', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          timestamp: Date.now(),
          content: 'Heartbeat'
        }
      };
      
      client.send(message);
      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    it('should process queued messages on reconnect', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          timestamp: Date.now(),
          content: 'Heartbeat'
        }
      };
      
      client.send(message);
      client.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      // Simulate connection open
      const openEvent = new Event('open');
      mockWebSocket.addEventListener.mock.calls[0][1](openEvent);
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  describe('Heartbeat', () => {
    it('should send heartbeat messages', () => {
      client.connect();
      mockWebSocket.readyState = WebSocket.OPEN;
      
      // Advance timers by heartbeat interval
      vi.advanceTimersByTime(config.heartbeatInterval);
      
      expect(mockWebSocket.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('heartbeat');
    });
  });

  describe('Reconnection', () => {
    it('should attempt to reconnect on connection loss', () => {
      client.connect();
      
      // Simulate connection close
      const closeEvent = new CloseEvent('close', { code: 1006 });
      mockWebSocket.addEventListener.mock.calls[1][1](closeEvent);
      
      // Advance timers by reconnect interval
      vi.advanceTimersByTime(config.reconnectInterval);
      
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('should stop reconnecting after max attempts', () => {
      client.connect();
      
      // Simulate multiple connection failures
      for (let i = 0; i < config.maxReconnectAttempts + 1; i++) {
        const closeEvent = new CloseEvent('close', { code: 1006 });
        mockWebSocket.addEventListener.mock.calls[1][1](closeEvent);
        vi.advanceTimersByTime(config.reconnectInterval);
      }
      
      expect(global.WebSocket).toHaveBeenCalledTimes(config.maxReconnectAttempts + 1);
    });
  });
}); 