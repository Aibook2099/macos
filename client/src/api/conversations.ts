import { get, post } from './client'

export interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  roleId: string
  timestamp: string
}

export interface Conversation {
  id: string
  roleId: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

export interface CreateConversationData {
  roleId: string
}

export interface SendMessageData {
  text: string
  roleId: string
}

export const conversationsApi = {
  getAll: async (): Promise<{ conversations: Conversation[] }> => {
    return get<{ conversations: Conversation[] }>('/conversations')
  },

  getById: async (id: string): Promise<{ conversation: Conversation }> => {
    return get<{ conversation: Conversation }>(`/conversations/${id}`)
  },

  create: async (data: CreateConversationData): Promise<{ conversation: Conversation }> => {
    return post<{ conversation: Conversation }>('/conversations', data)
  },

  sendMessage: async (
    conversationId: string,
    data: SendMessageData
  ): Promise<{ conversation: Conversation }> => {
    return post<{ conversation: Conversation }>(
      `/conversations/${conversationId}/messages`,
      data
    )
  },
} 