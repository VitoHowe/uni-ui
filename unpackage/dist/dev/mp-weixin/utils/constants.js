"use strict";
const common_vendor = require("../common/vendor.js");
const ENV_CONFIG = {
  development: {
    BASE_URL: "http://127.0.0.1:3001/api"
  },
  production: {
    BASE_URL: "https://wxnode.mayday.qzz.io/api"
  }
};
const getProcessEnv = (key) => {
  if (typeof process === "undefined" || !process.env) {
    return "";
  }
  return process.env[key] || "";
};
const normalizeBaseUrl = (url = "") => {
  if (!url)
    return "";
  return url.replace(/\/+$/, "");
};
const resolveEnvironment = () => {
  return getProcessEnv("NODE_ENV") === "production" ? "production" : "development";
};
const resolveEnvBaseUrl = () => {
  const envValue = getProcessEnv("UNI_API_BASE_URL") || getProcessEnv("VITE_API_BASE_URL") || getProcessEnv("API_BASE_URL");
  return normalizeBaseUrl(envValue);
};
const currentEnv = resolveEnvironment();
const envBaseUrl = resolveEnvBaseUrl();
const fallbackEnv = currentEnv;
const fallbackBaseUrl = normalizeBaseUrl(ENV_CONFIG[fallbackEnv].BASE_URL);
const resolvedBaseUrl = envBaseUrl || fallbackBaseUrl;
const resolvedSource = envBaseUrl ? "env" : `default:${fallbackEnv}`;
if (!envBaseUrl) {
  common_vendor.index.__f__("log", "at utils/constants.js:44", `[API_CONFIG] 未配置 UNI_API_BASE_URL，使用 ${fallbackEnv} 默认地址: ${resolvedBaseUrl}`);
}
if (currentEnv === "production" && !envBaseUrl) {
  common_vendor.index.__f__("warn", "at utils/constants.js:48", "[API_CONFIG] 当前 NODE_ENV=production，但未配置 UNI_API_BASE_URL，已回退到 production 默认地址");
}
const API_CONFIG = {
  // 基础API地址 - 根据环境自动切换
  BASE_URL: resolvedBaseUrl,
  // 当前环境与配置来源，便于调试页面排查
  ENV: currentEnv,
  BASE_URL_SOURCE: resolvedSource,
  // 超时时间 (毫秒)
  TIMEOUT: 1e4,
  // Token过期前刷新时间 (毫秒) - 提前5分钟刷新
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1e3,
  // 最大重试次数
  MAX_RETRY_COUNT: 3
};
const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: "/auth/login",
    // 微信登录
    REFRESH: "/auth/refresh",
    // 刷新Token
    PROFILE: "/auth/profile",
    // 获取用户信息
    LOGOUT: "/auth/logout"
    // 退出登录
  },
  // 单词书管理
  WORD_BOOKS: {
    LIST: "/word-books",
    WORDS: (bookId) => `/word-books/${bookId}/words`
  },
  // 题库管理
  QUESTIONS: {
    BANKS: "/questions/banks",
    // 题库列表
    BANK_DETAIL: "/questions/banks"
    // 题库详情 /{id}
  },
  SUBJECTS: {
    LIST: "/subjects",
    BANKS: (subjectId) => `/subjects/${subjectId}/banks`,
    CHAPTERS: (subjectId) => `/subjects/${subjectId}/chapters`
  },
  ESSAYS: {
    SUBJECT_ORGS: (subjectId) => `/subjects/${subjectId}/essay-orgs`,
    SUBJECT_LIST: (subjectId) => `/subjects/${subjectId}/essays`,
    SUBJECT_CHAPTER_LIST: (subjectId, chapterId) => `/subjects/${subjectId}/chapters/${chapterId}/essays`,
    DETAIL: (essayId) => `/essays/${essayId}`
  },
  // 文件管理
  FILES: {
    UPLOAD: "/files/upload"
    // 文件上传
  }
};
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_INFO: "user_info",
  LOGIN_STATE: "login_state",
  TOKEN_EXPIRES_AT: "token_expires_at",
  SELECTED_SUBJECT: "selected_subject"
};
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  BUSINESS_ERROR: "BUSINESS_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};
exports.API_CONFIG = API_CONFIG;
exports.API_ENDPOINTS = API_ENDPOINTS;
exports.ERROR_TYPES = ERROR_TYPES;
exports.HTTP_STATUS = HTTP_STATUS;
exports.STORAGE_KEYS = STORAGE_KEYS;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/constants.js.map
