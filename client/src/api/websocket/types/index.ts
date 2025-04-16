export interface WebSocketMessageData {
  content: string;
  timestamp?: number;
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  data: WebSocketMessageData & {
    timestamp: number;
  };
}

export interface BatchMessage {
  type: 'batch';
  data: WebSocketMessageData & {
    messages: WebSocketMessage[];
    count: number;
  };
}

export interface ErrorMessage {
  type: 'error';
  data: WebSocketMessageData & {
    code: string;
    message: string;
  };
}

export interface AuthMessage {
  type: 'auth';
  data: WebSocketMessageData & {
    token: string;
    userId: string;
  };
}

export interface AuthResponse {
  type: 'auth_response';
  data: WebSocketMessageData & {
    success: boolean;
    error: string | null;
  };
}

export interface SystemMessage {
  type: 'system';
  data: WebSocketMessageData & {
    event: string;
    payload: Record<string, unknown>;
  };
}

export interface ChatMessageData extends WebSocketMessageData {
  messageId: string;
  conversationId: string;
}

export interface ChatMessage {
  type: 'chat';
  data: ChatMessageData;
}

export interface ChatResponse {
  type: 'chat_response';
  data: ChatMessageData;
}

export interface GenericMessage {
  type: string;
  data: WebSocketMessageData & {
    [key: string]: unknown;
  };
}

export type WebSocketMessage = 
  | HeartbeatMessage 
  | BatchMessage 
  | ErrorMessage 
  | AuthMessage 
  | AuthResponse 
  | SystemMessage
  | ChatMessage
  | ChatResponse
  | GenericMessage;

export type WebSocketEventType = 'message' | 'error' | 'open' | 'close' | 'heartbeat' | 'auth' | 'system';

export interface WebSocketEvent {
  type: WebSocketEventType;
  message: WebSocketMessage;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxRetries?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export type WebSocketState = 'connecting' | 'open' | 'closing' | 'closed';

export type WebSocketEventHandler = (event: WebSocketEvent) => void; 