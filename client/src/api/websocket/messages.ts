import type { 
  SystemMessages,
  HeartbeatMessage, 
  BatchMessage, 
  ErrorMessage, 
  AuthMessage, 
  AuthResponse, 
  SystemMessage,
  SystemMessageType,
  ChatMessage,
  ChatResponse
} from './types';

// Type guards
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

export function isSystemMessageType(type: string): type is SystemMessageType {
  return ['connected', 'disconnected', 'reconnecting', 'error'].includes(type);
} 