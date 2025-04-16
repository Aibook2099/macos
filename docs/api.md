# 模拟人格系统 API 文档

## API 概述
本文档描述了模拟人格系统的所有 API 接口。

### Base URL
- 开发环境：`http://localhost:3000/api`
- 生产环境：`待定`

### 认证
所有需要认证的接口都需要在请求头中携带 JWT token：
```http
Authorization: Bearer <your_token>
```

### 响应格式
所有 API 响应都遵循以下格式：
```json
{
  "status": "success" | "error",
  "data": any | null,
  "message": string | null,
  "error": {
    "code": string,
    "details": string
  } | null
}
```

## API 端点

### 用户管理
#### 注册用户
```http
POST /auth/register
```
请求体：
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### 用户登录
```http
POST /auth/login
```
请求体：
```json
{
  "email": "string",
  "password": "string"
}
```

### 角色管理
#### 创建角色
```http
POST /roles
```
请求体：
```json
{
  "name": "string",
  "description": "string",
  "personality_traits": {
    "openness": number,
    "conscientiousness": number,
    "extraversion": number,
    "agreeableness": number,
    "neuroticism": number
  }
}
```

#### 获取角色列表
```http
GET /roles
```

#### 获取角色详情
```http
GET /roles/:id
```

### 对话管理
#### 发起对话
```http
POST /conversations
```
请求体：
```json
{
  "role_id": "string",
  "message": "string"
}
```

#### 获取对话历史
```http
GET /conversations/:role_id
```

## 错误码
| 错误码 | 描述 |
|--------|------|
| AUTH_001 | 未授权访问 |
| AUTH_002 | Token 已过期 |
| USER_001 | 用户不存在 |
| USER_002 | 密码错误 |
| ROLE_001 | 角色不存在 |
| ROLE_002 | 角色创建失败 |
| CONV_001 | 对话创建失败 |

## 速率限制
- 普通用户：60次/分钟
- 高级用户：200次/分钟

## 更新日志
### v1.0.0 (2024-04-16)
- 初始版本
- 基础用户认证
- 角色管理
- 对话系统 