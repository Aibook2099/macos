export interface WebSocketMessageData {
  content: string;
  timestamp: number;
}

export interface HeartbeatData extends WebSocketMessageData {
  timestamp: number;
}

export interface HeartbeatMessage {
  type: 'heartbeat';
  data: HeartbeatData;
}

export interface BatchMessageData extends WebSocketMessageData {
  messages: WebSocketMessageData[];
  count: number;
}

export interface BatchMessage {
  type: 'batch';
  data: BatchMessageData;
}

export interface ErrorMessageData extends WebSocketMessageData {
  code: string;
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  data: ErrorMessageData;
}

export interface AuthMessageData extends WebSocketMessageData {
  token: string;
  userId: string;
}

export interface AuthMessage {
  type: 'auth';
  data: AuthMessageData;
}

export interface AuthResponseData extends WebSocketMessageData {
  success: boolean;
  error?: string;
}

export interface AuthResponse {
  type: 'auth_response';
  data: AuthResponseData;
}

export interface SystemMessageData extends WebSocketMessageData {
  event: string;
  payload: Record<string, unknown>;
}

export interface SystemMessage {
  type: 'system';
  data: SystemMessageData;
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

export type SystemMessageType = 
  | 'heartbeat'
  | 'batch'
  | 'error'
  | 'auth'
  | 'auth_response'
  | 'system'
  | 'chat'
  | 'chat_response';

export type SystemMessages = 
  | HeartbeatMessage
  | BatchMessage
  | ErrorMessage
  | AuthMessage
  | AuthResponse
  | SystemMessage
  | ChatMessage
  | ChatResponse;

export function isHeartbeatMessage(message: SystemMessages): message is HeartbeatMessage {
  return message.type === 'heartbeat';
}

export function isBatchMessage(message: SystemMessages): message is BatchMessage {
  return message.type === 'batch';
}

export function isErrorMessage(message: SystemMessages): message is ErrorMessage {
  return message.type === 'error';
}

export function isAuthMessage(message: SystemMessages): message is AuthMessage {
  return message.type === 'auth';
}

export function isAuthResponse(message: SystemMessages): message is AuthResponse {
  return message.type === 'auth_response';
}

export function isSystemMessage(message: SystemMessages): message is SystemMessage {
  return message.type === 'system';
}

export function isChatMessage(message: SystemMessages): message is ChatMessage {
  return message.type === 'chat';
}

export function isChatResponse(message: SystemMessages): message is ChatResponse {
  return message.type === 'chat_response';
}

export type WebSocketEvent = 
  | { type: 'message'; message: SystemMessages }
  | { type: 'heartbeat'; message: HeartbeatMessage }
  | { type: 'auth'; message: AuthMessage | AuthResponse }
  | { type: 'error'; message: ErrorMessage }
  | { type: 'system'; message: SystemMessage }
  | { type: 'chat'; message: ChatMessage | ChatResponse };

export type WebSocketEventHandler = (event: WebSocketEvent) => void;

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  maxRetries?: number;
  protocols?: string | string[];
  timeout?: number;
}

export type WebSocketState = 'connecting' | 'open' | 'closing' | 'closed';

export type WebSocketListener = (message: SystemMessages) => void; 