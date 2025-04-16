import { describe, it, expect } from 'vitest'
import {
  HeartbeatMessage,
  BatchMessage,
  ErrorMessage,
  AuthMessage,
  AuthResponse,
  SystemMessage,
  isHeartbeatMessage,
  isBatchMessage,
  isErrorMessage,
  isAuthMessage,
  isAuthResponse,
  isSystemMessage,
  isSystemMessageType
} from '../../../../../shared/types/websocket'

describe('WebSocket Message Type Guards', () => {
  describe('Heartbeat Messages', () => {
    it('should identify valid heartbeat messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'heartbeat',
          timestamp: Date.now()
        }
      }
      expect(isHeartbeatMessage(message)).toBe(true)
    })

    it('should reject non-heartbeat messages', () => {
      const message: BatchMessage = {
        type: 'batch',
        data: {
          content: 'batch',
          timestamp: Date.now(),
          messages: [],
          count: 0
        }
      }
      expect(isHeartbeatMessage(message)).toBe(false)
    })
  })

  describe('Batch Messages', () => {
    it('should identify valid batch messages', () => {
      const message: BatchMessage = {
        type: 'batch',
        data: {
          content: 'batch',
          timestamp: Date.now(),
          messages: [],
          count: 0
        }
      }
      expect(isBatchMessage(message)).toBe(true)
    })

    it('should reject non-batch messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'heartbeat',
          timestamp: Date.now()
        }
      }
      expect(isBatchMessage(message)).toBe(false)
    })
  })

  describe('Error Messages', () => {
    it('should identify valid error messages', () => {
      const message: ErrorMessage = {
        type: 'error',
        data: {
          content: 'error',
          timestamp: Date.now(),
          code: 'ERROR_CODE',
          message: 'Error message'
        }
      }
      expect(isErrorMessage(message)).toBe(true)
    })

    it('should reject non-error messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'heartbeat',
          timestamp: Date.now()
        }
      }
      expect(isErrorMessage(message)).toBe(false)
    })
  })

  describe('Auth Messages', () => {
    it('should identify valid auth messages', () => {
      const message: AuthMessage = {
        type: 'auth',
        data: {
          content: 'auth',
          timestamp: Date.now(),
          token: 'token',
          userId: 'user123'
        }
      }
      expect(isAuthMessage(message)).toBe(true)
    })

    it('should identify valid auth responses', () => {
      const message: AuthResponse = {
        type: 'auth_response',
        data: {
          content: 'auth_response',
          timestamp: Date.now(),
          success: true
        }
      }
      expect(isAuthResponse(message)).toBe(true)
    })

    it('should reject non-auth messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'heartbeat',
          timestamp: Date.now()
        }
      }
      expect(isAuthMessage(message)).toBe(false)
      expect(isAuthResponse(message)).toBe(false)
    })
  })

  describe('System Messages', () => {
    it('should identify valid system messages', () => {
      const message: SystemMessage = {
        type: 'system',
        data: {
          content: 'system',
          timestamp: Date.now(),
          event: 'event',
          payload: {}
        }
      }
      expect(isSystemMessage(message)).toBe(true)
    })

    it('should reject non-system messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: {
          content: 'heartbeat',
          timestamp: Date.now()
        }
      }
      expect(isSystemMessage(message)).toBe(false)
    })
  })

  describe('System Message Types', () => {
    it('should identify valid system message types', () => {
      expect(isSystemMessageType('heartbeat')).toBe(true)
      expect(isSystemMessageType('batch')).toBe(true)
      expect(isSystemMessageType('error')).toBe(true)
      expect(isSystemMessageType('auth')).toBe(true)
      expect(isSystemMessageType('auth_response')).toBe(true)
      expect(isSystemMessageType('system')).toBe(true)
    })

    it('should reject invalid system message types', () => {
      expect(isSystemMessageType('invalid')).toBe(false)
      expect(isSystemMessageType('')).toBe(false)
      expect(isSystemMessageType('chat')).toBe(false)
    })
  })
}) 