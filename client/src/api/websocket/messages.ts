import type { 
  WebSocketMessage, 
  HeartbeatMessage, 
  BatchMessage, 
  ErrorMessage, 
  AuthMessage, 
  AuthResponse, 
  SystemMessage,
  SystemMessageType
} from './types';

// Type guards
export function isHeartbeatMessage(message: WebSocketMessage): message is HeartbeatMessage {
  return message.type === 'heartbeat';
}

export function isBatchMessage(message: WebSocketMessage): message is BatchMessage {
  return message.type === 'batch';
}

export function isErrorMessage(message: WebSocketMessage): message is ErrorMessage {
  return message.type === 'error';
}

export function isAuthMessage(message: WebSocketMessage): message is AuthMessage {
  return message.type === 'auth';
}

export function isAuthResponse(message: WebSocketMessage): message is AuthResponse {
  return message.type === 'auth_response';
}

export function isSystemMessage(message: WebSocketMessage): message is SystemMessage {
  return message.type === 'system';
}

export function isSystemMessageType(type: string): type is SystemMessageType {
  return ['connected', 'disconnected', 'reconnecting', 'error'].includes(type);
} 