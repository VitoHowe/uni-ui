# 单词练习接口联动说明（2025-11-12，Codex）

## 已接入的后端接口
1. `GET /api/word-books`
   - 需要返回 `books` 数组、`total`、`pagination`。
   - 前端使用字段：`id、name、description、language、total_words、created_at、updated_at` 以及源文件信息。
2. `GET /api/word-books/{id}/words`
   - 需要返回 `book` 基本信息和 `words` 数组。
   - 词条字段：`id、word、translation、phonetic、definition、example_sentence、part_of_speech、tags、extra、order_index`。
   - 前端会将 `book.name` 写入 `bookName`，供收藏/错词模块显示来源。

## 新增/扩展需求
为实现跨设备的收藏、错词、掌握及学习进度，需要补充以下接口：

1. `GET /api/word-books/{bookId}/progress`
   - **参数**：`bookId`（路径），可选 `userId` 若后端无法从 token 解析。
   - **响应示例**：
     ```json
     {
       "favorites": ["word-id-1", "word-id-2"],
       "mistakes": ["word-id-3"],
       "mastered": ["word-id-4"],
       "last_cursor": 120
     }
     ```
   - **说明**：返回指定单词本下的收藏/错词/掌握列表以及最近停留的词索引，用于初始化前端进度。

2. `POST /api/word-books/{bookId}/progress`
   - **Body**：
     ```json
     {
       "favorites": ["word-id-1"],
       "mistakes": ["word-id-3"],
       "mastered": ["word-id-4", "word-id-5"],
       "last_cursor": 135
     }
     ```
   - **语义**：全量覆盖当前书籍的进度快照。

3. （可选）`PATCH /api/word-books/{bookId}/words/{wordId}/state`
   - **Body**：`{ "state": "favorite" | "mistake" | "mastered" | "pending" }`
   - **作用**：允许增量更新，便于后续做实时同步或操作日志。

### 数据结构建议
| 字段        | 类型      | 说明                      |
|-------------|-----------|---------------------------|
| favorites   | string[]  | 收藏词条 ID 列表          |
| mistakes    | string[]  | 待复习/错词 ID 列表       |
| mastered    | string[]  | 已掌握词条 ID 列表        |
| last_cursor | number    | 当前学习位置（从 0 开始） |
| updated_at  | string    | 可选，后端维护更新时间    |

## 其他约定
- 所有接口沿用现有 `code/message/data` 包装格式，并在 `data` 中返回上述结构。
- 由于前端已支持本地 fallback，接口开发完成后只需返回 200 即可被使用，无需额外兼容逻辑。
- 若需要扩展错词本或全局收藏夹，可在 `GET /api/word-books` 中追加统计字段（例如 `favorite_count`、`mistake_count`），前端可直接展示。

如需进一步协商字段或节流策略，请同步通知前端以更新 `services/wordBooks.js` 与 `word progress` 存储策略。
