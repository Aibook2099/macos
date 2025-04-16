/// <reference types="@cloudflare/workers-types" />

export interface Env {
  // KV namespaces
  USER_PROFILES: KVNamespace;
  CONVERSATIONS: KVNamespace;
  MESSAGES: KVNamespace;
  SYSTEM_PROMPTS: KVNamespace;
  USER_SETTINGS: KVNamespace;
  ANALYTICS: KVNamespace;
  ERROR_LOGS: KVNamespace;
  AUDIT_LOGS: KVNamespace;
  CACHE: KVNamespace;
  TEMP_STORAGE: KVNamespace;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  timezone: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  userId: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  type: string;
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  details: Record<string, any>;
} 