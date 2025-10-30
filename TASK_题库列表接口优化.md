# 题库列表接口优化任务

## 任务概述
优化题库列表页的接口调用，减少对服务器的压力。后端已更新 `/api/questions/banks` 接口，返回包含 `study_progress` 汇总字段的数据，前端需要使用该字段替代多次调用章节进度接口。

## 问题分析
**原问题**：
- 在 `exam-list.vue` 的 `fetchBankList` 函数中，对每个题库都调用 `/user-progress/${bankId}/chapters` 获取章节进度
- 如果有10个题库，就会调用10次接口，造成服务器压力

**后端优化**：
后端已在 `/api/questions/banks` 响应中添加 `study_progress` 字段：
```json
{
  "study_progress": {
    "total_chapters": 10,
    "studied_chapters": 3,
    "completed_questions": 150,
    "total_questions": 1000,
    "progress_percentage": 15,
    "last_study_time": "2025-10-29 23:00:00"
  }
}
```

## 解决方案

### 方案设计
采用**按需加载**策略：
1. 列表页只使用 `study_progress` 汇总数据显示整体进度
2. 只在用户点击"章节练习"或"继续学习"时，才调用 `/user-progress/${bankId}/chapters` 获取详细章节进度
3. 使用缓存机制，避免重复加载同一题库的章节进度

### 实施步骤

#### 1. 修改 fetchBankList 函数
**文件**：`pages/exam-list/exam-list.vue`

**修改内容**：
- ✅ 使用 `bank.study_progress` 字段映射到现有数据结构
- ✅ 删除循环调用 `/user-progress/${bankId}/chapters` 的代码（原第363-412行）
- ✅ 删除循环调用 `/question-banks/${bankId}/chapters` 的代码（原第367-376行）
- ✅ 将 `chapters` 初始化为 `[]`（标记为未加载状态）
- ✅ 将 `chapterProgress` 初始化为 `null`（标记为未加载状态）

**优化结果**：
- 从 **2N+1次接口调用** 优化为 **1次接口调用**（N为题库数量）
- 页面加载速度极大提升

#### 2. 实现按需加载机制
**修改函数**：
- ✅ `startExam()` - 点击题库时加载章节列表
- ✅ `startChapterPractice()` - 点击章节练习时加载章节进度
- ✅ `startFullPractice()` - 点击继续学习时加载章节进度（仅在有进度时）

**加载策略**：
```javascript
// 1. 章节列表按需加载（在 startExam 中）
if (!bank.chapters || bank.chapters.length === 0) {
  uni.showLoading({ title: '加载章节信息...' })
  const chaptersData = await get(`/question-banks/${bank.id}/chapters`)
  bank.chapters = chaptersData.chapters || []
  uni.hideLoading()
}

// 2. 章节进度按需加载（在 startChapterPractice 中）
if (bank.chapterProgress === null) {
  uni.showLoading({ title: '加载章节进度...' })
  const progressData = await get(`/user-progress/${bank.id}/chapters`)
  bank.chapterProgress = progressData || []
  uni.hideLoading()
}
```

#### 3. 更新进度显示逻辑
**修改函数**：
- ✅ `getProgressText()` - 使用 `studiedChapters` 和 `totalChapters` 显示
- ✅ 按钮文本判断 - 从 `current_question_index` 改为 `completed_count`
- ✅ 重置进度按钮 - 从 `current_question_index` 改为 `completed_count`

## 测试要点

### 功能测试
- [ ] 题库列表正常加载，显示学习进度
- [ ] 点击"章节练习"，正常显示章节列表和各章节进度
- [ ] 点击"整卷练习"，有进度时正确提示继续位置
- [ ] 进度显示文本正确：未学习显示"尚未开始"，已学习显示"已学习 X/Y 章节"
- [ ] "继续学习"/"开始练习"按钮根据进度正确显示

### 性能测试
- [ ] 初次加载题库列表，接口调用次数减少
- [ ] 网络面板验证：只调用1次 `/api/questions/banks`，不再批量调用章节进度接口
- [ ] 点击章节练习时，才调用该题库的章节进度接口
- [ ] 二次点击同一题库的章节练习，不会重复调用接口（有缓存）

### 兼容性测试
- [ ] 无学习记录的题库正常显示
- [ ] 有学习记录的题库正常显示进度
- [ ] 从答题页返回列表页，数据正确刷新

## 性能提升

### 优化前
- 题库列表加载：`1次题库接口 + N次章节接口 + N次章节进度接口`
- 假设10个题库：**1 + 10 + 10 = 21次接口调用**

### 优化后
- 题库列表加载：`1次题库接口`（仅加载题库基本信息和汇总进度）
- 假设10个题库：**仅1次接口调用**
- 章节列表按需加载：用户点击题库时才加载该题库的章节列表（1次）
- 章节进度按需加载：用户选择章节练习时才加载章节进度（1次）

### 提升效果
- **初始加载接口调用减少95%**（21 → 1）
- **服务器压力大幅降低**
- **用户体验显著提升**（加载速度极快）

## 注意事项
1. `chapterProgress` 为 `null` 表示未加载，为 `[]` 表示已加载但无进度
2. 章节进度数据在内存中缓存，页面刷新（onShow）时会重新加载题库列表，清空缓存
3. 后端必须返回 `study_progress` 字段，否则进度显示为0

## 完成状态
- [x] 修改 fetchBankList 函数
- [x] 实现按需加载章节进度
- [x] 更新进度显示逻辑
- [x] 修复答题页重复接口调用问题
- [x] 修复进度保存参数错误
- [x] 修复整卷练习总题数显示
- [x] 优化答题页UI（按钮和间距）
- [ ] 功能测试
- [ ] 性能测试验证

## 额外修复

### 1. 答题页重复调用问题
**问题**：点击下一题时，进度保存接口被调用2次
- 原因：`nextQuestion` 手动调用 + `watch` 监听器自动调用
- 解决：删除手动调用，只依赖 `watch` 监听器

### 2. 进度保存参数错误
**问题**：`completed_count` 只记录本次会话答题数，不符合后端逻辑
- 原因：使用 `getChapterAnsweredCount` 统计 `userAnswers` 对象
- 解决：`completed_count` 应等于 `current_question_number`
- 逻辑：答到第N题 = 完成了N题（无论是否作答）

### 3. 整卷练习与章节练习进度分离
**问题**：整卷练习使用章节进度判断，导致两种模式互相干扰
- **整卷练习进度查询**：
  - 调用 `GET /user-progress/${bankId}/full` 查询整卷练习专属进度
  - 不再依赖章节进度数据
- **进度保存区分模式**：
  - 章节练习：`POST /user-progress/${bankId}/chapters/${chapterId}`
    ```json
    {
      "practice_mode": "chapter",
      "current_question_number": 4,
      "completed_count": 4,
      "total_questions": 159
    }
    ```
  - 整卷练习：`POST /user-progress/${bankId}/chapters/0`
    ```json
    {
      "practice_mode": "full",
      "current_chapter_id": 1,
      "current_question_number": 4,
      "completed_count": 150,  // 前面章节题数 + 当前题号
      "total_questions": 2217
    }
    ```

### 4. 整卷练习总题数显示问题
**问题**：整卷练习时顶部显示"第1/0题"，总题数为0
- **原因1**：`bankData.stats?.total_questions` 路径不存在，应该是 `bankData.question_count`
- **原因2**：章节题数累加逻辑缺失
- **解决**：
  - 初始化时使用 `bankData.question_count`
  - 加载题目时累加所有章节的 `question_count`
  - 动态更新 `bankInfo.value.total_questions`

### 5. 答题页UI优化（移动端优化）
**设计理念**：刷题小程序，题目应占主要部分，减少UI元素占用空间

**按钮优化**：
- padding: `28rpx` → `20rpx 16rpx` （减少30%高度）
- gap: `8rpx` → `6rpx`（按钮间距更紧凑）
- font-size: `28rpx` → `26rpx`（字体略小）
- border-radius: `16rpx` → `12rpx`（圆角更精致）
- icon size: `18` → `16`（图标更小）
- 添加阴影：`box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08)`

**题目区域优化**：
- 题目卡片 padding: `32rpx` → `24rpx`
- 题目字体: `32rpx` → `30rpx`
- 题目卡片圆角: `20rpx` → `16rpx`
- 题目区域设置 `flex: 1` 和 `overflow-y: auto`，让题目自适应高度

**选项优化**：
- 选项间距 gap: `16rpx` → `12rpx`
- 选项 padding: `24rpx` → `18rpx 20rpx`
- 选项标签大小: `56rpx` → `48rpx`
- 选项字体: `28rpx` → `27rpx`

**答案解析优化**：
- 解析卡片 padding: `32rpx` → `24rpx`
- 标题字体: `30rpx` → `28rpx`
- 内容间距 gap: `20rpx` → `16rpx`
- 所有字体略微缩小2-3rpx

**效果**：
- 按钮区域高度减少约 **30-40rpx**
- 题目和选项显示空间增加约 **15%**
- 整体视觉更紧凑、精致，更适合移动端
