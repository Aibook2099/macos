## 🛠 通用 + 项目级 AI 协作规则（rules-project.md）

建议将本文件放置在每个项目根目录（如 `/rules.md`），供 Cursor 自动识别与加载。
支持 Cloudflare Workers 项目 和 React + Node.js 全栈项目。

---

### 1. 📁 通用项目结构约定

#### ✅ Worker 项目（如 Cloudflare）
```
project-name/
├── src/                # 源码目录
│   ├── index.js       # Worker 主入口
│   ├── api/           # 路由/逻辑模块
│   ├── utils/         # 工具函数
│   └── config/        # 配置
├── public/            # 静态资源目录（index.html, css, js）
├── tests/             # 单元/接口测试
├── docs/              # 项目文档（包含开发规范）
├── wrangler.toml      # Cloudflare 配置
├── package.json
└── .gitignore
```

#### ✅ 全栈项目（React + Node.js）
```
src/
├── components/       # UI 组件
├── pages/            # 页面视图
├── services/         # 接口调用封装
├── hooks/            # 自定义 hooks
├── utils/            # 工具函数
├── stores/           # Zustand / context 管理
├── types/            # TypeScript 类型定义
└── main.tsx

tests/
├── components/       # 前端组件测试
├── api/              # 接口测试
```

---

### 2. 🚀 技术栈配置

| 组件 | Worker 项目 | 全栈项目 |
|------|--------------|------------|
| 包管理 | pnpm / npm | pnpm |
| 构建工具 | wrangler | Vite |
| 前端框架 | HTML/CSS/JS | React + TailwindCSS |
| 后端框架 | Edge Function | Node.js + Express |
| 测试工具 | Jest | Vitest / Jest + Supertest |
| Lint 工具 | ESLint + Prettier | ESLint + Prettier + Husky |

---

### 3. ✅ 开发流程

#### ✅ 初始化
- Worker 项目使用 `init-project.sh` 自动生成结构、配置文件、README、Git 初始化。
- 全栈项目建议使用模板仓库（可集成组件库、状态管理、测试框架）。

#### ✅ 提交规范
```bash
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式调整
refactor: 代码重构
chore:    工具/依赖相关
```

#### ✅ 模块闭环
- 每个模块应：功能完整、测试通过、文档清晰、可单独运行。
- Worker 项目中每个 handler 要可测试（带 mock 请求）。
- 全栈项目中每个组件建议 Storybook + 单测覆盖。

---

### 4. 🧪 测试策略

- 所有业务逻辑应具备单元测试（单测 + 异常 + 边界）
- 后端接口建议使用 Supertest 模拟调用
- Worker 项目建议对 `fetch` handler 做 mock 测试
- 所有测试统一放入 `/tests` 目录，并写入 CI/CD 中自动执行

---

### 5. 📄 文档要求
- `README.md`: 项目说明 + 启动方法 + 部署流程 + 结构说明 + 测试命令
- `DEPLOYMENT.md`: 部署平台配置（如 wrangler、Vercel、Docker 等）
- 所有模块建议编写注释或模块级文档，复杂逻辑建议写开发者说明文档（/docs）

---

### 6. 📦 配置管理与环境变量

- 所有敏感信息统一通过 `.env` 文件管理（支持 dev/prod 区分）
```
.env.development
.env.production
```
- Worker 项目建议使用 `wrangler.toml` 定义多环境：
```toml
[env.staging]
workers_dev = true
account_id = "xxx"
```
- 全栈项目建议通过 dotenv 加载环境变量，统一从 `config.ts` 读取

---

### 7. 🔍 代码审查重点

- 命名清晰，职责单一（SRP）
- 所有异步操作应处理异常并输出统一结构（如 status + message）
- 避免硬编码，配置项抽离至常量或 `.env`
- 所有 fetch / axios 请求应具备超时 + 重试机制
- 所有组件、handler 建议支持独立测试与复用

---

### ✅ 📈 持续维护建议

- 所有规则应随项目演进持续更新（建议与模板版本控制挂钩）
- Cursor 自动生成结构建议与本规范保持同步（通过 Prompt 模板引导）
- 推荐添加 `.cursor.json`：
```json
{
  "aiRules": "./rules.md"
}
```

---

如有特定业务领域（如 AI 接口、支付系统、多租户后台）可继续在此规则文件尾部追加对应的 "子模块约定"，支持 AI 模型识别调用。


