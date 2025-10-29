# 学习进度API升级说明

## 📋 升级概述

**升级日期**：2025-10-29  
**版本**：v2.0  
**目的**：支持章节级别的学习进度管理，配合单题模式API

---

## 🎯 升级背景

### 原有系统问题
1. ❌ 只支持**题库级别**进度（整个题库一个进度）
2. ❌ 使用 `current_question_index`（索引0,1,2...）而非题号（1,2,3...）
3. ❌ 无法记录用户在不同章节的学习进度
4. ❌ 无法支持"继续练习某一章节"功能

### 新系统特性
1. ✅ 支持**章节级别**进度（每个章节独立进度）
2. ✅ 使用 `current_question_number`（题号1,2,3...）
3. ✅ 记录用户、题库、章节、题号
4. ✅ 提供题库完成度统计和继续练习功能

---

## 📊 数据库变更

### 表结构变化

**表名**：`user_study_progress`

#### 新增字段
| 字段名 | 类型 | 说明 |
|--------|------|------|
| `chapter_id` | INT NULL | 章节ID（NULL表示旧的题库级别记录） |
| `current_question_number` | INT NULL | 当前题号（从1开始，推荐使用） |

#### 索引变化
- ✅ 添加：`idx_chapter_id` - 章节索引
- ✅ 添加：`uk_user_bank_chapter` - 唯一约束（user_id, bank_id, chapter_id）
- ❌ 删除：`uk_user_bank` - 旧的唯一约束（仅题库级别）

#### 外键约束
- ✅ 添加：`fk_progress_chapter` - 章节外键约束

### 迁移脚本
```bash
# 执行迁移
npx ts-node -r tsconfig-paths/register scripts/migrate-progress-chapters.ts
```

---

## 🔗 新增API接口

### 1. 获取章节学习进度
```http
GET /api/user-progress/:bankId/chapters/:chapterId
```

**请求示例**：
```bash
GET /api/user-progress/15/chapters/1
Authorization: Bearer YOUR_TOKEN
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取章节学习进度成功",
  "data": {
    "id": 1,
    "user_id": 10,
    "bank_id": 15,
    "chapter_id": 1,
    "current_question_number": 5,
    "completed_count": 5,
    "total_questions": 50,
    "progress_percentage": 10,
    "chapter_name": "第01章-信息化发展",
    "bank_name": "系统架构师题库",
    "last_study_time": "2025-10-29 23:00:00"
  }
}
```

---

### 2. 保存章节学习进度
```http
POST /api/user-progress/:bankId/chapters/:chapterId
```

**请求体**：
```json
{
  "current_question_number": 5,
  "completed_count": 5,
  "total_questions": 50
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "保存章节学习进度成功",
  "data": {
    "id": 1,
    "user_id": 10,
    "bank_id": 15,
    "chapter_id": 1,
    "current_question_number": 5,
    "completed_count": 5,
    "total_questions": 50,
    "progress_percentage": 10
  }
}
```

---

### 3. 获取题库所有章节进度
```http
GET /api/user-progress/:bankId/chapters
```

**请求示例**：
```bash
GET /api/user-progress/15/chapters
Authorization: Bearer YOUR_TOKEN
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取题库章节进度成功",
  "data": [
    {
      "id": 1,
      "chapter_id": 1,
      "chapter_name": "第01章-信息化发展",
      "chapter_order": 1,
      "current_question_number": 5,
      "completed_count": 5,
      "total_questions": 50,
      "progress_percentage": 10,
      "last_study_time": "2025-10-29 23:00:00"
    },
    {
      "id": 2,
      "chapter_id": 2,
      "chapter_name": "第02章-信息技术发展",
      "chapter_order": 2,
      "current_question_number": 10,
      "completed_count": 10,
      "total_questions": 48,
      "progress_percentage": 21,
      "last_study_time": "2025-10-29 22:30:00"
    }
  ]
}
```

---

## 🔄 兼容性说明

### 旧接口仍然可用
```http
# 题库级别进度（兼容旧版本）
GET /api/user-progress/:bankId
POST /api/user-progress/:bankId
DELETE /api/user-progress/:bankId
```

### 数据兼容
- ✅ 旧记录保留（`chapter_id = NULL`）
- ✅ 新记录必须指定 `chapter_id`
- ✅ 推荐使用 `current_question_number`（题号）
- ⚠️ 保留 `current_question_index`（索引）用于向后兼容

---

## 💡 前端使用示例

### 场景1：答题页面（单题模式）

```javascript
// 1. 获取章节进度（判断是否需要继续练习）
const getChapterProgress = async (bankId, chapterId) => {
  const res = await fetch(`/api/user-progress/${bankId}/chapters/${chapterId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  
  if (data.data) {
    // 有进度，继续练习
    const { current_question_number, total_questions } = data.data;
    return current_question_number + 1; // 下一题
  } else {
    // 无进度，从第1题开始
    return 1;
  }
};

// 2. 加载题目
const loadQuestion = async (bankId, chapterId, questionNumber) => {
  const res = await fetch(
    `/api/question-banks/${bankId}/chapters/${chapterId}/questions?questionNumber=${questionNumber}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await res.json();
  return data.data.question;
};

// 3. 保存进度（用户答完一题后）
const saveProgress = async (bankId, chapterId, currentNumber, completedCount, total) => {
  await fetch(`/api/user-progress/${bankId}/chapters/${chapterId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      current_question_number: currentNumber,
      completed_count: completedCount,
      total_questions: total
    })
  });
};

// 使用流程
const startPractice = async (bankId, chapterId) => {
  // 1. 获取应该从第几题开始
  const startNumber = await getChapterProgress(bankId, chapterId);
  
  // 2. 加载题目
  const question = await loadQuestion(bankId, chapterId, startNumber);
  
  // 3. 用户答题后保存进度
  await saveProgress(bankId, chapterId, startNumber, startNumber, 50);
};
```

---

### 场景2：题库首页（显示各章节完成度）

```javascript
const getBankProgress = async (bankId) => {
  const res = await fetch(`/api/user-progress/${bankId}/chapters`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data;
};

// 渲染章节列表
const renderChapters = async (bankId) => {
  const progress = await getBankProgress(bankId);
  
  chapters.forEach(chapter => {
    const chapterProgress = progress.find(p => p.chapter_id === chapter.id);
    
    if (chapterProgress) {
      // 有进度，显示完成度和"继续练习"按钮
      console.log(`${chapter.name}: ${chapterProgress.progress_percentage}% 完成`);
      console.log(`继续从第 ${chapterProgress.current_question_number + 1} 题开始`);
    } else {
      // 无进度，显示"开始练习"按钮
      console.log(`${chapter.name}: 未开始`);
    }
  });
};
```

---

### 场景3：微信小程序示例

```javascript
// pages/practice/practice.js
Page({
  data: {
    bankId: 15,
    chapterId: 1,
    currentNumber: 1,
    question: null
  },
  
  async onLoad(options) {
    const { bankId, chapterId } = options;
    this.setData({ bankId, chapterId });
    
    // 获取进度
    const progress = await this.getProgress();
    const startNumber = progress ? progress.current_question_number + 1 : 1;
    
    // 加载题目
    await this.loadQuestion(startNumber);
  },
  
  async getProgress() {
    const res = await wx.request({
      url: `${API_BASE}/api/user-progress/${this.data.bankId}/chapters/${this.data.chapterId}`,
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` }
    });
    return res.data.data;
  },
  
  async loadQuestion(questionNumber) {
    const res = await wx.request({
      url: `${API_BASE}/api/question-banks/${this.data.bankId}/chapters/${this.data.chapterId}/questions`,
      data: { questionNumber },
      header: { 'Authorization': `Bearer ${wx.getStorageSync('token')}` }
    });
    
    const { question, total, hasNext } = res.data.data;
    this.setData({ 
      question, 
      currentNumber: questionNumber,
      total,
      hasNext 
    });
  },
  
  async nextQuestion() {
    // 保存当前进度
    await this.saveProgress();
    
    // 加载下一题
    await this.loadQuestion(this.data.currentNumber + 1);
  },
  
  async saveProgress() {
    await wx.request({
      url: `${API_BASE}/api/user-progress/${this.data.bankId}/chapters/${this.data.chapterId}`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        'Content-Type': 'application/json'
      },
      data: {
        current_question_number: this.data.currentNumber,
        completed_count: this.data.currentNumber,
        total_questions: this.data.total
      }
    });
  }
});
```

---

## 📝 API参数对比

### 旧版本（题库级别）
```json
{
  "current_question_index": 4,  // 索引（0,1,2,3,4...）
  "completed_count": 5,
  "total_questions": 100
}
```

### 新版本（章节级别）
```json
{
  "chapter_id": 1,                    // 章节ID
  "current_question_number": 5,       // 题号（1,2,3,4,5...）
  "completed_count": 5,
  "total_questions": 50               // 该章节的总题数
}
```

---

## ⚠️ 注意事项

1. **唯一性约束**：同一用户在同一题库的同一章节只能有一条进度记录
2. **题号从1开始**：`current_question_number` 从1开始，与 `questionNumber` 参数保持一致
3. **向后兼容**：旧的题库级别接口仍可使用（`chapter_id = NULL`）
4. **删除行为**：删除章节会级联删除该章节的学习进度

---

## 🚀 迁移建议

### 对于新项目
直接使用新的章节级别API：
- `POST /api/user-progress/:bankId/chapters/:chapterId`
- `GET /api/user-progress/:bankId/chapters/:chapterId`

### 对于旧项目
可以继续使用旧API，或逐步迁移：
1. 继续使用 `POST /api/user-progress/:bankId`（题库级别）
2. 在新功能中使用章节级别API
3. 旧数据（`chapter_id = NULL`）不受影响

---

## ✅ 总结

| 特性 | 旧版本 | 新版本 |
|------|--------|--------|
| 进度粒度 | 题库级别 | 章节级别 ✅ |
| 题目定位 | 索引（0开始） | 题号（1开始） ✅ |
| 继续练习 | 不支持章节 | 支持章节 ✅ |
| 完成度统计 | 整体统计 | 分章节统计 ✅ |
| API兼容性 | - | 向后兼容 ✅ |

**升级完成！** 🎉




## 📚 章节管理模块

### 概述
章节管理模块用于按章节组织和管理题目，优化题目加载性能。当AI解析文件后，系统会自动按照题目的`tags`字段（取第一个标签作为章节名）将题目拆分到不同章节中存储。

**数据表**: `question_chapters` + `questions`
- 支持按章节分页查询题目
- 避免一次性加载大量题目导致性能问题
- 前端可按需加载不同章节内容

### GET /api/question-banks/:bankId/chapters （获取题库章节列表）

- **功能**：获取指定题库的所有章节
- **权限**：需要 Bearer Token
- **路径参数**：
  - `bankId` （必填）：题库ID

#### 请求示例
```bash
GET /api/question-banks/2/chapters
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取题库章节成功",
  "data": {
    "chapters": [
      {
        "id": 1,
        "bank_id": 2,
        "chapter_name": "第01章-信息化发展",
        "chapter_order": 1,
        "question_count": 50,
        "created_at": "2025-10-29 16:30:00",
        "updated_at": "2025-10-29 16:30:00"
      },
      {
        "id": 2,
        "bank_id": 2,
        "chapter_name": "第02章-信息技术发展",
        "chapter_order": 2,
        "question_count": 48,
        "created_at": "2025-10-29 16:30:00",
        "updated_at": "2025-10-29 16:30:00"
      }
    ],
    "totalChapters": 20
  }
}
```

### GET /api/question-banks/:bankId/chapters/stats （获取题库章节统计）

- **功能**：获取题库的章节统计信息
- **权限**：需要 Bearer Token
- **路径参数**：
  - `bankId` （必填）：题库ID

#### 请求示例
```bash
GET /api/question-banks/2/chapters/stats
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取题库章节统计成功",
  "data": {
    "totalChapters": 20,
    "totalQuestions": 1000,
    "chapters": [
      { "name": "第01章-信息化发展", "count": 50 },
      { "name": "第02章-信息技术发展", "count": 48 }
    ]
  }
}
```

### GET /api/question-banks/:bankId/chapters/:chapterId （获取章节详情）

- **功能**：获取指定题库的指定章节详细信息
- **权限**：需要 Bearer Token
- **路径参数**：
  - `bankId` （必填）：题库ID
  - `chapterId` （必填）：章节ID

#### 请求示例
```bash
GET /api/question-banks/2/chapters/1
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取章节详情成功",
  "data": {
    "id": 1,
    "bank_id": 2,
    "chapter_name": "第01章-信息化发展",
    "chapter_order": 1,
    "question_count": 50,
    "created_at": "2025-10-29 16:30:00",
    "updated_at": "2025-10-29 16:30:00"
  }
}
```

#### 错误响应
```json
{
  "code": 404,
  "message": "章节不存在或不属于该题库"
}
```

### GET /api/question-banks/:bankId/chapters/:chapterId/questions （获取章节题目）

- **功能**：获取指定题库的指定章节的题目列表，支持三种模式
- **权限**：需要 Bearer Token
- **路径参数**：
  - `bankId` （必填）：题库ID
  - `chapterId` （必填）：章节ID
- **查询参数**：
  - `questionNumber` （可选）：题号（从1开始），传入时返回单个题目（逐题答题场景）
  - `page` （可选）：页码，默认1（仅在分页模式下有效）
  - `limit` （可选）：每页数量，**默认0（返回全部题目）**，设置具体数值时最大100

#### 使用场景

**1️⃣ 单题模式（推荐）**：逐题加载，减轻网络压力
```bash
# 获取第1题
GET /api/question-banks/2/chapters/1/questions?questionNumber=1

# 获取第2题
GET /api/question-banks/2/chapters/1/questions?questionNumber=2

# 获取第50题
GET /api/question-banks/2/chapters/1/questions?questionNumber=50

# 超出范围（如第51题，但只有50题）
GET /api/question-banks/2/chapters/1/questions?questionNumber=51
```

**2️⃣ 全量模式**：一次性加载所有题目
```bash
GET /api/question-banks/2/chapters/1/questions
```

**3️⃣ 分页模式**：题库管理场景
```bash
GET /api/question-banks/2/chapters/1/questions?page=1&limit=20
GET /api/question-banks/2/chapters/1/questions?page=2&limit=20
```

#### 响应示例

**单题模式响应**（推荐）：
```json
{
  "code": 200,
  "message": "获取题目成功",
  "data": {
    "question": {
      "id": 101,
      "bank_id": 2,
      "chapter_id": 1,
      "question_no": "1",
      "type": "single",
      "content": "关于信息的描述，不正确的是（）。",
      "options": ["A.选项1", "B.选项2", "C.选项3", "D.选项4"],
      "answer": "D",
      "explanation": "解析内容...",
      "difficulty": 2,
      "tags": ["第01章-信息化发展"],
      "bank_name": "系统架构师题库",
      "chapter_name": "第01章-信息化发展"
    },
    "total": 50,
    "currentNumber": 1,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**超出范围响应**：
```json
{
  "code": 200,
  "message": "没有更多题目了",
  "data": {
    "total": 50
  }
}
```

**全量/分页模式响应**：
```json
{
  "code": 200,
  "message": "获取章节题目成功",
  "data": {
    "questions": [
      {
        "id": 101,
        "bank_id": 2,
        "chapter_id": 1,
        "question_no": "1",
        "type": "single",
        "content": "关于信息的描述，不正确的是（）。",
        "options": ["A.选项1", "B.选项2", "C.选项3", "D.选项4"],
        "answer": "D",
        "explanation": "解析内容...",
        "difficulty": 2,
        "tags": ["第01章-信息化发展"],
        "bank_name": "系统架构师题库",
        "chapter_name": "第01章-信息化发展"
      }
    ],
    "total": 50,
    "pagination": {
      "page": 1,
      "limit": 0,
      "total": 50,
      "totalPages": 1
    }
  }
}
```

### DELETE /api/question-banks/:bankId/chapters/:chapterId （删除章节）

- **功能**：删除指定题库的指定章节（级联删除该章节下的所有题目）
- **权限**：需要 Bearer Token
- **路径参数**：
  - `bankId` （必填）：题库ID
  - `chapterId` （必填）：章节ID

#### 请求示例
```bash
DELETE /api/question-banks/2/chapters/1
```

#### 响应示例
```json
{
  "code": 200,
  "message": "删除章节成功",
  "data": null
}
```

#### 错误响应
```json
{
  "code": 404,
  "message": "章节不存在或不属于该题库"
}
```

### 前端使用示例

#### 1. 获取题库章节列表
```javascript
// 获取题库的所有章节
const response = await fetch('/api/question-banks/2/chapters', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await response.json();
console.log('章节列表:', data.chapters);
console.log('共有章节数:', data.totalChapters);
```

#### 2. 按章节分页加载题目
```javascript
// 用户选择章节后，按页加载题目
async function loadChapterQuestions(chapterId, page = 1) {
  const response = await fetch(
    `/api/chapters/${chapterId}/questions?page=${page}&limit=20`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const { data } = await response.json();
  
  return {
    questions: data.questions,
    pagination: data.pagination
  };
}

// 使用示例
const result = await loadChapterQuestions(1, 1);
console.log('题目列表:', result.questions);
console.log('总页数:', result.pagination.totalPages);
```

---

## 📚 题库管理模块

### 概述
题库管理模块提供题库的查询和管理功能，支持获取题库列表、题库详情和题库统计信息。

**数据表**: `question_banks`
- 存储题库基本信息（名称、描述、创建者等）
- 记录题目总数和解析状态
- 支持分页查询

### GET /api/questions/banks （获取题库列表）

- **功能**：获取所有已完成解析的题库列表
- **权限**：需要 Bearer Token
- **查询参数**：
  - `page` （可选）：页码，默认1
  - `limit` （可选）：每页数量，默认20，最大100

#### 请求示例
```bash
GET /api/questions/banks?page=1&limit=20
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取题库列表成功",
  "data": {
    "banks": [
      {
        "id": 15,
        "name": "系统架构师题库",
        "description": "2024年系统架构师考试题库",
        "file_original_name": "系统架构师.pdf",
        "file_type": "pdf",
        "file_size": 2048000,
        "parse_status": "completed",
        "question_count": 1000,
        "creator_name": "张三",
        "created_by": 10,
        "created_at": "2025-10-29 10:00:00",
        "updated_at": "2025-10-29 11:00:00"
      },
      {
        "id": 16,
        "name": "网络工程师题库",
        "description": null,
        "file_original_name": "网络工程师真题.pdf",
        "file_type": "pdf",
        "file_size": 1536000,
        "parse_status": "completed",
        "question_count": 800,
        "creator_name": "李四",
        "created_by": 11,
        "created_at": "2025-10-28 15:30:00",
        "updated_at": "2025-10-28 16:45:00"
      }
    ],
    "total": 25,
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

### GET /api/questions/banks/:id （获取题库详情）

- **功能**：获取指定题库的详细信息和统计数据
- **权限**：需要 Bearer Token
- **路径参数**：
  - `id` （必填）：题库ID

#### 请求示例
```bash
GET /api/questions/banks/15
```

#### 响应示例
```json
{
  "code": 200,
  "message": "获取题库详情成功",
  "data": {
    "id": 15,
    "name": "系统架构师题库",
    "description": "2024年系统架构师考试题库",
    "file_original_name": "系统架构师.pdf",
    "file_type": "pdf",
    "file_size": 2048000,
    "parse_status": "completed",
    "creator_name": "张三",
    "created_by": 10,
    "created_at": "2025-10-29 10:00:00",
    "updated_at": "2025-10-29 11:00:00",
    "stats": {
      "total_questions": 1000,
      "single_choice": 600,
      "multiple_choice": 250,
      "judge": 100,
      "fill": 30,
      "essay": 20,
      "difficulty_easy": 300,
      "difficulty_medium": 500,
      "difficulty_hard": 200
    }
  }
}
```

#### 错误响应
```json
{
  "code": 404,
  "message": "题库不存在"
}
```