# 单词练习模块设计（2025-11-11 / Codex）

## 数据与接口
- 数据来源：`mock/word-practice.json`（后续由后端API替换）。
- 字段：`word`、`phonetic.uk/us`、`definition`、`note`、`example.sentence/translation/analysis[]`、`tags`、`level`。
- 运行时字段：`bookmarked`、`mastery`、`lastReviewedAt`，在前端以`reactive`对象管理。
- 发音API：临时调用免费接口`https://dict.youdao.com/dictvoice?type=<accent>&audio=<word>`，以后替换为后端代理，函数保留Promise封装。

## 交互流程
1. 页面加载 -> 读取mock列表 -> 初始化`currentWordIndex=0`、`progress`。
2. 用户可通过左右切换按钮浏览单词，支持循环切换。
3. 点击“英/美式发音”按钮 -> 调用`mockPronunciationApi` -> 设置`InnerAudioContext`播放 -> UI展示loading/当前口音。
4. 例句区展示英文/中文与分析tags，点击“刷新例句”暂用随机切换（预留接口）。
5. 辅助动作：`收藏`切换`bookmarked`、`掌握`/`待复习`写入`mastery`并自动跳到下一词。

## UI布局
- 在`study-modules`与`recent-study`之间新增`uni-section`式卡片。
- 卡片包含：进度条、单词标题行、发音按钮行、释义与注释、例句分析块、操作按钮行。
- 色彩：沿用项目蓝+渐变阴影，保持卡片风格一致。

## 风险与应对
- **音频受限**：若运行环境不支持`InnerAudioContext`，toast提示并不阻塞其他操作。
- **数据缺失**：为字段提供默认值与空态提示。
- **滚动性能**：仅渲染一个当前单词卡片，其余通过切换索引控制，防止长列表。 
