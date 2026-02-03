// 环境配置
const ENV_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:3001/api'
  },
  production: {
    BASE_URL: 'https://wxnode.mayday.qzz.io/api'
  }
}

// 获取当前环境
const currentEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development'

// API配置常量
export const API_CONFIG = {
  // 基础API地址 - 根据环境自动切换
  BASE_URL: ENV_CONFIG[currentEnv].BASE_URL,
  
  // 超时时间 (毫秒)
  TIMEOUT: 10000,
  
  // Token过期前刷新时间 (毫秒) - 提前5分钟刷新
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,
  
  // 最大重试次数
  MAX_RETRY_COUNT: 3
}

// API端点路径
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',           // 微信登录
    REFRESH: '/auth/refresh',       // 刷新Token
    PROFILE: '/auth/profile',       // 获取用户信息
    LOGOUT: '/auth/logout'          // 退出登录
  },
  
  // 单词书管理
  WORD_BOOKS: {
    LIST: '/word-books',
    WORDS: (bookId) => `/word-books/${bookId}/words`,
  },
  
  // 题库管理
  QUESTIONS: {
    BANKS: '/questions/banks',      // 题库列表
    BANK_DETAIL: '/questions/banks',// 题库详情 /{id}
  },
  
  SUBJECTS: {
    LIST: '/subjects',
    BANKS: (subjectId) => `/subjects/${subjectId}/banks`,
  },
  
  // 文件管理
  FILES: {
    UPLOAD: '/files/upload',        // 文件上传
  },
}

// 本地存储Key
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
  LOGIN_STATE: 'login_state',
  TOKEN_EXPIRES_AT: 'token_expires_at',
  SELECTED_SUBJECT: 'selected_subject'
}

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
}

// 错误类型
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

// 用户角色
export const USER_ROLES = {
  ADMIN: 1,    // 管理员
  USER: 2      // 普通用户
}

// 用户状态
export const USER_STATUS = {
  DISABLED: 0, // 禁用
  ENABLED: 1   // 启用
}

// 题目类型
export const QUESTION_TYPES = {
  SINGLE: 'single',      // 单选题
  MULTIPLE: 'multiple',  // 多选题
  JUDGE: 'judge',        // 判断题
  FILL: 'fill',          // 填空题
  ESSAY: 'essay'         // 简答题
}

// 难度等级
export const DIFFICULTY_LEVELS = {
  EASY: 1,     // 简单
  MEDIUM: 2,   // 中等
  HARD: 3      // 困难
}

// 文件解析状态
export const FILE_PARSE_STATUS = {
  PENDING: 'pending',     // 待解析
  PARSING: 'parsing',     // 解析中
  COMPLETED: 'completed', // 解析完成
  FAILED: 'failed'        // 解析失败
}

// 默认配置
export const DEFAULT_CONFIG = {
  // 分页默认参数
  PAGINATION: {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100
  },
  
  // 文件上传限制
  FILE_UPLOAD: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['application/pdf']
  }
}
