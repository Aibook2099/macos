import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react-dom/test-utils'
import userEvent from '@testing-library/user-event'
import { ChatProvider, useChat } from '../ChatContext'
import { RoleProvider } from '../RoleContext'

// Type definitions
interface MockMessage {
  id: string
  text: string
  sender: string
  roleId: string
  timestamp: string
}

interface MockConversation {
  id: string
  roleId: string
  messages: MockMessage[]
  createdAt: string
  updatedAt: string
}

interface MockResponse {
  ok: boolean
  json: () => Promise<{ conversation: MockConversation | null }>
}

// Test component
const TestComponent = () => {
  const { currentConversation, sendMessage, conversations, error } = useChat()
  return (
    <div>
      <div data-testid="current-conversation">{currentConversation?.id || 'none'}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
      <div data-testid="error">{error || 'none'}</div>
      <button onClick={() => sendMessage('Hello!')}>Send Message</button>
    </div>
  )
}

const TEST_TOKEN = 'test-token'

describe('ChatContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', TEST_TOKEN)
    // Mock RoleContext
    vi.mock('../RoleContext', () => ({
      RoleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useRole: vi.fn().mockReturnValue({ selectedRole: 'user' }),
    }))
    // Mock fetch
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it('should initialize with empty conversations', async () => {
    const mockResponse: MockResponse = {
      ok: true,
      json: () => Promise.resolve({ conversation: null }),
    }
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce(mockResponse as Response)

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('none')
      expect(screen.getByTestId('conversations-count')).toHaveTextContent('0')
    })
  })

  it('should handle sending messages', async () => {
    const mockInitialConversation: MockConversation = {
      id: '456',
      roleId: 'user',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockMessage: MockMessage = {
      id: '123',
      text: 'Hello!',
      sender: 'user',
      roleId: 'user',
      timestamp: new Date().toISOString(),
    }

    const mockResponse1: MockResponse = {
      ok: true,
      json: () => Promise.resolve({ conversation: mockInitialConversation }),
    }

    const mockResponse2: MockResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          conversation: {
            ...mockInitialConversation,
            messages: [mockMessage],
          },
        }),
    }

    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch
      .mockResolvedValueOnce(mockResponse1 as Response)
      .mockResolvedValueOnce(mockResponse2 as Response)

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    // Wait for initial conversation
    await waitFor(() => {
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('456')
    })

    // Send message
    await act(async () => {
      await userEvent.click(screen.getByText('Send Message'))
    })

    // Verify state update
    await waitFor(
      () => {
        expect(screen.getByTestId('conversations-count')).toHaveTextContent('1')
        expect(screen.getByTestId('current-conversation')).toHaveTextContent('456')
      },
      { timeout: 3000 }
    )
  })

  it('should handle error when no selectedRole', async () => {
    vi.mock('../RoleContext', () => ({
      RoleProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useRole: vi.fn().mockReturnValue({ selectedRole: null }),
    }))

    const mockInitialConversation: MockConversation = {
      id: '456',
      roleId: 'user',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockResponse: MockResponse = {
      ok: true,
      json: () => Promise.resolve({ conversation: mockInitialConversation }),
    }

    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValueOnce(mockResponse as Response)

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('456')
    })

    await act(async () => {
      await userEvent.click(screen.getByText('Send Message'))
    })

    await waitFor(
      () => {
        expect(screen.getByTestId('error')).toHaveTextContent('No conversation or role selected')
      },
      { timeout: 3000 }
    )
  })

  it('should handle concurrent message sends', async () => {
    const mockInitialConversation: MockConversation = {
      id: '456',
      roleId: 'user',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockResponse: MockResponse = {
      ok: true,
      json: () => Promise.resolve({ conversation: mockInitialConversation }),
    }

    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValue(mockResponse as Response)

    render(
      <RoleProvider>
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      </RoleProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-conversation')).toHaveTextContent('456')
    })

    // Simulate concurrent sends
    await act(async () => {
      const sendButton = screen.getByText('Send Message')
      await Promise.all([
        userEvent.click(sendButton),
        userEvent.click(sendButton),
      ])
    })

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledTimes(3) // Initial fetch + 2 sends
      },
      { timeout: 3000 }
    )
  })
}) 