# 部署指南：Cloudflare Worker 与 VPS 双版本

## 目录结构

```
.
├── cf-worker/          # Cloudflare Worker 版本
│   ├── src/
│   │   ├── api/
│   │   ├── durable-objects/
│   │   └── workers/
│   └── wrangler.toml
├── vps/               # VPS 版本
│   ├── src/
│   │   ├── api/
│   │   ├── websocket/
│   │   └── server/
│   └── package.json
└── shared/            # 共享代码
    ├── types/
    ├── utils/
    └── constants/
```

## 版本特点

### Cloudflare Worker 版本

#### 核心特性
- 基于 Cloudflare Workers 和 Durable Objects
- 边缘计算，全球部署
- 自动扩缩容
- 内置 DDoS 防护
- 低延迟访问

#### 技术栈
- Cloudflare Workers
- Durable Objects (WebSocket 支持)
- Workers KV (状态存储)
- TypeScript

#### 限制
- CPU 时间限制（免费版 50ms，付费版 30s）
- 内存限制（128MB）
- 需要适配 Durable Objects API

### VPS 版本

#### 核心特性
- 完全控制服务器资源
- 无 CPU 时间限制
- 可自定义部署配置
- 适合高并发场景
- 支持长连接

#### 技术栈
- Node.js
- WebSocket
- Redis (消息队列)
- TypeScript

#### 优势
- 无硬性资源限制
- 可自定义扩展
- 完整的系统控制权
- 适合大规模部署

## 代码差异

### 1. WebSocket 实现

#### CF Worker 版本
```typescript
// cf-worker/src/durable-objects/websocket.ts
export class WebSocketDO {
  private state: DurableObjectState;
  private sessions: Map<string, WebSocket>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    await this.handleSession(server);
    
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
}
```

#### VPS 版本
```typescript
// vps/src/websocket/server.ts
export class WebSocketServer {
  private wss: WebSocket.Server;
  private sessions: Map<string, WebSocket>;

  constructor(options: WebSocket.ServerOptions) {
    this.wss = new WebSocket.Server(options);
    this.sessions = new Map();
    this.setupEventHandlers();
  }
}
```

### 2. 消息队列

#### CF Worker 版本
```typescript
// cf-worker/src/durable-objects/message-queue.ts
export class MessageQueueDO {
  private state: DurableObjectState;
  private queue: Message[];

  constructor(state: DurableObjectState) {
    this.state = state;
    this.queue = [];
  }

  async enqueue(message: Message) {
    await this.state.storage.put(`message:${Date.now()}`, message);
  }
}
```

#### VPS 版本
```typescript
// vps/src/websocket/queue.ts
export class MessageQueue {
  private queue: Message[];
  private redis: Redis;

  constructor(redis: Redis) {
    this.queue = [];
    this.redis = redis;
  }

  async enqueue(message: Message) {
    await this.redis.lpush('message-queue', JSON.stringify(message));
  }
}
```

## 部署流程

### Cloudflare Worker 部署

1. 安装依赖
```bash
cd cf-worker
npm install
```

2. 配置 wrangler.toml
```toml
name = "ai-role-simulator"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "WEBSOCKET"
class_name = "WebSocketDO"

[[kv_namespaces]]
binding = "MESSAGES"
id = "xxx"
```

3. 部署
```bash
npm run deploy
```

### VPS 部署

1. 安装依赖
```bash
cd vps
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件
```

3. 启动服务
```bash
npm run start
```

## 迁移指南

### 从 VPS 迁移到 CF Worker

1. 数据迁移
   - 导出 VPS 上的用户数据
   - 使用 Workers KV 导入工具导入数据

2. 代码适配
   - 将 WebSocket 实现改为 Durable Objects
   - 将 Redis 队列改为 Workers KV
   - 更新环境变量配置

3. 测试验证
   - 在开发环境测试
   - 进行负载测试
   - 验证功能完整性

### 从 CF Worker 迁移到 VPS

1. 数据迁移
   - 导出 Workers KV 数据
   - 导入到 Redis 数据库

2. 代码适配
   - 将 Durable Objects 改为原生 WebSocket
   - 将 Workers KV 改为 Redis
   - 更新环境变量配置

3. 测试验证
   - 在测试环境部署
   - 进行性能测试
   - 验证功能完整性

## 维护建议

### 共享代码维护
- 将通用类型定义放在 shared/types
- 将工具函数放在 shared/utils
- 将常量配置放在 shared/constants

### 版本同步
- 定期同步两个版本的特性
- 保持 API 接口一致性
- 统一错误处理方式

### 监控告警
- CF Worker: 使用 Cloudflare Dashboard
- VPS: 使用自定义监控系统

## 性能对比

### 延迟
- CF Worker: 边缘节点，平均延迟 < 50ms
- VPS: 取决于服务器位置，平均延迟 100-200ms

### 并发处理
- CF Worker: 自动扩缩容，适合突发流量
- VPS: 需要手动配置，适合稳定流量

### 成本
- CF Worker: 按使用量计费，适合中小规模
- VPS: 固定成本，适合大规模部署

## 选择建议

### 选择 CF Worker 的情况
- 需要全球部署
- 流量波动大
- 预算有限
- 需要快速部署

### 选择 VPS 的情况
- 需要完全控制
- 高并发需求
- 长连接场景
- 自定义需求多

## 环境要求

- Node.js 18+
- Docker 20+
- Docker Compose 2+
- PostgreSQL 15+
- Redis 6+

## 部署步骤

### 1. 环境准备

```bash
# 克隆仓库
git clone <repository-url>
cd <project-directory>

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env
```

### 2. 配置环境变量

编辑 `.env` 文件，设置必要的环境变量：

- `NODE_ENV`: 环境类型（development/production）
- `WS_URL`: WebSocket 服务器地址
- `JWT_SECRET`: JWT 密钥
- `DB_URL`: 数据库连接字符串
- `REDIS_URL`: Redis 连接字符串

### 3. 数据库准备

```bash
# 启动 PostgreSQL
docker-compose up -d postgres

# 等待数据库就绪
sleep 10

# 运行数据库迁移
npm run migrate
```

### 4. 构建应用

```bash
# 构建前端
npm run build

# 构建 Docker 镜像
docker-compose build
```

### 5. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 6. 验证部署

```bash
# 检查服务健康状态
curl http://localhost/health

# 检查 WebSocket 连接
curl http://localhost/ws
```

## 监控和维护

### 日志查看

```bash
# 查看应用日志
docker-compose logs -f client

# 查看数据库日志
docker-compose logs -f postgres
```

### 性能监控

- 使用 New Relic 监控应用性能
- 使用 Sentry 监控错误
- 使用 Grafana 监控系统指标

### 备份策略

1. 数据库备份
```bash
# 每日备份
0 0 * * * pg_dump -U postgres personality_db > /backups/db_$(date +%Y%m%d).sql
```

2. 日志备份
```bash
# 每周备份
0 0 * * 0 tar -czf /backups/logs_$(date +%Y%m%d).tar.gz /var/log/app
```

## 故障处理

### 常见问题

1. WebSocket 连接失败
   - 检查防火墙设置
   - 验证 WebSocket 服务器状态
   - 检查网络连接

2. 数据库连接问题
   - 验证数据库服务状态
   - 检查连接字符串
   - 查看数据库日志

3. 性能问题
   - 检查系统资源使用情况
   - 分析慢查询
   - 优化缓存策略

### 紧急恢复

1. 服务降级
```bash
# 停止问题服务
docker-compose stop <service-name>

# 启动备用服务
docker-compose up -d <backup-service>
```

2. 数据恢复
```bash
# 恢复数据库
psql -U postgres personality_db < /backups/latest_backup.sql
```

## 安全建议

1. 定期更新依赖
```bash
npm audit
npm update
```

2. 密钥轮换
- 每月更换 JWT 密钥
- 定期更新数据库密码

3. 访问控制
- 限制管理接口访问
- 启用 IP 白名单
- 配置防火墙规则

## 扩展部署

### 水平扩展

```bash
# 扩展 WebSocket 服务
docker-compose up -d --scale ws=3

# 配置负载均衡
nginx -s reload
```

### 垂直扩展

1. 调整容器资源限制
```yaml
services:
  client:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

2. 优化数据库配置
```sql
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '1GB';
```

## 联系支持

- 技术支持：support@example.com
- 紧急联系：+86-XXX-XXXX-XXXX
- 文档：https://docs.example.com 