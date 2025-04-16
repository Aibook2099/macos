# 故障排除指南

## 1. 常见问题

### 1.1 服务无法启动
#### 症状
- 服务启动失败
- 端口被占用
- 依赖服务未就绪

#### 解决方案
1. 检查端口占用
```bash
# 检查端口占用
lsof -i :3000

# 终止占用进程
kill -9 <PID>
```

2. 检查依赖服务
```bash
# 检查数据库状态
docker-compose ps postgres

# 检查日志
docker-compose logs postgres
```

3. 检查环境变量
```bash
# 检查环境变量
cat .env

# 验证环境变量
node -e "console.log(process.env)"
```

### 1.2 数据库连接问题
#### 症状
- 连接超时
- 认证失败
- 数据库不存在

#### 解决方案
1. 检查数据库状态
```bash
# 检查数据库服务
docker-compose ps postgres

# 检查数据库日志
docker-compose logs postgres
```

2. 验证连接信息
```bash
# 测试数据库连接
psql -h localhost -U personality -d personality_db
```

3. 检查数据库用户
```bash
# 创建数据库用户
docker-compose exec postgres psql -U postgres -c "CREATE USER personality WITH PASSWORD 'personality123';"

# 创建数据库
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE personality_db OWNER personality;"
```

### 1.3 性能问题
#### 症状
- 响应缓慢
- CPU 使用率高
- 内存占用大

#### 解决方案
1. 监控系统资源
```bash
# 查看系统资源
top

# 查看进程资源
ps aux | grep node
```

2. 分析日志
```bash
# 查看应用日志
docker-compose logs -f server

# 分析错误日志
grep "ERROR" logs/app.log
```

3. 性能优化
- 启用缓存
- 优化数据库查询
- 增加服务器资源

## 2. 错误代码

### 2.1 系统错误
| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| EADDRINUSE | 端口被占用 | 更换端口或终止占用进程 |
| ECONNREFUSED | 连接被拒绝 | 检查服务是否运行 |
| ENOTFOUND | 主机名解析失败 | 检查网络配置 |

### 2.2 应用错误
| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| AUTH_REQUIRED | 需要认证 | 检查认证信息 |
| INVALID_CREDENTIALS | 无效凭证 | 验证用户名密码 |
| RATE_LIMIT_EXCEEDED | 请求超限 | 降低请求频率 |

## 3. 日志分析

### 3.1 日志级别
- ERROR: 错误信息
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 调试信息

### 3.2 日志位置
```bash
# 应用日志
logs/app.log

# 错误日志
logs/error.log

# 访问日志
logs/access.log
```

### 3.3 日志分析工具
```bash
# 查看最新日志
tail -f logs/app.log

# 搜索错误
grep "ERROR" logs/app.log

# 统计错误
grep "ERROR" logs/app.log | wc -l
```

## 4. 性能调优

### 4.1 系统调优
```bash
# 检查系统限制
ulimit -a

# 修改文件描述符限制
ulimit -n 65535
```

### 4.2 应用调优
- 启用 GZIP 压缩
- 配置缓存
- 优化数据库查询
- 使用连接池

### 4.3 数据库调优
```sql
-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM users;

-- 创建索引
CREATE INDEX idx_users_email ON users(email);

-- 优化表
VACUUM ANALYZE users;
```

## 5. 安全加固

### 5.1 系统安全
```bash
# 更新系统
sudo apt update && sudo apt upgrade

# 配置防火墙
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
```

### 5.2 应用安全
- 启用 HTTPS
- 配置 CORS
- 设置安全头
- 限制请求频率

### 5.3 数据安全
- 加密敏感数据
- 定期备份
- 访问控制
- 审计日志

## 6. 监控告警

### 6.1 系统监控
```bash
# 监控 CPU
mpstat 1

# 监控内存
free -m

# 监控磁盘
df -h
```

### 6.2 应用监控
- 请求延迟
- 错误率
- 并发数
- 资源使用

### 6.3 告警配置
- 设置阈值
- 配置通知
- 定义升级策略
- 测试告警 