import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRole } from './RoleContext'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  roleId: string
  timestamp: string
}

interface Conversation {
  id: string
  roleId: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

interface ChatContextType {
  conversations: Conversation[]
  currentConversation: Conversation | null
  sendMessage: (text: string) => Promise<void>
  error: string | null
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 5000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { selectedRole } = useRole()

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        return
      }
      try {
        const response = await fetchWithTimeout('/api/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error('Failed to fetch conversations')
        const data = await response.json()
        setCurrentConversation(data.conversation)
        setConversations([data.conversation])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
      }
    }
    fetchConversations()
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!currentConversation || !selectedRole) {
        setError('No conversation or role selected')
        return
      }
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        return
      }
      try {
        const response = await fetchWithTimeout(
          `/api/conversations/${currentConversation.id}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, roleId: selectedRole }),
          }
        )
        if (!response.ok) throw new Error('Failed to send message')
        const data = await response.json()
        setCurrentConversation(data.conversation)
        setConversations((prev) =>
          prev.map((conv) => (conv.id === data.conversation.id ? data.conversation : conv))
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
      }
    },
    [currentConversation, selectedRole]
  )

  return (
    <ChatContext.Provider value={{ conversations, currentConversation, sendMessage, error }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
} 