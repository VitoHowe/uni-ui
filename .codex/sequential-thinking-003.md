# Sequential Thinking — 2025-11-12 (UI refinement & slimming)

## 任务解析
- Hub（word-practice.vue）中的词书选择弹窗（WordBookSelector）仍为默认样式，需要高级设计 (圆角、渐变背景、按钮)。
- Detail 页仍显示之前模块，需要更聚焦：只保留练习卡、搜索、词列表，收藏/错词等统计模块要瘦身或改为轻量提示。
- Detail 页整体视觉需提升，与新 hub 统一。

## 技术考虑
- WordBookSelector 组件应支持投影、半透明背景、卡片 list 优化。
- Detail 页 UI 需 reorganize：Hero header -> search -> quick actions? but user wants mainly practice + list; keep quick actions minimal or integrate? Maybe combine into chips.
- Remove WordStatusPanel blocks or convert to collapsible tags.
- Ensure store usage unchanged.

## 风险
- Removing modules may drop functionality; ensure essential actions accessible elsewhere (e.g., quick actions referencing favorites/mistakes).
- Style changes must remain mobile-friendly.

## 计划
1. Restyle WordBookSelector (container, header, list items, buttons).
2. Simplify detail layout: hero card emphasising book info, keep toolbar (search + quick actions) but lighten; drop WordStatusPanel or convert to simple horizontal chips; highlight list.
3. Update CSS accordingly.
4. Verify navigation/test script.
