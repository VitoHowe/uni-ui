# Sequential Thinking — 2025-11-12 (Task 2)

## 任务理解
- 用户希望再度优化单词练习体验：主页只展示单词本、收藏夹、错词复习三个模块，练习与全部单词列表迁移到新页面。
- 需要重新设计样式，提升视觉品质。
- 发音接口在包含括号等符号的词组时失败，需要做编码或降级策略。

## 技术方案初探
1. **路由/页面结构**
   - 现有 `pages/word-practice/word-practice.vue` 需转型为“单词本 hub”，显示卡片+入口。
   - 新增子页面（例如 `pages/word-practice/detail.vue`）用于处理具体书籍练习+列表。
2. **组件复用**
   - 现有组件可复用（header/panel/list等），需要根据页面拆分调整 props。
3. **样式升级**
   - 定义统一的卡片布局、留白、渐变/玻璃风/柔和阴影。
   - 确保移动端响应式。
4. **发音修复**
   - 对 `audio` 参数进行 encodeURIComponent（已做）但 still failing due to parentheses? maybe need fallback: remove括号内容 or replace spaces?
   - 方案：优先 encode；若含括号等，尝试 `word.word` -> `word.word.replace(/[()]/g, '')` or use `word.extra.english_short`. Provide safe slug.

## 风险识别
- 页面拆分后，需要维护 store/路由状态传递（bookId/words）以免重复加载。
- 组件/状态在两个页面被使用，需避免重复 fetch（可通过 Pinia store 复用）。
- 发音 sanitization 需确保不破坏 legitimate characters（control char, etc.); maybe degrade by removing parentheses and extra spacing.

## 实施步骤初稿
1. Review current router/pages config to add new detail page entry.
2. Refactor `word-practice.vue` -> list view; create new page (e.g., `pages/word-practice/detail.vue`) to host existing practice components.
3. Update navigation (from hub to detail) and ensure store loads data when hitting detail (maybe onLoad with `bookId` param).
4. Polish UI (cards, gradient backgrounds, reorganized sections).
5. Implement pronouncing sanitization helper.
6. Update docs/tests accordingly.

## 未决问题
- 具体 navigation: use `uni.navigateTo`? Should confirm.
- Should favorites/mistakes be accessible globally or per book? Probably per book; need to show aggregated view on hub.
