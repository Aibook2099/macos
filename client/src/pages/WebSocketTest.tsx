import React, { useEffect, useState, useCallback } from 'react'
import { WebSocketClientImpl } from '../api/websocket/client'
import { MessageQueue, MessagePriority } from '../api/websocket/queue'
import { WebSocketMessage } from '../api/websocket/types'

interface QueueStats {
  total: number
  highPriority: number
  normalPriority: number
  lowPriority: number
  pendingAcknowledgment: number
  status: {
    pending: number
    sent: number
    acknowledged: number
    failed: number
    expired: number
  }
}

const WebSocketTest: React.FC = () => {
  const [queue, setQueue] = useState<MessageQueue | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<MessagePriority>(MessagePriority.NORMAL)
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)

  // 初始化 WebSocket 客户端和消息队列
  useEffect(() => {
    const wsClient = new WebSocketClientImpl({
      url: 'ws://localhost:8080',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    })

    const messageQueue = new MessageQueue({
      maxRetries: 3,
      retryInterval: 2000,
      expirationCheckInterval: 5000,
      acknowledgmentTimeout: 10000
    })

    messageQueue.setSendMethod((message: WebSocketMessage) => {
      if (wsClient && connected) {
        wsClient.send(message)
      } else {
        throw new Error('WebSocket not connected')
      }
    })

    setQueue(messageQueue)

    // 设置事件监听器
    wsClient.on('open', () => {
      console.log('WebSocket connected')
      setConnected(true)
    })

    wsClient.on('close', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })

    wsClient.on('message', (message: unknown) => {
      if (isWebSocketMessage(message)) {
        console.log('Received message:', message)
        setMessages(prev => [...prev, message])
      }
    })

    wsClient.on('error', (error: unknown) => {
      if (error instanceof Error) {
        console.error('WebSocket error:', error)
      }
    })

    // 连接 WebSocket
    wsClient.connect()

    // 定期更新队列统计信息
    const statsInterval = setInterval(() => {
      if (messageQueue) {
        setQueueStats(messageQueue.getQueueStats() as QueueStats)
      }
    }, 1000)

    return () => {
      wsClient.disconnect()
      messageQueue.stop()
      clearInterval(statsInterval)
    }
  }, [connected])

  // 类型守卫
  const isWebSocketMessage = (message: unknown): message is WebSocketMessage => {
    return (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      'data' in message &&
      'timestamp' in message
    )
  }

  // 发送消息
  const sendMessage = useCallback(() => {
    if (!queue || !inputMessage.trim()) return

    const message: WebSocketMessage = {
      type: 'chat',
      data: { content: inputMessage },
      timestamp: Date.now()
    }

    queue.enqueue(message, {
      priority: selectedPriority,
      ttl: 60000, // 1分钟过期
      requireAcknowledgment: true,
      callback: (error) => {
        if (error) {
          console.error('Message failed:', error)
        } else {
          console.log('Message sent successfully')
        }
      }
    })

    setInputMessage('')
  }, [queue, inputMessage, selectedPriority])

  // 清除消息历史
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">WebSocket 测试</h1>
      
      {/* 连接状态 */}
      <div className="mb-4">
        <span className="mr-2">状态:</span>
        <span className={`font-bold ${connected ? 'text-green-600' : 'text-red-600'}`}>
          {connected ? '已连接' : '未连接'}
        </span>
      </div>

      {/* 消息发送区域 */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="输入消息..."
          className="flex-1 px-3 py-2 border rounded"
        />
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(Number(e.target.value))}
          className="px-3 py-2 border rounded"
        >
          <option value={MessagePriority.HIGH}>高优先级</option>
          <option value={MessagePriority.NORMAL}>普通优先级</option>
          <option value={MessagePriority.LOW}>低优先级</option>
        </select>
        <button
          onClick={sendMessage}
          disabled={!connected || !inputMessage.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          发送
        </button>
        <button
          onClick={clearMessages}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          清除
        </button>
      </div>

      {/* 队列统计信息 */}
      {queueStats && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">队列统计</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>总消息数: {queueStats.total}</p>
              <p>高优先级: {queueStats.highPriority}</p>
              <p>普通优先级: {queueStats.normalPriority}</p>
              <p>低优先级: {queueStats.lowPriority}</p>
            </div>
            <div>
              <p>等待确认: {queueStats.pendingAcknowledgment}</p>
              <p>待处理: {queueStats.status.pending}</p>
              <p>已发送: {queueStats.status.sent}</p>
              <p>已确认: {queueStats.status.acknowledged}</p>
            </div>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="border rounded p-4 h-96 overflow-y-auto">
        <h2 className="font-bold mb-2">消息历史</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">暂无消息</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className="p-2 bg-gray-100 rounded"
              >
                <div className="text-sm text-gray-600">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
                <div>
                  {typeof msg.data === 'object' ? JSON.stringify(msg.data) : String(msg.data)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default WebSocketTest 