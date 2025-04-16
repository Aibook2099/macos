import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { ChatProvider, useChat } from '../ChatContext'
import { RoleProvider } from '../RoleContext'
import { WebSocketClientImpl } from '../../api/websocket/client'
import { 
  WebSocketEvent, 
  WebSocketMessage, 
  WebSocketEventHandler,
  WebSocketEventType,
  ChatMessage,
  ChatResponse,
  HeartbeatMessage,
  BatchMessage,
  ErrorMessage,
  SystemMessage
} from '../../api/websocket/types'
import userEvent from '@testing-library/user-event'

// Mock WebSocketClientImpl
vi.mock('../../api/websocket/client', () => ({
  WebSocketClientImpl: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
  })),
}))

// Test component that uses the chat context
const TestComponent = () => {
  const { conversations, currentConversation, isLoading, error, sendMessage, clearConversation } = useChat()
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
      <div data-testid="current-conversation">{currentConversation?.id || 'null'}</div>
      <button onClick={() => sendMessage('Hello!')}>Send Message</button>
      <button onClick={clearConversation}>Clear Conversation</button>
    </div>
  )
}

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize with empty conversations', () => {
    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
    expect(screen.getByTestId('conversations-count')).toHaveTextContent('0')
    expect(screen.getByTestId('current-conversation')).toHaveTextContent('null')
  })

  it('should handle sending messages', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'test-token')

    // Define initial conversation
    const initialConversation = {
      id: '456',
      roleId: 'user',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Mock fetch API calls
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ conversation: initialConversation })
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              conversation: {
                ...initialConversation,
                messages: [
                  {
                    id: '123',
                    text: 'Hello!',
                    sender: 'user',
                    roleId: 'user',
                    timestamp: new Date().toISOString()
                  }
                ]
              }
            })
        })
      )

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Wait for initial conversation to load
    await waitFor(() => {
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('456')
    }, { timeout: 3000 })

    // Send message
    await act(async () => {
      await userEvent.click(screen.getByText('Send Message'))
    })

    // Verify state updates
    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('456')
    }, { timeout: 3000 })

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations/456/messages'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        })
      })
    )
  })

  it('should handle clearing conversation', () => {
    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    act(() => {
      screen.getByText('Clear Conversation').click()
    })

    expect(screen.getByTestId('current-conversation')).toHaveTextContent('null')
  })

  it('should handle WebSocket errors', async () => {
    const mockWebSocketClient = new WebSocketClientImpl({ url: 'ws://localhost' })
    const errorMessage = 'WebSocket connection failed'

    vi.mocked(mockWebSocketClient.on).mockImplementationOnce((eventType: string, handler: WebSocketEventHandler) => {
      if (eventType === 'error') {
        const errorMsg: ErrorMessage = {
          type: 'error',
          data: {
            code: 'CONNECTION_ERROR',
            message: errorMessage,
            content: errorMessage
          }
        }
        const event: WebSocketEvent = {
          type: 'error',
          message: errorMsg
        }
        handler(event)
      }
    })

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
    })
  })

  it('should handle heartbeat messages', async () => {
    const mockWebSocketClient = new WebSocketClientImpl({ url: 'ws://localhost' })

    vi.mocked(mockWebSocketClient.on).mockImplementationOnce((eventType: string, handler: WebSocketEventHandler) => {
      if (eventType === 'message') {
        const heartbeat: HeartbeatMessage = {
          type: 'heartbeat',
          data: {
            content: 'heartbeat',
            timestamp: Date.now()
          }
        }
        const event: WebSocketEvent = {
          type: 'message',
          message: heartbeat
        }
        handler(event)
      }
    })

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('null')
    })
  })

  it('should handle batch messages', async () => {
    const mockWebSocketClient = new WebSocketClientImpl({ url: 'ws://localhost' })

    vi.mocked(mockWebSocketClient.on).mockImplementationOnce((eventType: string, handler: WebSocketEventHandler) => {
      if (eventType === 'message') {
        const batchMsg: BatchMessage = {
          type: 'batch',
          data: {
            messages: [
              {
                type: 'chat_response',
                data: {
                  content: 'First message',
                  messageId: '123',
                  conversationId: '456',
                  timestamp: Date.now()
                }
              },
              {
                type: 'chat_response',
                data: {
                  content: 'Second message',
                  messageId: '124',
                  conversationId: '456',
                  timestamp: Date.now()
                }
              }
            ],
            count: 2,
            content: 'Batch of messages'
          }
        }
        const event: WebSocketEvent = {
          type: 'message',
          message: batchMsg
        }
        handler(event)
      }
    })

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('2')
    })
  })

  it('should handle system messages', async () => {
    const mockWebSocketClient = new WebSocketClientImpl({ url: 'ws://localhost' })

    vi.mocked(mockWebSocketClient.on).mockImplementationOnce((eventType: string, handler: WebSocketEventHandler) => {
      if (eventType === 'message') {
        const systemMsg: SystemMessage = {
          type: 'system',
          data: {
            event: 'user_joined',
            payload: { userId: '123' },
            content: 'User joined'
          }
        }
        const event: WebSocketEvent = {
          type: 'message',
          message: systemMsg
        }
        handler(event)
      }
    })

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Wait for state updates
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('null')
    })
  })
}) 