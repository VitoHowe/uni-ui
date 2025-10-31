/**
 * 图片解析工具
 * 用于处理题目中的图片占位符 ${images/xxx.jpg}
 */

/**
 * 解析题目中的图片占位符，转换为HTML标签
 * @param {string} text - 原始文本内容
 * @param {number} bankId - 题库ID
 * @param {string} baseUrl - API基础URL（不包含/api）
 * @returns {string} 包含HTML标签的富文本
 */
export function parseQuestionImages(text, bankId, baseUrl = 'http://localhost:3001') {
  if (!text) return ''
  
  let parsedText = text
  
  // 1. 替换图片占位符为 <img> 标签
  parsedText = parsedText.replace(
    /\$\{images\/([^}]+)\}/g,
    (match, filename) => {
      const imageUrl = `${baseUrl}/api/question-banks/${bankId}/images/${filename}`
      return `<img src="${imageUrl}" class="question-image" style="max-width:100%;border-radius:12rpx;margin:20rpx 0;box-shadow:0 4rpx 12rpx rgba(0,0,0,0.08);display:block;background:#f5f7fa;" />`
    }
  )
  
  // 2. 处理换行符，转换为 <br/>
  parsedText = parsedText.replace(/\n\n/g, '<br/><br/>')
  parsedText = parsedText.replace(/\n/g, '<br/>')
  
  return parsedText
}

/**
 * 提取文本中的所有图片URL（用于图片预览）
 * @param {string} text - 原始文本内容
 * @param {number} bankId - 题库ID
 * @param {string} baseUrl - API基础URL（不包含/api）
 * @returns {Array<string>} 图片URL数组
 */
export function extractImageUrls(text, bankId, baseUrl = 'http://localhost:3001') {
  if (!text) return []
  
  const urls = []
  const regex = /\$\{images\/([^}]+)\}/g
  let match
  
  while ((match = regex.exec(text)) !== null) {
    const filename = match[1]
    urls.push(`${baseUrl}/api/question-banks/${bankId}/images/${filename}`)
  }
  
  return urls
}

/**
 * 从多个文本字段中提取所有图片URL
 * @param {Object} question - 题目对象
 * @param {number} bankId - 题库ID
 * @param {string} baseUrl - API基础URL
 * @returns {Array<string>} 所有图片URL数组
 */
export function extractAllQuestionImages(question, bankId, baseUrl = 'http://localhost:3001') {
  if (!question) return []
  
  const urls = []
  
  // 从题目内容中提取
  if (question.content) {
    urls.push(...extractImageUrls(question.content, bankId, baseUrl))
  }
  
  // 从解析说明中提取
  if (question.explanation) {
    urls.push(...extractImageUrls(question.explanation, bankId, baseUrl))
  }
  
  return urls
}
