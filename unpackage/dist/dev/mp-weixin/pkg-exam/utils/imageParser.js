"use strict";
const common_vendor = require("../../common/vendor.js");
const markdown = new common_vendor.MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
});
const ESCAPED_DOLLAR_TOKEN = "__WX_ESCAPED_DOLLAR__";
const replaceImagePlaceholders = (text, bankId, baseUrl) => {
  return text.replace(/\$\{images\/([^}]+)\}/g, (match, filename) => {
    const imageUrl = `${baseUrl}/api/question-banks/${bankId}/images/${filename}`;
    return `![image](${imageUrl})`;
  });
};
const sanitizeRenderedHtml = (html) => {
  if (!html)
    return "";
  let output = html;
  output = output.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  output = output.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  output = output.replace(/<(iframe|object|embed)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  output = output.replace(/\son\w+=(["']).*?\1/gi, "");
  output = output.replace(/\son\w+=\S+/gi, "");
  output = output.replace(/(href|src)=["']\s*javascript:[^"']*["']/gi, '$1="#"');
  return output;
};
const applyInlineStyle = (html, tagName, styleText) => {
  const pattern = new RegExp(`<${tagName}([^>]*)>`, "gi");
  return html.replace(pattern, (match, attrs) => {
    const attrText = attrs || "";
    if (/style\s*=/.test(attrText)) {
      return `<${tagName}${attrText.replace(/style\\s*=\\s*(["'])(.*?)\\1/i, (styleMatch, quote, styleValue) => {
        const nextStyle = styleValue.trim().endsWith(";") ? `${styleValue}${styleText}` : `${styleValue};${styleText}`;
        return `style=${quote}${nextStyle}${quote}`;
      })}>`;
    }
    return `<${tagName}${attrText} style="${styleText}">`;
  });
};
const enhanceImageLayout = (html) => {
  if (!html)
    return "";
  return applyInlineStyle(
    html,
    "img",
    "max-width:100%;width:auto;height:auto;display:block;margin:12rpx auto;"
  );
};
const enhanceTableLayout = (html) => {
  if (!html)
    return "";
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    let enhanced = applyInlineStyle(
      tableHtml,
      "table",
      "width:100%;border-collapse:collapse;table-layout:fixed;"
    );
    enhanced = applyInlineStyle(
      enhanced,
      "th",
      "border:1px solid #e5e7eb;padding:6px 8px;font-weight:600;text-align:center;font-size:14px;line-height:1.5;word-break:break-word;"
    );
    enhanced = applyInlineStyle(
      enhanced,
      "td",
      "border:1px solid #e5e7eb;padding:6px 8px;text-align:center;font-size:14px;line-height:1.5;word-break:break-word;"
    );
    return `<div style="max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;">${enhanced}</div>`;
  });
};
const tokenizeMathExpressions = (text) => {
  const tokens = [];
  let working = text.replace(/\\\$/g, ESCAPED_DOLLAR_TOKEN);
  working = working.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    const token = `@@MATH_BLOCK_${tokens.length}@@`;
    tokens.push({ token, formula, displayMode: true });
    return token;
  });
  working = working.replace(/\$([^\n$]+?)\$/g, (match, formula) => {
    const token = `@@MATH_INLINE_${tokens.length}@@`;
    tokens.push({ token, formula, displayMode: false });
    return token;
  });
  return { text: working, tokens };
};
const restoreMathExpressions = (html, tokens) => {
  let output = html;
  tokens.forEach(({ token, formula, displayMode }) => {
    let rendered = "";
    try {
      rendered = common_vendor.katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode,
        strict: "ignore"
      });
    } catch (error) {
      rendered = formula;
    }
    output = output.split(token).join(rendered);
  });
  return output.replace(new RegExp(ESCAPED_DOLLAR_TOKEN, "g"), "$");
};
function parseQuestionImages(text, bankId, baseUrl = "http://localhost:3001") {
  if (!text)
    return "";
  const withImages = replaceImagePlaceholders(text, bankId, baseUrl);
  const { text: withTokens, tokens } = tokenizeMathExpressions(withImages);
  const html = sanitizeRenderedHtml(markdown.render(withTokens));
  const enhancedHtml = enhanceTableLayout(enhanceImageLayout(html));
  return restoreMathExpressions(enhancedHtml, tokens);
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
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pkg-exam/utils/imageParser.js.map
