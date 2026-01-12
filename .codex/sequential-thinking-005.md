# Sequential Thinking — 2025-11-16（word-detail 双请求修复）

- 日期：2025-11-16
- 执行者：Codex

## 任务理解
- 现象：`pages/word-practice/word-detail` 在进入页面后的短时间内向 `/api/word-books/1/words` 发出两次请求，存在重复加载。
- 目标：找出触发重复请求的具体逻辑（生命周期钩子、watch、store、组件事件等），并通过调整生命周期或状态管理，保证该接口只会在需要时触发一次。
- 约束：保持 UTF-8 编码、现有生态方案（UniApp + store + services）必须复用，不得额外自研。

## 技术方案候选与评估
1. **重复生命周期调用**：可能由 `onLoad`、`onShow`、`watchEffect`、`computed` 或 store action 在多个入口被调用，需要追踪组件初始化顺序。
2. **store 订阅触发**：`wordPractice` 相关 store 也许在 `watch` 中监听 `bookId`，初始/变更导致 action 重复执行。
3. **路由/参数变化**：`onLoad` 与 `onReady/onShow` 共同触发加载，需要合并为单一初始化 promise 或使用缓存 guard。

预期策略：
- 收集 `word-detail.vue`、相关 store（`stores/wordPractice.js` 等）、services（`services/wordPractice.js` 或 `utils/request`）的现状。
- 找出 fetch 函数（例如 `loadWords` 或 `fetchWordList`）被调用的路径，确认是否存在多处调用并设定 guard（如 `loading` 标志、`once` promise、`uni.$once` 等）。

## 风险与未知
- sequential-thinking MCP 工具缺失，只能手工记录推理，需在文档中说明。
- 当前 store 逻辑较复杂，可能涉及全局事件（`uni.$emit`）导致难以排查触发源。
- 修复需确保依旧支持手动刷新/切换词书等场景，避免将来功能退化。

## 上下文收集计划
1. 执行结构化扫描，重点关注 `pages/word-practice` 下所有文件及 store/service，记录到 `.codex/context-scan.json`。
2. 对照 `pages/word-practice/word-practice.vue` 与 `word-detail.vue` 的实现，寻找可复用模式及潜在触发点。
3. 若仍不明确，针对高优先级疑问发起深挖（≤3次），每次聚焦一个问题。

## 实施步骤草案
1. 追踪 `word-detail` 初始化路径：`onLoad` 参数解析、store 调用、watcher。
2. 通过日志或静态分析确认 `/api/word-books/{id}/words` 在何处调用（store action or direct `request`）。
3. 调整为单一入口（例如只在 `onLoad` 调用并缓存 promise），或者增加幂等 guard。
4. 验证所有调用链（含刷新按钮、切换词书）都能触发一次请求。

## 验证策略
- 编写/更新针对 word detail 页的单元测试或模拟（若已有 tests/wordPractice.spec.js 可扩展）。
- 运行 `node tests/wordPractice.spec.js` 或其他现成脚本，确认无回归。
- 如需手动验证，利用日志/断点确保仅一次请求（可以通过 mock 或拦截器计数）。
