import type { WebSocketMessage } from './types';

export enum MessagePriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum MessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

interface QueueMessage {
  message: WebSocketMessage;
  priority: MessagePriority;
  ttl?: number;
  retries: number;
  status: MessageStatus;
  messageId: string;
  timestamp: number;
}

interface QueueStats {
  total: number;
  highPriority: number;
  normalPriority: number;
  lowPriority: number;
  processing: number;
  failed: number;
  expired: number;
}

export class MessageQueue {
  private queue: QueueMessage[] = [];
  private processing = false;
  private sendMethod?: (message: WebSocketMessage | WebSocketMessage[]) => Promise<void>;
  private maxRetries: number;
  private retryInterval: number;
  private batchSize: number;
  private batchTimeout: number;
  private timer?: NodeJS.Timeout;

  constructor(
    maxRetries = 3,
    retryInterval = 1000,
    batchSize = 10,
    batchTimeout = 5000
  ) {
    this.maxRetries = maxRetries;
    this.retryInterval = retryInterval;
    this.batchSize = batchSize;
    this.batchTimeout = batchTimeout;
  }

  setSendMethod(sendMethod: (message: WebSocketMessage | WebSocketMessage[]) => Promise<void>) {
    this.sendMethod = sendMethod;
  }

  enqueue(message: WebSocketMessage, options: {
    priority?: MessagePriority;
    ttl?: number;
  } = {}) {
    const queueMessage: QueueMessage = {
      message,
      priority: options.priority || MessagePriority.NORMAL,
      ttl: options.ttl,
      retries: 0,
      status: MessageStatus.PENDING,
      messageId: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };

    this.queue.push(queueMessage);
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === MessagePriority.HIGH ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });

    if (!this.processing) {
      this.startProcessing();
    }
  }

  private async startProcessing() {
    if (this.processing || !this.sendMethod) return;

    this.processing = true;
    this.timer = setInterval(() => this.processQueue(), this.retryInterval);

    try {
      await this.processQueue();
    } catch (error) {
      console.error('Error processing queue:', error);
    }
  }

  private async processQueue() {
    if (!this.sendMethod) return;

    const now = Date.now();
    const batch: QueueMessage[] = [];
    const expired: QueueMessage[] = [];

    // 清理过期消息
    this.queue = this.queue.filter(msg => {
      if (msg.ttl && now - msg.timestamp > msg.ttl) {
        msg.status = MessageStatus.EXPIRED;
        expired.push(msg);
        return false;
      }
      return true;
    });

    // 收集待处理消息
    while (batch.length < this.batchSize && this.queue.length > 0) {
      const msg = this.queue.shift()!;
      if (msg.status === MessageStatus.PENDING || msg.status === MessageStatus.FAILED) {
        msg.status = MessageStatus.PROCESSING;
        batch.push(msg);
      }
    }

    if (batch.length > 0) {
      try {
        await this.sendMethod(batch.map(msg => msg.message));
        batch.forEach(msg => {
          msg.status = MessageStatus.SENT;
        });
      } catch (error) {
        batch.forEach(msg => {
          if (msg.retries < this.maxRetries) {
            msg.retries++;
            msg.status = MessageStatus.FAILED;
            this.queue.push(msg);
          } else {
            msg.status = MessageStatus.FAILED;
          }
        });
      }
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.processing = false;
  }

  getQueueStats(): QueueStats {
    const stats: QueueStats = {
      total: this.queue.length,
      highPriority: 0,
      normalPriority: 0,
      lowPriority: 0,
      processing: 0,
      failed: 0,
      expired: 0,
    };

    this.queue.forEach(msg => {
      switch (msg.priority) {
        case MessagePriority.HIGH:
          stats.highPriority++;
          break;
        case MessagePriority.NORMAL:
          stats.normalPriority++;
          break;
        case MessagePriority.LOW:
          stats.lowPriority++;
          break;
      }

      switch (msg.status) {
        case MessageStatus.PROCESSING:
          stats.processing++;
          break;
        case MessageStatus.FAILED:
          stats.failed++;
          break;
        case MessageStatus.EXPIRED:
          stats.expired++;
          break;
      }
    });

    return stats;
  }
} 