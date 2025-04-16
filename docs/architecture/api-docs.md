# API 文档

## 认证

### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

响应：
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "createdAt": "string"
  }
}
```

### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

响应：
```json
{
  "status": "success",
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "username": "string",
      "email": "string"
    }
  }
}
```

## 角色管理

### 获取角色列表
```http
GET /api/roles
Authorization: Bearer <token>
```

响应：
```json
{
  "status": "success",
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "personality": "string",
      "createdAt": "string"
    }
  ]
}
```

### 创建角色
```http
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "personality": "string"
}
```

响应：
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "personality": "string",
    "createdAt": "string"
  }
}
```

## 对话管理

### 创建对话
```http
POST /api/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "string",
  "message": "string"
}
```

响应：
```json
{
  "status": "success",
  "data": {
    "id": "string",
    "roleId": "string",
    "message": "string",
    "response": "string",
    "createdAt": "string"
  }
}
```

### 获取对话历史
```http
GET /api/conversations?roleId=string&limit=number&offset=number
Authorization: Bearer <token>
```

响应：
```json
{
  "status": "success",
  "data": {
    "total": "number",
    "items": [
      {
        "id": "string",
        "roleId": "string",
        "message": "string",
        "response": "string",
        "createdAt": "string"
      }
    ]
  }
}
```

## 错误响应

所有 API 错误响应格式：
```json
{
  "status": "error",
  "message": "string",
  "error": {
    "code": "string",
    "details": "string"
  }
}
```

常见错误码：
- `AUTH_REQUIRED`: 需要认证
- `INVALID_CREDENTIALS`: 无效的认证信息
- `NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 请求数据验证失败
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
- `INTERNAL_SERVER_ERROR`: 服务器内部错误

## 速率限制

- 认证 API: 10 次/分钟
- 其他 API: 100 次/分钟

## 版本控制

当前 API 版本：v1

版本通过请求头指定：
```
Accept: application/vnd.personality.v1+json
``` 