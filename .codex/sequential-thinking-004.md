# Sequential Thinking — 2025-11-12 (Word detail refactor 2)

## 任务需求
- Hub 页面不应在未进入练习时提前请求 `/api/word-books/{id}/words`，避免重复加载。
- Detail 页 UI 需再次升级成世界级商业风：更精致的 hero 卡、按钮、状态展示。
- Detail 页仅保留必要模块：练习卡、单词列表、搜索；其他统计需轻量呈现。

## 数据与调用策略
- `word-practice.vue` 应只调用 `/api/word-books`，并基于返回的 `total_words`、`name` 等展示信息。若需收藏/错词数量，可从本地 progress store 获取但不需要单词详情。
- `store.loadWords(bookId)` 只在 detail 页面（或需要练习时）触发。Hub 页面 preview 改成显示计数/提示，不依赖具体单词数据。
- Detail 页面 `onLoad` 或切换书籍时请求 `/word-books/{id}/words`，并缓存到 store。

## UI 思路
- Hub Hero：继续 gradient + glass；弹窗 WordBookSelector 已升级。
- Detail Hero：背景渐变、包含书籍信息、切换按钮使用圆形浮层。
- 搜索条+动作 pills 统一 brand 颜色；WordPracticePanel 下方 list 采用卡片/行 + source 标签。

## 风险
- 移除 hub 对单词列表的访问后，favorites/mistakes preview 只能显示 ID；需随 detail 页面加载后更新 store currentWords 供 hub 当次使用（maybe degrade gracefully）。
- Detail 页 UI 调整需确保 practice panel 组件兼容新的父级 spacing。

## 行动步骤
1. 修改 `pages/word-practice/word-practice.vue`：不再调用 `store.loadWords`，preview 使用 counts。
2. 调整 hub 文案/提示以解释需进入词书才能查看收藏详情。
3. Detail 页 hero +布局重做， quick actions 轻量；global styles update。
4. 确认 `store` 仍在 detail 进页时 fetch words；测试。***
