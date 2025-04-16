# 部署指南

## 1. 环境要求

### 1.1 服务器要求
- CPU: 2核+
- 内存: 4GB+
- 存储: 20GB+
- 操作系统: Ubuntu 20.04 LTS

### 1.2 软件要求
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+
- PostgreSQL 15+

## 2. 部署步骤

### 2.1 准备环境
```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2.2 配置环境变量
```bash
# 创建环境变量文件
cp .env.example .env.production

# 编辑生产环境变量
vim .env.production
```

生产环境变量配置示例：
```env
# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_USER=personality
DB_PASSWORD=your-secure-password
DB_NAME=personality_db

# JWT 配置
JWT_SECRET=your-secure-secret
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=production

# 其他配置
API_RATE_LIMIT=100
LOG_LEVEL=info
```

### 2.3 构建和启动
```bash
# 构建 Docker 镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

### 2.4 数据库迁移
```bash
# 运行数据库迁移
docker-compose -f docker-compose.prod.yml exec server pnpm db:migrate
```

## 3. 监控和维护

### 3.1 日志查看
```bash
# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f server
```

### 3.2 性能监控
- 使用 Docker 内置监控
- 配置 Prometheus + Grafana
- 设置告警规则

### 3.3 备份策略
```bash
# 数据库备份
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U personality personality_db > backup.sql

# 恢复数据库
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U personality personality_db < backup.sql
```

## 4. 更新部署

### 4.1 更新代码
```bash
# 拉取最新代码
git pull origin main

# 重新构建和启动
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4.2 回滚部署
```bash
# 回滚到上一个版本
docker-compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

## 5. 安全配置

### 5.1 SSL 配置
- 使用 Let's Encrypt
- 配置 Nginx 反向代理
- 启用 HTTPS

### 5.2 防火墙配置
```bash
# 配置 UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 5.3 安全加固
- 定期更新系统
- 配置 fail2ban
- 限制 SSH 访问
- 启用自动安全更新

## 6. 故障排除

### 6.1 常见问题
- 服务无法启动
- 数据库连接失败
- 性能问题
- 内存泄漏

### 6.2 诊断工具
```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 检查资源使用
docker stats

# 检查日志
docker-compose -f docker-compose.prod.yml logs
```

## 7. 扩展部署

### 7.1 水平扩展
- 配置负载均衡
- 使用 Docker Swarm 或 Kubernetes
- 设置自动扩展

### 7.2 高可用配置
- 数据库主从复制
- 多区域部署
- 故障转移配置 