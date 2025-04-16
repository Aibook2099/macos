import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageQueue } from '../queue';
import { HeartbeatMessage, AuthMessage } from '../messages';

describe('MessageQueue', () => {
  let queue: MessageQueue;
  const defaultConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    batchTimeout: 500,
    ttl: 30000,
  };

  beforeEach(() => {
    queue = new MessageQueue(defaultConfig);
    vi.useFakeTimers();
  });

  describe('Basic Operations', () => {
    it('should enqueue and process messages in order', () => {
      const messages: HeartbeatMessage[] = [
        {
          type: 'heartbeat',
          data: { timestamp: 1, content: 'Heartbeat 1' }
        },
        {
          type: 'heartbeat',
          data: { timestamp: 2, content: 'Heartbeat 2' }
        }
      ];

      messages.forEach(msg => queue.enqueue(msg));
      expect(queue.size).toBe(2);
      expect(queue.dequeue()).toEqual(messages[0]);
      expect(queue.dequeue()).toEqual(messages[1]);
    });

    it('should handle priority messages', () => {
      const lowPriority: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: 1, content: 'Low Priority' }
      };
      const highPriority: AuthMessage = {
        type: 'auth',
        data: { token: 'token', userId: 'user', content: 'High Priority' }
      };

      queue.enqueue(lowPriority);
      queue.enqueue(highPriority, { priority: 'high' });
      
      expect(queue.dequeue()).toEqual(highPriority);
      expect(queue.dequeue()).toEqual(lowPriority);
    });
  });

  describe('Message Expiration', () => {
    it('should expire messages after TTL', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Expiring Message' }
      };

      queue.enqueue(message);
      vi.advanceTimersByTime(defaultConfig.ttl + 1);
      
      expect(queue.dequeue()).toBeNull();
    });

    it('should not expire messages before TTL', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Valid Message' }
      };

      queue.enqueue(message);
      vi.advanceTimersByTime(defaultConfig.ttl - 1);
      
      expect(queue.dequeue()).toEqual(message);
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed messages', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Retry Message' }
      };

      queue.enqueue(message);
      queue.markFailed(message);
      
      expect(queue.dequeue()).toEqual(message);
      expect(queue.getStats().failedMessages).toBe(1);
    });

    it('should drop messages after max retries', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Max Retries Message' }
      };

      queue.enqueue(message);
      for (let i = 0; i < defaultConfig.maxRetries; i++) {
        queue.markFailed(message);
      }
      
      expect(queue.dequeue()).toBeNull();
      expect(queue.getStats().droppedMessages).toBe(1);
    });
  });

  describe('Batch Operations', () => {
    it('should batch messages within timeout', () => {
      const messages: HeartbeatMessage[] = [
        {
          type: 'heartbeat',
          data: { timestamp: 1, content: 'Batch 1' }
        },
        {
          type: 'heartbeat',
          data: { timestamp: 2, content: 'Batch 2' }
        }
      ];

      messages.forEach(msg => queue.enqueue(msg));
      vi.advanceTimersByTime(defaultConfig.batchTimeout);
      
      const batch = queue.dequeueBatch();
      expect(batch).toHaveLength(2);
      expect(batch).toEqual(messages);
    });

    it('should not batch messages after timeout', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Late Message' }
      };

      vi.advanceTimersByTime(defaultConfig.batchTimeout + 1);
      queue.enqueue(message);
      
      const batch = queue.dequeueBatch();
      expect(batch).toHaveLength(1);
    });
  });

  describe('Queue Management', () => {
    it('should clear the queue', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Clear Message' }
      };

      queue.enqueue(message);
      queue.clear();
      
      expect(queue.size).toBe(0);
      expect(queue.dequeue()).toBeNull();
    });

    it('should provide accurate queue statistics', () => {
      const message: HeartbeatMessage = {
        type: 'heartbeat',
        data: { timestamp: Date.now(), content: 'Stats Message' }
      };

      queue.enqueue(message);
      queue.markFailed(message);
      queue.dequeue();
      
      const stats = queue.getStats();
      expect(stats.totalMessages).toBe(1);
      expect(stats.failedMessages).toBe(1);
      expect(stats.processedMessages).toBe(1);
    });
  });
}); 