import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSocketAuth } from '../auth';
import { AuthMessage, AuthResponse } from '../messages';

describe('WebSocketAuth', () => {
  let auth: WebSocketAuth;
  const mockConfig = {
    token: 'test-token',
    userId: 'user-123'
  };

  beforeEach(() => {
    auth = new WebSocketAuth(mockConfig);
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should create valid auth message', () => {
      const message = auth.createAuthMessage();
      expect(message).toEqual({
        type: 'auth',
        data: {
          token: mockConfig.token,
          userId: mockConfig.userId,
          content: 'Authentication request'
        }
      });
    });

    it('should handle successful authentication', () => {
      const onAuthResult = vi.fn();
      auth.onAuthResult = onAuthResult;

      const response: AuthResponse = {
        type: 'auth_response',
        data: {
          success: true,
          error: null,
          content: 'Authentication successful'
        }
      };

      auth.handleAuthResponse(response);
      expect(onAuthResult).toHaveBeenCalledWith(response);
      expect(auth.isAuthenticated).toBe(true);
    });

    it('should handle failed authentication', () => {
      const onAuthResult = vi.fn();
      auth.onAuthResult = onAuthResult;

      const response: AuthResponse = {
        type: 'auth_response',
        data: {
          success: false,
          error: 'Invalid token',
          content: 'Authentication failed'
        }
      };

      auth.handleAuthResponse(response);
      expect(onAuthResult).toHaveBeenCalledWith(response);
      expect(auth.isAuthenticated).toBe(false);
    });
  });

  describe('Token Validation', () => {
    it('should validate token format', () => {
      expect(auth.isValidToken('valid-token-123')).toBe(true);
      expect(auth.isValidToken('')).toBe(false);
      expect(auth.isValidToken(null as any)).toBe(false);
    });

    it('should validate user ID format', () => {
      expect(auth.isValidUserId('user-123')).toBe(true);
      expect(auth.isValidUserId('')).toBe(false);
      expect(auth.isValidUserId(null as any)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid auth response', () => {
      const onAuthResult = vi.fn();
      auth.onAuthResult = onAuthResult;

      const invalidResponse = {
        type: 'auth_response',
        data: {
          success: true,
          error: null
        }
      };

      expect(() => auth.handleAuthResponse(invalidResponse as any)).toThrow();
      expect(onAuthResult).not.toHaveBeenCalled();
    });

    it('should handle missing callbacks', () => {
      const response: AuthResponse = {
        type: 'auth_response',
        data: {
          success: true,
          error: null,
          content: 'Authentication successful'
        }
      };

      expect(() => auth.handleAuthResponse(response)).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should reset authentication state', () => {
      auth.isAuthenticated = true;
      auth.reset();
      expect(auth.isAuthenticated).toBe(false);
    });

    it('should update authentication state', () => {
      auth.updateAuthState(true);
      expect(auth.isAuthenticated).toBe(true);
      auth.updateAuthState(false);
      expect(auth.isAuthenticated).toBe(false);
    });
  });
}); 