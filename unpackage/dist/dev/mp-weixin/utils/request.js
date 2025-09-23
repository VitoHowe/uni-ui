"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("../common/vendor.js");
const utils_constants = require("./constants.js");
const utils_auth = require("./auth.js");
class RequestManager {
  /**
   * 构造函数
   */
  constructor() {
    this.pendingRequests = /* @__PURE__ */ new Map();
    this.refreshingToken = false;
    this.refreshPromise = null;
  }
  /**
   * 发起HTTP请求
   * @param {Object} options - 请求配置
   * @param {string} options.url - 请求URL
   * @param {string} options.method - 请求方法 GET/POST/PUT/DELETE
   * @param {Object} options.data - 请求数据
   * @param {Object} options.header - 请求头
   * @param {boolean} options.needAuth - 是否需要认证 默认true
   * @param {boolean} options.showLoading - 是否显示加载提示 默认true
   * @param {number} options.retryCount - 重试次数 默认0
   * @returns {Promise<any>} 请求结果
   */
  async request(options) {
    const {
      url,
      method = "GET",
      data = {},
      header = {},
      needAuth = true,
      showLoading = true,
      retryCount = 0
    } = options;
    if (showLoading) {
      common_vendor.index.showLoading({
        title: "加载中...",
        mask: true
      });
    }
    try {
      const fullUrl = this.buildFullUrl(url);
      const requestHeader = await this.buildHeaders(header, needAuth);
      const response = await this.performRequest({
        url: fullUrl,
        method: method.toUpperCase(),
        data,
        header: requestHeader
      });
      return await this.handleResponse(response);
    } catch (error) {
      return await this.handleError(error, options, retryCount);
    } finally {
      if (showLoading) {
        common_vendor.index.hideLoading();
      }
    }
  }
  /**
   * GET请求
   * @param {string} url - 请求URL
   * @param {Object} params - 查询参数
   * @param {Object} options - 其他选项
   * @returns {Promise<any>} 响应数据
   */
  get(url, params = {}, options = {}) {
    const queryString = this.buildQueryString(params);
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request({
      url: fullUrl,
      method: "GET",
      ...options
    });
  }
  /**
   * POST请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 其他选项
   * @returns {Promise<any>} 响应数据
   */
  post(url, data = {}, options = {}) {
    return this.request({
      url,
      method: "POST",
      data,
      ...options
    });
  }
  /**
   * PUT请求
   * @param {string} url - 请求URL
   * @param {Object} data - 请求数据
   * @param {Object} options - 其他选项
   * @returns {Promise<any>} 响应数据
   */
  put(url, data = {}, options = {}) {
    return this.request({
      url,
      method: "PUT",
      data,
      ...options
    });
  }
  /**
   * DELETE请求
   * @param {string} url - 请求URL
   * @param {Object} options - 其他选项
   * @returns {Promise<any>} 响应数据
   */
  delete(url, options = {}) {
    return this.request({
      url,
      method: "DELETE",
      ...options
    });
  }
  /**
   * 文件上传
   * @param {string} url - 上传URL
   * @param {string} filePath - 文件路径
   * @param {Object} formData - 表单数据
   * @param {Object} options - 其他选项
   * @returns {Promise<any>} 上传结果
   */
  async upload(url, filePath, formData = {}, options = {}) {
    const { needAuth = true, showProgress = true } = options;
    try {
      const fullUrl = this.buildFullUrl(url);
      const header = await this.buildHeaders({}, needAuth);
      return new Promise((resolve, reject) => {
        const uploadTask = common_vendor.index.uploadFile({
          url: fullUrl,
          filePath,
          name: "file",
          formData,
          header,
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.code === utils_constants.HTTP_STATUS.OK) {
                resolve(data.data);
              } else {
                reject(new Error(data.message || "上传失败"));
              }
            } catch (error) {
              reject(new Error("响应数据解析失败"));
            }
          },
          fail: (error) => {
            reject(new Error(error.errMsg || "上传失败"));
          }
        });
        if (showProgress) {
          uploadTask.onProgressUpdate((res) => {
            common_vendor.index.__f__("log", "at utils/request.js:187", "上传进度:", res.progress + "%");
          });
        }
      });
    } catch (error) {
      throw this.createError("上传失败", utils_constants.ERROR_TYPES.NETWORK_ERROR);
    }
  }
  /**
   * 构建完整URL
   * @param {string} url - 相对URL
   * @returns {string} 完整URL
   */
  buildFullUrl(url) {
    if (url.startsWith("http")) {
      return url;
    }
    return `${utils_constants.API_CONFIG.BASE_URL}${url}`;
  }
  /**
   * 构建查询字符串
   * @param {Object} params - 查询参数
   * @returns {string} 查询字符串
   */
  buildQueryString(params) {
    const queryPairs = [];
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== void 0 && value !== "") {
        queryPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    }
    return queryPairs.join("&");
  }
  /**
   * 构建请求头
   * @param {Object} customHeader - 自定义请求头
   * @param {boolean} needAuth - 是否需要认证
   * @returns {Promise<Object>} 请求头对象
   */
  async buildHeaders(customHeader = {}, needAuth = true) {
    const headers = {
      "Content-Type": "application/json",
      ...customHeader
    };
    if (needAuth) {
      const accessToken = utils_auth.TokenManager.getAccessToken();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      if (utils_auth.TokenManager.shouldRefreshToken()) {
        await this.refreshTokenIfNeeded();
        const newToken = utils_auth.TokenManager.getAccessToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
        }
      }
    }
    return headers;
  }
  /**
   * 执行HTTP请求
   * @param {Object} config - 请求配置
   * @returns {Promise<Object>} 请求响应
   */
  performRequest(config) {
    return new Promise((resolve, reject) => {
      common_vendor.index.request({
        ...config,
        timeout: utils_constants.API_CONFIG.TIMEOUT,
        success: resolve,
        fail: reject
      });
    });
  }
  /**
   * 处理响应数据
   * @param {Object} response - 原始响应
   * @returns {Promise<any>} 处理后的数据
   */
  async handleResponse(response) {
    const { statusCode, data } = response;
    common_vendor.index.__f__("log", "at utils/request.js:279", "📡 API响应:", { statusCode, data });
    if (statusCode !== utils_constants.HTTP_STATUS.OK) {
      throw this.createHttpError(statusCode, data);
    }
    if (data.code !== utils_constants.HTTP_STATUS.OK) {
      if (data.code === utils_constants.HTTP_STATUS.UNAUTHORIZED) {
        await this.handleAuthError();
        throw this.createError(data.message || "认证失败", utils_constants.ERROR_TYPES.AUTH_ERROR);
      }
      throw this.createError(data.message || "请求失败", utils_constants.ERROR_TYPES.BUSINESS_ERROR);
    }
    return data.data;
  }
  /**
   * 处理请求错误
   * @param {Error} error - 错误对象
   * @param {Object} originalOptions - 原始请求选项
   * @param {number} retryCount - 已重试次数
   * @returns {Promise<any>} 处理结果
   */
  async handleError(error, originalOptions, retryCount) {
    common_vendor.index.__f__("error", "at utils/request.js:306", "❌ 请求失败:", error);
    if (this.isNetworkError(error) && retryCount < utils_constants.API_CONFIG.MAX_RETRY_COUNT) {
      common_vendor.index.__f__("log", "at utils/request.js:310", `🔄 网络错误，准备重试 (${retryCount + 1}/${utils_constants.API_CONFIG.MAX_RETRY_COUNT})`);
      await this.delay(1e3 * (retryCount + 1));
      return this.request({ ...originalOptions, retryCount: retryCount + 1 });
    }
    if (this.isAuthError(error)) {
      try {
        await this.refreshTokenAndRetry();
        return this.request(originalOptions);
      } catch (refreshError) {
        await this.handleAuthError();
        throw this.createError("认证失败，请重新登录", utils_constants.ERROR_TYPES.AUTH_ERROR);
      }
    }
    throw this.createRequestError(error);
  }
  /**
   * 刷新Token（如果需要）
   * @returns {Promise<void>}
   */
  async refreshTokenIfNeeded() {
    if (!utils_auth.TokenManager.shouldRefreshToken())
      return;
    if (this.refreshingToken) {
      await this.refreshPromise;
      return;
    }
    try {
      this.refreshingToken = true;
      this.refreshPromise = this.refreshToken();
      await this.refreshPromise;
    } finally {
      this.refreshingToken = false;
      this.refreshPromise = null;
    }
  }
  /**
   * 刷新Token
   * @returns {Promise<void>}
   */
  async refreshToken() {
    const refreshToken = utils_auth.TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error("没有刷新令牌");
    }
    try {
      common_vendor.index.__f__("log", "at utils/request.js:364", "🔄 开始刷新Token");
      const response = await this.performRequest({
        url: this.buildFullUrl(utils_constants.API_ENDPOINTS.AUTH.REFRESH),
        method: "POST",
        data: { refreshToken },
        header: { "Content-Type": "application/json" }
      });
      const data = await this.handleResponse(response);
      utils_auth.TokenManager.setTokens(data);
      common_vendor.index.__f__("log", "at utils/request.js:376", "✅ Token刷新成功");
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/request.js:378", "❌ Token刷新失败:", error);
      throw error;
    }
  }
  /**
   * 刷新Token并重试请求
   * @returns {Promise<void>}
   */
  async refreshTokenAndRetry() {
    await this.refreshToken();
  }
  /**
   * 处理认证错误
   * @returns {Promise<void>}
   */
  async handleAuthError() {
    common_vendor.index.__f__("log", "at utils/request.js:396", "🔐 认证失败，清除登录状态");
    utils_auth.LoginStateManager.logout();
    common_vendor.index.reLaunch({
      url: "/pages/login/login"
    });
  }
  /**
   * 创建HTTP错误
   * @param {number} statusCode - HTTP状态码
   * @param {any} data - 响应数据
   * @returns {Error} 错误对象
   */
  createHttpError(statusCode, data) {
    let message = "请求失败";
    let type = utils_constants.ERROR_TYPES.NETWORK_ERROR;
    switch (statusCode) {
      case utils_constants.HTTP_STATUS.BAD_REQUEST:
        message = "请求参数错误";
        break;
      case utils_constants.HTTP_STATUS.UNAUTHORIZED:
        message = "认证失败";
        type = utils_constants.ERROR_TYPES.AUTH_ERROR;
        break;
      case utils_constants.HTTP_STATUS.FORBIDDEN:
        message = "权限不足";
        type = utils_constants.ERROR_TYPES.AUTH_ERROR;
        break;
      case utils_constants.HTTP_STATUS.NOT_FOUND:
        message = "请求的资源不存在";
        break;
      case utils_constants.HTTP_STATUS.INTERNAL_SERVER_ERROR:
        message = "服务器内部错误";
        break;
      default:
        message = `请求失败 (${statusCode})`;
    }
    return this.createError((data == null ? void 0 : data.message) || message, type);
  }
  /**
   * 创建请求错误
   * @param {Error} originalError - 原始错误
   * @returns {Error} 格式化错误
   */
  createRequestError(originalError) {
    if (originalError.type) {
      return originalError;
    }
    let message = "网络请求失败";
    let type = utils_constants.ERROR_TYPES.NETWORK_ERROR;
    if (originalError.errMsg) {
      if (originalError.errMsg.includes("timeout")) {
        message = "请求超时，请检查网络连接";
        type = utils_constants.ERROR_TYPES.TIMEOUT_ERROR;
      } else if (originalError.errMsg.includes("fail")) {
        message = "网络连接失败，请检查网络设置";
      }
    }
    return this.createError(message, type);
  }
  /**
   * 创建统一错误对象
   * @param {string} message - 错误消息
   * @param {string} type - 错误类型
   * @returns {Error} 错误对象
   */
  createError(message, type) {
    const error = new Error(message);
    error.type = type;
    return error;
  }
  /**
   * 检查是否是网络错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否是网络错误
   */
  isNetworkError(error) {
    return error.type === utils_constants.ERROR_TYPES.NETWORK_ERROR || error.type === utils_constants.ERROR_TYPES.TIMEOUT_ERROR || error.errMsg && error.errMsg.includes("fail");
  }
  /**
   * 检查是否是认证错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否是认证错误
   */
  isAuthError(error) {
    return error.type === utils_constants.ERROR_TYPES.AUTH_ERROR;
  }
  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
const request = new RequestManager();
const upload = (url, filePath, formData, options) => request.upload(url, filePath, formData, options);
exports.RequestManager = RequestManager;
exports.default = request;
exports.request = request;
exports.upload = upload;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/request.js.map
