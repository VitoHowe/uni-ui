"use strict";
const API_CONFIG = {
  // 基础API地址
  BASE_URL: "http://localhost:3001/api",
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
  // 用户管理
  USERS: {
    LIST: "/users",
    // 用户列表
    DETAIL: "/users",
    // 用户详情 /{id}
    UPDATE: "/users",
    // 更新用户 /{id}
    DELETE: "/users"
    // 删除用户 /{id}
  },
  // 题库管理
  QUESTIONS: {
    LIST: "/questions",
    // 题目列表
    DETAIL: "/questions",
    // 题目详情 /{id}
    BANKS: "/questions/banks",
    // 题库列表
    BANK_DETAIL: "/questions/banks",
    // 题库详情 /{id}
    UPDATE: "/questions",
    // 更新题目 /{id}
    DELETE: "/questions"
    // 删除题目 /{id}
  },
  // 文件管理
  FILES: {
    UPLOAD: "/files/upload",
    // 文件上传
    LIST: "/files",
    // 文件列表
    DETAIL: "/files",
    // 文件详情 /{id}
    PARSE: "/files",
    // 解析文件 /{id}/parse
    PARSE_STATUS: "/files",
    // 解析状态 /{id}/parse-status
    DELETE: "/files"
    // 删除文件 /{id}
  }
};
const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_INFO: "user_info",
  LOGIN_STATE: "login_state",
  TOKEN_EXPIRES_AT: "token_expires_at"
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
