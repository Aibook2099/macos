import { describe, it, expect, beforeEach } from 'vitest';
import { MessageQueue } from '../queue';
import { WebSocketMessage } from '../../../../shared/types/websocket';

describe('MessageQueue', () => {
  let queue: MessageQueue;

  beforeEach(() => {
    queue = new MessageQueue();
  });

  it('should enqueue messages', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'ping'
      }
    };

    queue.enqueue(message);
    expect(queue.getQueueLength()).toBe(1);
  });

  it('should process messages in order of priority', () => {
    const lowPriorityMessage: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'low'
      }
    };

    const highPriorityMessage: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'high'
      }
    };

    queue.enqueue(lowPriorityMessage, { priority: 0 });
    queue.enqueue(highPriorityMessage, { priority: 1 });

    const processed = queue.processQueue();
    expect(processed[0].message.data.content).toBe('high');
  });

  it('should remove expired messages', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'test'
      }
    };

    queue.enqueue(message, { ttl: 0 }); // 立即过期
    expect(queue.getQueueLength()).toBe(0);
  });

  it('should provide queue statistics', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'test'
      }
    };

    queue.enqueue(message, { priority: 1 });
    const stats = queue.getQueueStats();

    expect(stats.total).toBe(1);
    expect(stats.highPriority).toBe(1);
    expect(stats.expired).toBe(0);
  });

  it('should clear the queue', () => {
    const message: WebSocketMessage = {
      type: 'heartbeat',
      data: {
        timestamp: Date.now(),
        content: 'test'
      }
    };

    queue.enqueue(message);
    queue.clear();
    expect(queue.getQueueLength()).toBe(0);
  });
}); 