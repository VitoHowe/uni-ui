"use strict";
function parseQuestionImages(text, bankId, baseUrl = "http://localhost:3001") {
  if (!text)
    return "";
  let parsedText = text;
  parsedText = parsedText.replace(
    /\$\{images\/([^}]+)\}/g,
    (match, filename) => {
      const imageUrl = `${baseUrl}/api/question-banks/${bankId}/images/${filename}`;
      return `<img src="${imageUrl}" class="question-image" style="max-width:100%;border-radius:12rpx;margin:20rpx 0;box-shadow:0 4rpx 12rpx rgba(0,0,0,0.08);display:block;background:#f5f7fa;" />`;
    }
  );
  parsedText = parsedText.replace(/\n\n/g, "<br/><br/>");
  parsedText = parsedText.replace(/\n/g, "<br/>");
  return parsedText;
}
function extractImageUrls(text, bankId, baseUrl = "http://localhost:3001") {
  if (!text)
    return [];
  const urls = [];
  const regex = /\$\{images\/([^}]+)\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const filename = match[1];
    urls.push(`${baseUrl}/api/question-banks/${bankId}/images/${filename}`);
  }
  return urls;
}
function extractAllQuestionImages(question, bankId, baseUrl = "http://localhost:3001") {
  if (!question)
    return [];
  const urls = [];
  if (question.content) {
    urls.push(...extractImageUrls(question.content, bankId, baseUrl));
  }
  if (question.explanation) {
    urls.push(...extractImageUrls(question.explanation, bankId, baseUrl));
  }
  return urls;
}
exports.extractAllQuestionImages = extractAllQuestionImages;
exports.parseQuestionImages = parseQuestionImages;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/imageParser.js.map
