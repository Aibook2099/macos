import { describe, it, expect } from 'vitest';
import { isHeartbeatMessage, isBatchMessage, isErrorMessage, isAuthMessage, isAuthResponse, isSystemMessage, isSystemMessageType } from '../messages';
import type { HeartbeatMessage, BatchMessage, ErrorMessage, AuthMessage, AuthResponse, SystemMessage } from '../types';

describe('Message Type Guards', () => {
  describe('Heartbeat Messages', () => {
    it('should identify valid heartbeat messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'heartbeat',
          timestamp: Date.now()
        }
      };
      expect(isHeartbeatMessage(message)).toBe(true);
    });

    it('should reject non-heartbeat messages', () => {
      const message = {
        type: 'other',
        data: {
          content: 'not a heartbeat'
        }
      };
      expect(isHeartbeatMessage(message)).toBe(false);
    });
  });

  describe('Batch Messages', () => {
    it('should identify valid batch messages', () => {
      const message: BatchMessage = {
        type: 'batch',
        data: {
          content: 'batch',
          messages: [],
          count: 0
        }
      };
      expect(isBatchMessage(message)).toBe(true);
    });

    it('should reject non-batch messages', () => {
      const message = {
        type: 'other',
        data: {
          content: 'not a batch'
        }
      };
      expect(isBatchMessage(message)).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should identify valid error messages', () => {
      const message: ErrorMessage = {
        type: 'error',
        data: {
          content: 'error',
          code: 'ERROR_CODE',
          message: 'Error message'
        }
      };
      expect(isErrorMessage(message)).toBe(true);
    });

    it('should reject non-error messages', () => {
      const message = {
        type: 'other',
        data: {
          content: 'not an error'
        }
      };
      expect(isErrorMessage(message)).toBe(false);
    });
  });

  describe('Auth Messages', () => {
    it('should identify valid auth messages', () => {
      const message: AuthMessage = {
        type: 'auth',
        data: {
          content: 'auth',
          token: 'test-token',
          userId: 'test-user'
        }
      };
      expect(isAuthMessage(message)).toBe(true);
    });

    it('should identify valid auth responses', () => {
      const message: AuthResponse = {
        type: 'auth_response',
        data: {
          content: 'auth_response',
          success: true,
          error: null
        }
      };
      expect(isAuthResponse(message)).toBe(true);
    });

    it('should reject non-auth messages', () => {
      const message = {
        type: 'other',
        data: {
          content: 'not an auth message'
        }
      };
      expect(isAuthMessage(message)).toBe(false);
      expect(isAuthResponse(message)).toBe(false);
    });
  });

  describe('System Messages', () => {
    it('should identify valid system messages', () => {
      const message: SystemMessage = {
        type: 'system',
        data: {
          content: 'system',
          event: 'connected',
          payload: {}
        }
      };
      expect(isSystemMessage(message)).toBe(true);
    });

    it('should reject non-system messages', () => {
      const message = {
        type: 'other',
        data: {
          content: 'not a system message'
        }
      };
      expect(isSystemMessage(message)).toBe(false);
    });

    it('should identify valid system message types', () => {
      expect(isSystemMessageType('connected')).toBe(true);
      expect(isSystemMessageType('disconnected')).toBe(true);
      expect(isSystemMessageType('reconnecting')).toBe(true);
      expect(isSystemMessageType('error')).toBe(true);
    });

    it('should reject invalid system message types', () => {
      expect(isSystemMessageType('invalid')).toBe(false);
    });
  });
}); 