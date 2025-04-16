import { WebSocketMessage, QueuedMessage, BatchOptions } from '../../../shared/types/websocket';

export class MessageQueue {
  protected queue: QueuedMessage[] = [];
  private batchSize: number = 10;
  private batchTimeout: number = 1000;
  private batchTimer: NodeJS.Timeout | null = null;

  enqueue(message: WebSocketMessage, options: BatchOptions = {}): void {
    const queuedMessage: QueuedMessage = {
      message,
      timestamp: Date.now(),
      priority: options.priority || 0,
      ttl: options.ttl || 60000, // 默认 1 分钟过期
      retries: 0,
      maxRetries: options.maxRetries || 3
    };

    this.queue.push(queuedMessage);
    this.processQueue();
  }

  public processQueue(): QueuedMessage[] {
    // 移除过期消息
    this.removeExpiredMessages();

    // 按优先级排序
    this.queue.sort((a, b) => b.priority - a.priority);

    // 获取要处理的消息
    const messagesToProcess = this.queue.splice(0, this.batchSize);

    return messagesToProcess;
  }

  private removeExpiredMessages(): void {
    const now = Date.now();
    this.queue = this.queue.filter(message => {
      const messageAge = now - message.timestamp;
      return messageAge < message.ttl;
    });
  }

  clear(): void {
    this.queue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueStats() {
    return {
      total: this.queue.length,
      highPriority: this.queue.filter(m => m.priority > 0).length,
      expired: this.queue.filter(m => (Date.now() - m.timestamp) >= m.ttl).length
    };
  }
} 