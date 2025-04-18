## 📌 通用 AI 协作规则（rules-core.md）

适用于所有项目的 AI 开发协作标准，建议将本文件配置到 Cursor 的 "Rules for AI" 中。

---

### 1. 📐 代码生成策略

#### ✅ 渐进式开发（Progressive Generation）
- 拆分阶段：框架搭建 → 核心逻辑 → 测试 → 性能优化 → 文档。
- 每阶段输出具备 "可运行 + 可测试" 的最小单元（MVP）。
- 鼓励模块级开发，避免一次性生成整页或整功能。

#### ✅ 代码复用优先（Reuse First）
- 自动识别已有组件、函数、hooks、utils，优先复用。
- 对重复逻辑建议抽取为通用模块。

---

### 2. 🧯 错误处理与调试

#### ✅ 上下文感知错误信息
- 输出错误时给出：模块位置、调用路径、栈追踪、建议修复。
- 建议自动插入关键日志点，如 API 请求失败、空值处理等。

#### ✅ 优雅降级方案
- 若模块关键路径失败，应生成兜底逻辑（如 fallback、loading、空状态）。

#### ✅ 智能测试失败诊断
- 失败报告格式：
```md
- ❌ 失败用例：should handle empty input gracefully
- 🧠 猜测原因：未处理空数组，直接 .map() 导致
- 🧪 最后修复尝试：增加空值判断
- 📌 推荐操作：加入 `if (!arr.length) return []`
```

---

### 3. ⚡ 性能优化建议

#### ✅ 性能敏感检测
- 检测重渲染、列表渲染、深层嵌套、高频更新等风险。
- 主动建议使用 useMemo、虚拟滚动、节流防抖等优化方案。

#### ✅ 资源加载优化
- 建议图片、数据懒加载、分页、Skeleton 占位。
- 按需加载组件，按路由拆包。

---

### 4. 🧪 测试生成与提示

#### ✅ 自动生成测试
- 基于函数签名与逻辑结构，生成初步单元测试（Vitest / Jest）。
- 包括核心路径、边界值、异常值测试。

#### ✅ mock 提示
- 当接口返回值不明时，建议生成 mock 数据结构供测试用。

---

### 5. 📚 文档辅助与标准

#### ✅ 自动生成注释模板
- 根据函数、组件、接口结构，生成参数/返回值说明。
- 支持生成 TS 类型提示与 JSDoc。

#### ✅ Storybook 支持
- 若为通用 UI 组件，建议生成 Storybook 文档与示例。

---

### 6. ⚙️ DevOps 和环境建议

#### ✅ CI/CD 提示
- 检测到测试/部署关键字时，建议生成 GitHub Actions 或 GitLab CI 配置。
- 默认建议 lint + test + build + deploy 任务。

#### ✅ Docker 支持
- 后端服务默认建议生成 Dockerfile 与 docker-compose.yml。

---

### 7. 🧠 Prompt 提示强化

```ts
// act as a PM，检查流程是否符合用户逻辑
// act as a backend engineer，优化该接口的性能与安全
// act as a tester，写出边界用例与异常测试
```


