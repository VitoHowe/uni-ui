# 验证报告（2025-11-16 / Codex）

| 验证项 | 结果 | 说明 |
| ------ | ---- | ---- |
| 词库结构校验 | 通过 | `node tests/wordPractice.spec.js`，自动忽略 1 条重复词条 |
| study入口检查 | 通过 | 入口 CTA 展示已掌握/待复习统计并读取真实词库长度 |
| 单词练习页静态审查 | 通过 | 界面精简为中英文+发音+收藏/复习，新增搜索、分页、随机抽词 |
| 真机/端侧冒烟 | 未执行 | 需在微信/Android/iOS 上确认列表性能与音频授权 |
| word-detail 请求次数 | 通过 | 静态审查确认仅剩 `store.selectBook`（内部 `await loadWords`）与 `initDetailPage` fallback 触发 `/word-books/{id}/words`，watch/selector 已不再重复调用 |

## 风险
1. **音频限制**：`InnerAudioContext` 在不同端的授权策略可能不同，需上线前实机验证。
2. **本地存储容量**：收藏/复习状态暂存储在 `WORD_PRACTICE_PROGRESS`，若后续词库扩展需考虑服务端同步方案。
3. **大规模渲染**：批量渲染 30 条/页，如需更大分页或搜索建议引入虚拟列表。
4. **真实网络验证**：静态检查确认只有单一请求入口，但仍需在真机/真实 API 环境中用 Network 面板复核。 
