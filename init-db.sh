#!/bin/bash

# 等待 PostgreSQL 服务启动
echo "Waiting for PostgreSQL to start..."
while ! pg_isready -h localhost -p 5432 -U personality; do
  sleep 1
done

# 创建数据库表
echo "Creating database tables..."
psql -h localhost -U personality -d personality_db -f ./server/db/migrations/init.sql

echo "Database initialization completed!" 