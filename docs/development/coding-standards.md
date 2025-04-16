# 编码规范

## 1. 通用规范

### 1.1 文件命名
- 使用小写字母
- 单词之间用连字符(-)连接
- 组件文件使用 PascalCase
- 工具文件使用 camelCase

示例：
```
components/
  UserProfile.tsx
  ChatMessage.tsx
utils/
  formatDate.ts
  validateInput.ts
```

### 1.2 代码格式
- 使用 2 个空格缩进
- 最大行长度 100 字符
- 使用单引号
- 语句末尾使用分号

### 1.3 注释规范
- 使用 JSDoc 格式
- 公共 API 必须注释
- 复杂逻辑需要注释
- 保持注释简洁明了

示例：
```typescript
/**
 * 计算两个日期之间的天数
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @returns 天数差
 */
function calculateDaysBetween(startDate: Date, endDate: Date): number {
  // ...
}
```

## 2. TypeScript 规范

### 2.1 类型定义
- 优先使用 interface 而不是 type
- 使用类型推断
- 避免使用 any
- 使用类型别名提高可读性

示例：
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';
```

### 2.2 函数定义
- 使用箭头函数
- 明确参数和返回值类型
- 使用可选参数和默认值
- 保持函数单一职责

示例：
```typescript
const getUserById = async (id: string): Promise<User> => {
  // ...
};

const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  // ...
};
```

## 3. React 规范

### 3.1 组件定义
- 使用函数组件
- 使用 Hooks
- 组件名使用 PascalCase
- Props 使用 TypeScript 接口

示例：
```typescript
interface ButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ text, onClick, variant = 'primary' }) => {
  // ...
};
```

### 3.2 状态管理
- 使用 useState 管理本地状态
- 使用 Context 管理全局状态
- 避免不必要的状态
- 使用 useMemo 和 useCallback 优化性能

### 3.3 样式规范
- 使用 CSS Modules
- 类名使用 BEM 命名法
- 避免内联样式
- 使用主题变量

示例：
```css
.button {
  /* ... */
}

.button--primary {
  /* ... */
}

.button__icon {
  /* ... */
}
```

## 4. 测试规范

### 4.1 测试文件命名
- 测试文件以 .test.ts 或 .spec.ts 结尾
- 测试文件与源文件同名
- 测试目录结构镜像源目录结构

### 4.2 测试用例规范
- 使用 describe 分组
- 使用 it 描述测试用例
- 使用 expect 断言
- 测试覆盖边界条件

示例：
```typescript
describe('UserService', () => {
  it('should create a new user', async () => {
    const user = await userService.create({
      name: 'Test User',
      email: 'test@example.com'
    });
    
    expect(user).toHaveProperty('id');
    expect(user.name).toBe('Test User');
  });
});
```

## 5. Git 规范

### 5.1 提交信息
- 使用约定式提交
- 类型前缀：feat, fix, docs, style, refactor, test, chore
- 描述清晰简洁
- 关联 Issue 编号

示例：
```
feat: add user authentication
fix: resolve login page layout issue
docs: update API documentation
```

### 5.2 分支管理
- 主分支：main
- 开发分支：develop
- 特性分支：feature/*
- 修复分支：bugfix/*
- 发布分支：release/*

## 6. 性能规范

### 6.1 代码优化
- 避免不必要的重渲染
- 使用 React.memo
- 优化循环和递归
- 使用性能分析工具

### 6.2 资源优化
- 图片压缩和懒加载
- 代码分割
- 缓存策略
- 减少 HTTP 请求

## 7. 安全规范

### 7.1 数据安全
- 敏感信息加密
- 输入验证
- XSS 防护
- CSRF 防护

### 7.2 认证授权
- 使用 JWT
- 密码加密
- 权限控制
- 会话管理 