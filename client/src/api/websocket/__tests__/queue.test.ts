import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MessageQueue, MessagePriority, MessageStatus } from '../queue'
import { WebSocketMessage } from '../../../../shared/types/websocket'

describe('MessageQueue', () => {
  let queue: MessageQueue
  let sendMethod: (message: WebSocketMessage | WebSocketMessage[]) => Promise<void>

  beforeEach(() => {
    vi.useFakeTimers()
    sendMethod = vi.fn()
    queue = new MessageQueue(3, 1000, 3, 5000)
    queue.setSendMethod(sendMethod)
  })

  afterEach(() => {
    vi.useRealTimers()
    queue.stop()
  })

  describe('消息入队', () => {
    it('应该按优先级入队消息', () => {
      const highPriorityMessage: WebSocketMessage = {
        type: 'test',
        data: { value: 'high' },
        timestamp: Date.now()
      }
      const normalPriorityMessage: WebSocketMessage = {
        type: 'test',
        data: { value: 'normal' },
        timestamp: Date.now()
      }

      queue.enqueue(highPriorityMessage, { priority: MessagePriority.HIGH })
      queue.enqueue(normalPriorityMessage, { priority: MessagePriority.NORMAL })

      const stats = queue.getQueueStats()
      expect(stats.highPriority).toBe(1)
      expect(stats.normalPriority).toBe(1)
    })

    it('应该处理带TTL的消息', () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }

      queue.enqueue(message, { ttl: 1000 })
      
      const stats = queue.getQueueStats()
      expect(stats.total).toBe(1)
    })
  })

  describe('消息处理', () => {
    it('应该处理队列中的消息', async () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }

      queue.enqueue(message)
      await queue.processQueue()
      await vi.advanceTimersByTimeAsync(0)

      expect(sendMethod).toHaveBeenCalledWith(expect.objectContaining({
        ...message,
        messageId: expect.any(String)
      }))
    })

    it('应该在发送失败时重试', async () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }

      sendMethod.mockRejectedValueOnce(new Error('Send failed'))
      queue.enqueue(message)

      // 第一次尝试
      await queue.processQueue()
      await vi.advanceTimersByTimeAsync(0)
      expect(sendMethod).toHaveBeenCalledTimes(1)

      // 重试
      await vi.advanceTimersByTimeAsync(1000)
      await queue.processQueue()
      expect(sendMethod).toHaveBeenCalledTimes(2)
    })

    it('应该在达到最大重试次数后放弃', async () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }
      const callback = vi.fn()

      sendMethod.mockRejectedValue(new Error('Send failed'))
      queue.enqueue(message, { callback })

      // 模拟所有重试
      for (let i = 0; i < 4; i++) {
        await queue.processQueue()
        await vi.advanceTimersByTimeAsync(1000)
      }

      expect(sendMethod).toHaveBeenCalledTimes(4)
      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('批量处理', () => {
    it('应该批量处理消息', async () => {
      const messages = Array(3).fill(null).map((_, i) => ({
        type: 'test',
        data: { value: `test${i}` },
        timestamp: Date.now()
      }))

      messages.forEach(msg => {
        queue.enqueue(msg, {
          batch: {
            maxSize: 3,
            timeout: 1000
          }
        })
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(sendMethod).toHaveBeenCalledWith(expect.objectContaining({
        type: 'batch',
        data: {
          messages: expect.arrayContaining(
            messages.map(msg => expect.objectContaining(msg))
          ),
          count: 3
        }
      }))
    })

    it('应该在超时后发送批量消息', async () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }

      queue.enqueue(message, {
        batch: {
          timeout: 1000
        }
      })

      await vi.advanceTimersByTimeAsync(1000)

      expect(sendMethod).toHaveBeenCalledWith(expect.objectContaining({
        type: 'batch',
        data: {
          messages: expect.arrayContaining([
            expect.objectContaining(message)
          ]),
          count: 1
        }
      }))
    })
  })

  describe('消息确认', () => {
    it('应该处理消息确认', async () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }
      const callback = vi.fn()

      queue.enqueue(message, {
        requireAcknowledgment: true,
        callback
      })

      await queue.processQueue()
      const messageId = sendMethod.mock.calls[0][0].messageId
      queue.acknowledge(messageId)

      expect(callback).toHaveBeenCalled()
    })

    it('应该在确认超时后调用回调', async () => {
      const message: WebSocketMessage = {
        type: 'test',
        data: { value: 'test' },
        timestamp: Date.now()
      }
      const callback = vi.fn()

      queue.enqueue(message, {
        requireAcknowledgment: true,
        callback
      })

      await queue.processQueue()
      await vi.advanceTimersByTimeAsync(30000)

      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('队列统计', () => {
    it('应该提供准确的队列统计信息', () => {
      const messages = [
        { priority: MessagePriority.HIGH, ttl: 1000 },
        { priority: MessagePriority.NORMAL },
        { priority: MessagePriority.LOW }
      ]

      messages.forEach(({ priority, ttl }) => {
        queue.enqueue({
          type: 'test',
          data: { value: 'test' },
          timestamp: Date.now()
        }, { priority, ttl })
      })

      const stats = queue.getQueueStats()
      expect(stats.total).toBe(3)
      expect(stats.highPriority).toBe(1)
      expect(stats.normalPriority).toBe(1)
      expect(stats.lowPriority).toBe(1)
      expect(stats.status[MessageStatus.PENDING]).toBe(3)
    })
  })

  describe('Batch Message Handling', () => {
    it('should handle batch messages based on size', async () => {
      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } },
        { type: 'test', data: { content: 'message3' } }
      ]

      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 3 })
      })

      expect(sendMethod).toHaveBeenCalledTimes(1)
      expect(sendMethod).toHaveBeenCalledWith(messages)
    })

    it('should handle batch messages based on timeout', async () => {
      vi.useFakeTimers()

      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } }
      ]

      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 3, timeout: 1000 })
      })

      expect(sendMethod).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1000)
      expect(sendMethod).toHaveBeenCalledTimes(1)
      expect(sendMethod).toHaveBeenCalledWith(messages)

      vi.useRealTimers()
    })

    it('should respect batch message priority', async () => {
      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } }
      ]

      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 2, priority: MessagePriority.HIGH })
      })

      expect(sendMethod).toHaveBeenCalledTimes(1)
      const sentMessage = sendMethod.mock.calls[0][0]
      expect(sentMessage[0].data.content).toBe('message1')
      expect(sentMessage[1].data.content).toBe('message2')
    })

    it('should handle batch message expiration', async () => {
      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } }
      ]

      const callback = vi.fn()
      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 2, ttl: 1000 }, callback)
      })

      vi.useFakeTimers()
      vi.advanceTimersByTime(2000)
      vi.useRealTimers()

      expect(sendMethod).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should handle batch message retries', async () => {
      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } }
      ]

      sendMethod.mockRejectedValueOnce(new Error('Failed to send'))
      sendMethod.mockResolvedValueOnce(undefined)

      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 2 })
      })

      expect(sendMethod).toHaveBeenCalledTimes(1)
      expect(sendMethod).toHaveBeenCalledWith(messages)

      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(sendMethod).toHaveBeenCalledTimes(2)
      expect(sendMethod).toHaveBeenCalledWith(messages)
    })

    it('should handle batch message failure after max retries', async () => {
      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } }
      ]

      const callback = vi.fn()
      sendMethod.mockRejectedValue(new Error('Failed to send'))

      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 2 }, callback)
      })

      await new Promise(resolve => setTimeout(resolve, 4000))
      expect(sendMethod).toHaveBeenCalledTimes(4)
      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should maintain message order in batch', async () => {
      const messages: WebSocketMessage[] = [
        { type: 'test', data: { content: 'message1' } },
        { type: 'test', data: { content: 'message2' } },
        { type: 'test', data: { content: 'message3' } }
      ]

      messages.forEach(msg => {
        queue.enqueue(msg, { maxSize: 3 })
      })

      expect(sendMethod).toHaveBeenCalledTimes(1)
      const sentMessages = sendMethod.mock.calls[0][0]
      expect(sentMessages[0].data.content).toBe('message1')
      expect(sentMessages[1].data.content).toBe('message2')
      expect(sentMessages[2].data.content).toBe('message3')
    })
  })
}) 