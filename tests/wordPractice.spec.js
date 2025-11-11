const fs = require('fs')
const path = require('path')
const assert = require('assert')

const dataPath = path.resolve(__dirname, '../mock/中高项单词词库.json')
const payload = fs.readFileSync(dataPath, 'utf-8')
const words = JSON.parse(payload)

assert(Array.isArray(words), '词库必须是数组')
assert(words.length >= 100, '词库数据量过少，请检查后端导出')

const ids = new Set()
const duplicates = new Set()
words.forEach((item, index) => {
  assert(item.english && typeof item.english === 'string', `第 ${index + 1} 条缺少英文字段`)
  assert(item.chinese && typeof item.chinese === 'string', `第 ${index + 1} 条缺少中文释义`)
  const trimmedId = item.english.trim()
  if (ids.has(trimmedId)) {
    duplicates.add(trimmedId)
    return
  }
  ids.add(trimmedId)
})

assert(ids.size >= 300, '有效词条数量不足，请检查词库文件')

const duplicateNote = duplicates.size ? `，其中 ${duplicates.size} 条重复已忽略` : ''
console.log(`✅ 词库校验通过，共 ${ids.size} 条有效记录${duplicateNote}`)
