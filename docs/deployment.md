# 模拟人格系统部署指南

## 环境要求
- Node.js >= 18
- Docker >= 20.10
- Docker Compose >= 2.0
- PostgreSQL >= 15

## 本地开发环境搭建

### 1. 克隆项目
```bash
git clone <repository_url>
cd personality-simulator
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 环境变量配置
1. 复制环境变量模板
```bash
cp .env.example .env
```

2. 修改环境变量
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=personality
DB_PASSWORD=personality123
DB_NAME=personality_db

# 应用配置
NODE_ENV=development
PORT=3000
```

### 4. 启动数据库
```bash
# 启动 PostgreSQL 容器
docker-compose -p personality up -d

# 等待数据库启动后初始化表结构
pnpm run db:init
```

### 5. 启动开发服务器
```bash
# 启动后端服务
pnpm run dev

# 启动前端开发服务器（新终端）
cd client
pnpm run dev
```

## 生产环境部署

### 1. 服务器要求
- CPU: 2核心以上
- 内存: 4GB以上
- 磁盘: 20GB以上
- 操作系统: Ubuntu 20.04 LTS 或更高版本

### 2. 安装基础软件
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm
```

### 3. 项目部署
1. 克隆项目并安装依赖
```bash
git clone <repository_url>
cd personality-simulator
pnpm install
```

2. 构建前端
```bash
cd client
pnpm run build
```

3. 配置环境变量
```bash
cp .env.example .env
# 修改 .env 文件中的配置
```

4. 启动服务
```bash
# 启动数据库
docker-compose -p personality up -d

# 初始化数据库
pnpm run db:init

# 启动应用
pnpm run start
```

### 4. Nginx 配置
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. SSL 配置（推荐）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your_domain.com
```

## 监控与维护

### 1. 日志查看
```bash
# 查看应用日志
docker-compose -p personality logs -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 数据库备份
```bash
# 创建备份
docker exec personality_db pg_dump -U personality personality_db > backup.sql

# 恢复备份
cat backup.sql | docker exec -i personality_db psql -U personality -d personality_db
```

### 3. 性能监控
- 使用 PM2 进行进程管理
- 配置 Prometheus + Grafana 进行监控
- 设置服务器资源告警

## 故障排除

### 1. 数据库连接问题
- 检查数据库容器状态
```bash
docker ps | grep personality_db
```
- 检查数据库日志
```bash
docker logs personality_db
```

### 2. 应用启动失败
- 检查环境变量配置
- 检查端口占用情况
- 查看应用日志

### 3. 性能问题
- 检查数据库连接池配置
- 检查 Node.js 内存使用情况
- 检查数据库查询性能

## 安全建议
1. 定期更新依赖包
2. 使用强密码
3. 配置防火墙
4. 启用 SSL/TLS
5. 实施速率限制
6. 配置数据库访问权限

## 更新流程
1. 拉取最新代码
2. 安装新依赖
3. 执行数据库迁移
4. 构建前端
5. 重启服务

## 回滚流程
1. 切换到上一个稳定版本
2. 恢复数据库备份
3. 重启服务 