import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatProvider } from '../ChatContext';
import { AuthProvider } from '../AuthContext';
import type { WebSocketMessage } from '../../api/websocket/types';

describe('ChatContext', () => {
  const mockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.WebSocket = vi.fn(() => mockWebSocket) as any;
  });

  it('should connect to WebSocket on mount', () => {
    render(
      <AuthProvider>
        <ChatProvider>
          <div>Test</div>
        </ChatProvider>
      </AuthProvider>
    );

    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:3000/ws');
  });

  it('should send messages through WebSocket', async () => {
    render(
      <AuthProvider>
        <ChatProvider>
          <div>Test</div>
        </ChatProvider>
      </AuthProvider>
    );

    const message: WebSocketMessage = {
      type: 'chat',
      data: {
        content: 'Hello',
        timestamp: Date.now()
      }
    };

    await waitFor(() => {
      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });
  });

  it('should handle incoming messages', async () => {
    render(
      <AuthProvider>
        <ChatProvider>
          <div>Test</div>
        </ChatProvider>
      </AuthProvider>
    );

    const message: WebSocketMessage = {
      type: 'chat',
      data: {
        content: 'Hello',
        timestamp: Date.now()
      }
    };

    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(message)
    });

    mockWebSocket.addEventListener.mock.calls[0][1](messageEvent);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket errors', async () => {
    render(
      <AuthProvider>
        <ChatProvider>
          <div>Test</div>
        </ChatProvider>
      </AuthProvider>
    );

    const errorEvent = new ErrorEvent('error', {
      error: new Error('WebSocket error')
    });

    mockWebSocket.addEventListener.mock.calls[1][1](errorEvent);

    await waitFor(() => {
      expect(screen.getByText('Connection error')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket close', async () => {
    render(
      <AuthProvider>
        <ChatProvider>
          <div>Test</div>
        </ChatProvider>
      </AuthProvider>
    );

    const closeEvent = new CloseEvent('close', {
      code: 1000,
      reason: 'Normal closure'
    });

    mockWebSocket.addEventListener.mock.calls[2][1](closeEvent);

    await waitFor(() => {
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });
}); 