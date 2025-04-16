import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { ChatProvider, useChat } from '../ChatContext'
import { RoleProvider } from '../RoleContext'

// Test component that uses the chat context
const TestComponent = () => {
  const { conversations, currentConversation, isLoading, error } = useChat()
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
      <div data-testid="current-conversation">{currentConversation?.id || 'null'}</div>
    </div>
  )
}

describe('ChatContext - Initialization', () => {
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

  it('should show loading state while fetching conversations', async () => {
    global.fetch = vi.fn().mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('true')
  })

  it('should fetch conversations on mount with valid token', async () => {
    const mockConversations = [{
      id: '123',
      roleId: 'user',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }]

    localStorage.setItem('token', 'test-token')
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ conversations: mockConversations })
      })
    )

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

  it('should handle fetch error', async () => {
    localStorage.setItem('token', 'test-token')
    global.fetch = vi.fn().mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to fetch conversations' })
      })
    )

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch conversations')
    })
  })

  it('should handle missing token', async () => {
    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('No authentication token found')
    })
  })
}) 