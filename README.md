# AI Role Simulator

这是一个基于 WebSocket 的 AI 角色模拟服务，提供了两个部署版本：

1. Cloudflare Worker 版本 (`cf-worker/`)
2. VPS 版本 (`vps/`)

## 版本特点

### Cloudflare Worker 版本

#### 优势
- 全球边缘部署，低延迟
- 自动扩缩容
- 内置 DDoS 防护
- 按使用量计费
- 快速部署

#### 限制
- CPU 时间限制（免费版 50ms，付费版 30s）
- 内存限制（128MB）
- 需要适配 Durable Objects API

### VPS 版本

#### 优势
- 完全控制服务器资源
- 无 CPU 时间限制
- 可自定义部署配置
- 适合高并发场景
- 支持长连接

#### 限制
- 需要自行管理服务器
- 需要配置负载均衡
- 需要处理 DDoS 防护

## 快速开始

### Cloudflare Worker 版本

1. 安装依赖
```bash
cd cf-worker
npm install
```

2. 配置 wrangler.toml
```bash
# 编辑 wrangler.toml，设置你的 Cloudflare 账户信息
```

3. 开发模式运行
```bash
npm run dev
```

4. 部署
```bash
npm run deploy
```

### VPS 版本

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

## 共享代码

两个版本共享以下代码：

- `shared/types/` - 类型定义
- `shared/utils/` - 工具函数
- `shared/constants/` - 常量配置

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

# 生产环境
pnpm build
pnpm start
```

## 文档
- [需求文档](./docs/requirements/)
- [架构设计](./docs/architecture/)
- [开发指南](./docs/development/)
- [测试文档](./docs/testing/)
- [部署指南](./docs/deployment/)
- [维护文档](./docs/maintenance/)

## 贡献指南
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证
[MIT License](LICENSE)

## 联系方式
- 项目维护者：[维护者名称]
- 邮箱：[邮箱地址] 