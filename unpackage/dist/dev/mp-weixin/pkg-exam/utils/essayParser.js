"use strict";
const common_vendor = require("../../common/vendor.js");
const markdown = new common_vendor.MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
});
const ESCAPED_DOLLAR_TOKEN = "__WX_ESSAY_ESCAPED_DOLLAR__";
const sanitizeRenderedHtml = (html) => {
  if (!html)
    return "";
  let output = html;
  output = output.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  output = output.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  output = output.replace(/<(iframe|object|embed)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
  output = output.replace(/\son\w+=(['"]).*?\1/gi, "");
  output = output.replace(/\son\w+=\S+/gi, "");
  output = output.replace(/(href|src)=["']\s*javascript:[^"']*["']/gi, '$1="#"');
  return output;
};
const stripImageSizeAttributes = (html) => {
  if (!html)
    return "";
  return html.replace(/<img\b([^>]*)>/gi, (match, attrs = "") => {
    const cleanedAttrs = attrs.replace(/\s(?:width|height)\s*=\s*(["']).*?\1/gi, "").replace(/\s(?:width|height)\s*=\s*[^>\s]+/gi, "");
    return `<img${cleanedAttrs}>`;
  });
};
const applyInlineStyle = (html, tagName, styleText) => {
  const pattern = new RegExp(`<${tagName}([^>]*)>`, "gi");
  return html.replace(pattern, (match, attrs) => {
    const attrText = attrs || "";
    if (/style\s*=/.test(attrText)) {
      return `<${tagName}${attrText.replace(/style\s*=\s*(["'])(.*?)\1/i, (styleMatch, quote, styleValue) => {
        const nextStyle = styleValue.trim().endsWith(";") ? `${styleValue}${styleText}` : `${styleValue};${styleText}`;
        return `style=${quote}${nextStyle}${quote}`;
      })}>`;
    }
    return `<${tagName}${attrText} style="${styleText}">`;
  });
};
const enhanceTypography = (html) => {
  if (!html)
    return "";
  let output = html;
  output = applyInlineStyle(output, "h1", "font-size:26px;line-height:1.4;margin:18px 0 12px;color:#0f172a;font-weight:700;");
  output = applyInlineStyle(output, "h2", "font-size:22px;line-height:1.4;margin:16px 0 10px;color:#0f172a;font-weight:700;");
  output = applyInlineStyle(output, "h3", "font-size:19px;line-height:1.45;margin:14px 0 8px;color:#0f172a;font-weight:700;");
  output = applyInlineStyle(output, "p", "font-size:16px;line-height:1.8;color:#1f2937;margin:10px 0;word-break:break-word;");
  output = applyInlineStyle(output, "li", "font-size:15px;line-height:1.75;color:#1f2937;word-break:break-word;");
  output = applyInlineStyle(output, "blockquote", "margin:14px 0;padding:12px 14px;border-left:4px solid #14b8a6;background:#f0fdfa;color:#0f766e;border-radius:8px;");
  return output;
};
const decodeHtmlEntities = (value = "") => {
  return String(value || "").replace(/&nbsp;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&").replace(/&#39;/gi, "'").replace(/&quot;/gi, '"');
};
const estimateLineWidthUnits = (line = "") => {
  let units = 0;
  for (const char of String(line || "")) {
    if (char === "	") {
      units += 2;
      continue;
    }
    const codePoint = char.codePointAt(0) || 0;
    units += codePoint <= 127 ? 1 : 2;
  }
  return units;
};
const getPreBlockScaleFontSize = (codeBlockHtml = "") => {
  const plainText = decodeHtmlEntities(codeBlockHtml.replace(/<[^>]*>/g, ""));
  const lines = plainText.split("\n");
  const maxLineUnits = lines.reduce((max, line) => Math.max(max, estimateLineWidthUnits(line)), 0);
  if (!maxLineUnits)
    return 13;
  const BASE_FONT_SIZE = 13;
  const MIN_FONT_SIZE = 5;
  const SAFE_INNER_WIDTH_PX = 248;
  const MONO_CHAR_WIDTH_RATIO = 0.62;
  const estimatedSize = SAFE_INNER_WIDTH_PX / (maxLineUnits * MONO_CHAR_WIDTH_RATIO);
  return Number(Math.max(MIN_FONT_SIZE, Math.min(BASE_FONT_SIZE, estimatedSize)).toFixed(2));
};
const enhanceCodeLayout = (html, options = {}) => {
  if (!html)
    return "";
  const preFontScale = Number(options.preFontScale || 1);
  const allowHorizontalScroll = Boolean(options.allowHorizontalScroll);
  let output = applyInlineStyle(
    html,
    "code",
    "font-size:13px;padding:2px 6px;background:#f1f5f9;border-radius:6px;color:#0f172a;font-family:Menlo,Consolas,monospace;"
  );
  output = output.replace(/<pre[\s\S]*?<\/pre>/gi, (codeBlock) => {
    const baseFontSize = allowHorizontalScroll ? 13 : getPreBlockScaleFontSize(codeBlock);
    const preFontSize = Number(Math.max(5, Math.min(18, baseFontSize * preFontScale)).toFixed(2));
    let scaledPre = applyInlineStyle(
      codeBlock,
      "pre",
      `margin:0;background:transparent;color:#e2e8f0;white-space:pre;word-break:normal;overflow-wrap:normal;font-size:${preFontSize}px;line-height:1.45;display:block;`
    );
    scaledPre = scaledPre.replace(
      /<code([^>]*)>/gi,
      '<code$1 style="font-size:inherit;padding:0;background:transparent;color:inherit;font-family:Menlo,Consolas,monospace;white-space:inherit;">'
    );
    const overflowStyle = allowHorizontalScroll ? "overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;" : "overflow:hidden;";
    return `<div style="margin:14px 0;border-radius:10px;${overflowStyle}background:#0f172a;padding:12px 14px;max-width:100%;">${scaledPre}</div>`;
  });
  return output;
};
const enhanceImageLayout = (html) => {
  if (!html)
    return "";
  return applyInlineStyle(
    html,
    "img",
    "max-width:100%;width:auto;height:auto;display:block;margin:14px auto;border-radius:8px;"
  );
};
const enhanceTableLayout = (html, options = {}) => {
  if (!html)
    return "";
  const tableFontScale = Number(options.tableFontScale || 1);
  const allowHorizontalScroll = Boolean(options.allowHorizontalScroll);
  const tableFontSize = Number(Math.max(8, Math.min(18, 12.5 * tableFontScale)).toFixed(2));
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    let enhanced = applyInlineStyle(
      tableHtml,
      "table",
      `width:100%;max-width:100%;border-collapse:collapse;table-layout:auto;background:#ffffff;font-size:${tableFontSize}px;`
    );
    enhanced = applyInlineStyle(
      enhanced,
      "th",
      "border:1px solid #e2e8f0;padding:8px 10px;font-weight:600;text-align:left;color:#0f172a;background:#f8fafc;white-space:nowrap;"
    );
    enhanced = applyInlineStyle(
      enhanced,
      "td",
      "border:1px solid #e2e8f0;padding:8px 10px;line-height:1.6;color:#1f2937;white-space:nowrap;"
    );
    const overflowStyle = allowHorizontalScroll ? "overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;" : "overflow:hidden;";
    return `<div style="max-width:100%;${overflowStyle}margin:12px 0;border-radius:10px;border:1px solid #e2e8f0;">${enhanced}</div>`;
  });
};
const tokenizeMathExpressions = (text) => {
  const tokens = [];
  let working = text.replace(/\\\$/g, ESCAPED_DOLLAR_TOKEN);
  working = working.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    const token = `@@ESSAY_MATH_BLOCK_${tokens.length}@@`;
    tokens.push({ token, formula, displayMode: true });
    return token;
  });
  working = working.replace(/\$([^\n$]+?)\$/g, (match, formula) => {
    const token = `@@ESSAY_MATH_INLINE_${tokens.length}@@`;
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
const normalizeAssetUrl = (url, baseOrigin = "") => {
  const text = String(url || "").trim();
  if (!text)
    return "";
  if (/^https?:\/\//i.test(text))
    return text;
  if (/^\/\//.test(text))
    return `https:${text}`;
  if (/^data:/i.test(text))
    return text;
  if (!baseOrigin)
    return text;
  return `${baseOrigin}${text.startsWith("/") ? "" : "/"}${text}`;
};
const parseMarkdownImageLink = (rawValue = "") => {
  const value = String(rawValue || "").trim();
  if (!value)
    return "";
  const withoutTitle = value.split(/\s+/)[0] || "";
  return withoutTitle.replace(/^<|>$/g, "");
};
const extractEssayImageUrls = (markdownText, baseOrigin = "") => {
  if (!markdownText || typeof markdownText !== "string")
    return [];
  const urls = [];
  const markdownImageRegex = /!\[[^\]]*]\(([^)]+)\)/g;
  const htmlImageRegex = /<img[^>]+src=(["'])(.*?)\1/gi;
  let match = null;
  while ((match = markdownImageRegex.exec(markdownText)) !== null) {
    const rawUrl = parseMarkdownImageLink(match[1]);
    const normalized = normalizeAssetUrl(rawUrl, baseOrigin);
    if (normalized)
      urls.push(normalized);
  }
  while ((match = htmlImageRegex.exec(markdownText)) !== null) {
    const normalized = normalizeAssetUrl(match[2], baseOrigin);
    if (normalized)
      urls.push(normalized);
  }
  return Array.from(new Set(urls));
};
const parseEssayMarkdown = (markdownText, options = {}) => {
  if (!markdownText || typeof markdownText !== "string")
    return "";
  const { text: withMathToken, tokens } = tokenizeMathExpressions(markdownText);
  const renderedHtml = markdown.render(withMathToken);
  const sanitizedHtml = stripImageSizeAttributes(sanitizeRenderedHtml(renderedHtml));
  const styledHtml = enhanceCodeLayout(
    enhanceTableLayout(
      enhanceImageLayout(
        enhanceTypography(sanitizedHtml)
      ),
      options
    ),
    options
  );
  return restoreMathExpressions(styledHtml, tokens);
};
exports.extractEssayImageUrls = extractEssayImageUrls;
exports.parseEssayMarkdown = parseEssayMarkdown;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pkg-exam/utils/essayParser.js.map
