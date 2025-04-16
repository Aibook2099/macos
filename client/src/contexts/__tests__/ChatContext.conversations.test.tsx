import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { ChatProvider, useChat } from '../ChatContext'
import { RoleProvider } from '../RoleContext'
import userEvent from '@testing-library/user-event'

// Test component that uses the chat context
const TestComponent = () => {
  const { conversations, currentConversation, isLoading, error, startConversation, clearConversation } = useChat()
  
  return (
    <div>
      <div data-testid="loading">{isLoading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
      <div data-testid="current-conversation">{currentConversation?.id || 'null'}</div>
      <button onClick={() => startConversation('test-role')}>Start Conversation</button>
      <button onClick={() => clearConversation()}>Clear Conversation</button>
    </div>
  )
}

describe('ChatContext - Conversation Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', 'test-token')
  })

  it('should handle starting a new conversation', async () => {
    const newConversation = {
      id: '789',
      roleId: 'test-role',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ conversation: newConversation })
        })
      )

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Start new conversation
    await act(async () => {
      await userEvent.click(screen.getByText('Start Conversation'))
    })

    // Verify state updates
    await waitFor(() => {
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('789')
    }, { timeout: 3000 })

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/conversations'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify({ roleId: 'test-role' })
      })
    )
  })

  it('should handle clearing a conversation', async () => {
    const initialConversation = {
      id: '456',
      roleId: 'user',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ conversation: initialConversation })
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

    // Clear conversation
    await act(async () => {
      await userEvent.click(screen.getByText('Clear Conversation'))
    })

    // Verify state updates
    await waitFor(() => {
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('null')
    }, { timeout: 3000 })
  })

  it('should handle conversation errors', async () => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Failed to start conversation' })
        })
      )

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Start new conversation
    await act(async () => {
      await userEvent.click(screen.getByText('Start Conversation'))
    })

    // Verify error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to start conversation')
    }, { timeout: 3000 })
  })
}) 