import { API_CONFIG, HTTP_STATUS, ERROR_TYPES, API_ENDPOINTS } from './constants.js'
import { TokenManager, LoginStateManager } from './auth.js'

/**
 * 网络请求管理器
 * 提供统一的API请求接口，包含认证、重试、错误处理等功能
 */
export class RequestManager {
  /**
   * 构造函数
   */
  constructor() {
    this.pendingRequests = new Map() // 待处理请求队列
    this.refreshingToken = false     // 是否正在刷新Token
    this.refreshPromise = null       // Token刷新Promise
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
      method = 'GET',
      data = {},
      header = {},
      needAuth = true,
      showLoading = true,
      retryCount = 0
    } = options
    
    // 显示加载提示
    if (showLoading) {
      uni.showLoading({
        title: '加载中...',
        mask: true
      })
    }
    
    try {
      // 构建完整URL
      const fullUrl = this.buildFullUrl(url)
      
      // 构建请求头
      const requestHeader = await this.buildHeaders(header, needAuth)
      
      // 发起请求
      const response = await this.performRequest({
        url: fullUrl,
        method: method.toUpperCase(),
        data,
        header: requestHeader
      })
      
      // 处理响应
      return await this.handleResponse(response)
      
    } catch (error) {
      // 错误处理
      return await this.handleError(error, options, retryCount)
    } finally {
      // 隐藏加载提示
      if (showLoading) {
        uni.hideLoading()
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
    const queryString = this.buildQueryString(params)
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request({
      url: fullUrl,
      method: 'GET',
      ...options
    })
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
      method: 'POST',
      data,
      ...options
    })
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
      method: 'PUT',
      data,
      ...options
    })
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
      method: 'DELETE',
      ...options
    })
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
    const { needAuth = true, showProgress = true } = options
    
    try {
      // 构建完整URL
      const fullUrl = this.buildFullUrl(url)
      
      // 构建请求头
      const header = await this.buildHeaders({}, needAuth)
      console.log(fullUrl,filePath,formData,'header', header)
      
      return new Promise((resolve, reject) => {
        const uploadTask = uni.uploadFile({
          url: fullUrl,
          filePath,
          name: 'file',
          formData,
          header,
          success: (res) => {
            try {
              const data = JSON.parse(res.data)
              if (data.code === HTTP_STATUS.OK) {
                resolve(data.data)
              } else {
                reject(new Error(data.message || '上传失败'))
              }
            } catch (error) {
              reject(new Error('响应数据解析失败'))
            }
          },
          fail: (error) => {
            reject(new Error(error.errMsg || '上传失败'))
          }
        })
        
        // 显示上传进度
        if (showProgress) {
          uploadTask.onProgressUpdate((res) => {
            console.log('上传进度:', res.progress + '%')
            // 可以在这里更新UI进度条
          })
        }
      })
    } catch (error) {
      throw this.createError('上传失败', ERROR_TYPES.NETWORK_ERROR)
    }
  }
  
  /**
   * 构建完整URL
   * @param {string} url - 相对URL
   * @returns {string} 完整URL
   */
  buildFullUrl(url) {
    if (url.startsWith('http')) {
      return url
    }
    return `${API_CONFIG.BASE_URL}${url}`
  }
  
  /**
   * 构建查询字符串
   * @param {Object} params - 查询参数
   * @returns {string} 查询字符串
   */
  buildQueryString(params) {
    const queryPairs = []
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        queryPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    }
    return queryPairs.join('&')
  }
  
  /**
   * 构建请求头
   * @param {Object} customHeader - 自定义请求头
   * @param {boolean} needAuth - 是否需要认证
   * @returns {Promise<Object>} 请求头对象
   */
  async buildHeaders(customHeader = {}, needAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeader
    }
    
    if (needAuth) {
      const accessToken = TokenManager.getAccessToken()
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }
      
      // 检查Token是否需要刷新
      if (TokenManager.shouldRefreshToken()) {
        await this.refreshTokenIfNeeded()
        const newToken = TokenManager.getAccessToken()
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`
        }
      }
    }
    
    return headers
  }
  
  /**
   * 执行HTTP请求
   * @param {Object} config - 请求配置
   * @returns {Promise<Object>} 请求响应
   */
  performRequest(config) {
    return new Promise((resolve, reject) => {
      uni.request({
        ...config,
        timeout: API_CONFIG.TIMEOUT,
        success: resolve,
        fail: reject
      })
    })
  }
  
  /**
   * 处理响应数据
   * @param {Object} response - 原始响应
   * @returns {Promise<any>} 处理后的数据
   */
  async handleResponse(response) {
    const { statusCode, data } = response
    
    console.log('📡 API响应:', { statusCode, data })
    
    // HTTP状态码检查
    if (statusCode !== HTTP_STATUS.OK) {
      throw this.createHttpError(statusCode, data)
    }
    
    // 业务状态码检查
    if (data.code !== HTTP_STATUS.OK) {
      if (data.code === HTTP_STATUS.UNAUTHORIZED) {
        await this.handleAuthError()
        throw this.createError(data.message || '认证失败', ERROR_TYPES.AUTH_ERROR)
      }
      throw this.createError(data.message || '请求失败', ERROR_TYPES.BUSINESS_ERROR)
    }
    
    return data.data
  }
  
  /**
   * 处理请求错误
   * @param {Error} error - 错误对象
   * @param {Object} originalOptions - 原始请求选项
   * @param {number} retryCount - 已重试次数
   * @returns {Promise<any>} 处理结果
   */
  async handleError(error, originalOptions, retryCount) {
    console.error('❌ 请求失败:', error)
    
    // 网络错误重试
    if (this.isNetworkError(error) && retryCount < API_CONFIG.MAX_RETRY_COUNT) {
      console.log(`🔄 网络错误，准备重试 (${retryCount + 1}/${API_CONFIG.MAX_RETRY_COUNT})`)
      await this.delay(1000 * (retryCount + 1)) // 递增延迟
      return this.request({ ...originalOptions, retryCount: retryCount + 1 })
    }
    
    // Token过期错误处理
    if (this.isAuthError(error)) {
      try {
        await this.refreshTokenAndRetry()
        return this.request(originalOptions)
      } catch (refreshError) {
        await this.handleAuthError()
        throw this.createError('认证失败，请重新登录', ERROR_TYPES.AUTH_ERROR)
      }
    }
    
    // 创建统一错误格式
    throw this.createRequestError(error)
  }
  
  /**
   * 刷新Token（如果需要）
   * @returns {Promise<void>}
   */
  async refreshTokenIfNeeded() {
    if (!TokenManager.shouldRefreshToken()) return
    
    if (this.refreshingToken) {
      // 如果正在刷新，等待刷新完成
      await this.refreshPromise
      return
    }
    
    try {
      this.refreshingToken = true
      this.refreshPromise = this.refreshToken()
      await this.refreshPromise
    } finally {
      this.refreshingToken = false
      this.refreshPromise = null
    }
  }
  
  /**
   * 刷新Token
   * @returns {Promise<void>}
   */
  async refreshToken() {
    const refreshToken = TokenManager.getRefreshToken()
    if (!refreshToken) {
      throw new Error('没有刷新令牌')
    }
    
    try {
      console.log('🔄 开始刷新Token')
      
      const response = await this.performRequest({
        url: this.buildFullUrl(API_ENDPOINTS.AUTH.REFRESH),
        method: 'POST',
        data: { refreshToken },
        header: { 'Content-Type': 'application/json' }
      })
      
      const data = await this.handleResponse(response)
      TokenManager.setTokens(data)
      
      console.log('✅ Token刷新成功')
    } catch (error) {
      console.error('❌ Token刷新失败:', error)
      throw error
    }
  }
  
  /**
   * 刷新Token并重试请求
   * @returns {Promise<void>}
   */
  async refreshTokenAndRetry() {
    await this.refreshToken()
  }
  
  /**
   * 处理认证错误
   * @returns {Promise<void>}
   */
  async handleAuthError() {
    console.log('🔐 认证失败，清除登录状态')
    LoginStateManager.logout()
    
    // 跳转到登录页面
    uni.reLaunch({
      url: '/pages/login/login'
    })
  }
  
  /**
   * 创建HTTP错误
   * @param {number} statusCode - HTTP状态码
   * @param {any} data - 响应数据
   * @returns {Error} 错误对象
   */
  createHttpError(statusCode, data) {
    let message = '请求失败'
    let type = ERROR_TYPES.NETWORK_ERROR
    
    switch (statusCode) {
      case HTTP_STATUS.BAD_REQUEST:
        message = '请求参数错误'
        break
      case HTTP_STATUS.UNAUTHORIZED:
        message = '认证失败'
        type = ERROR_TYPES.AUTH_ERROR
        break
      case HTTP_STATUS.FORBIDDEN:
        message = '权限不足'
        type = ERROR_TYPES.AUTH_ERROR
        break
      case HTTP_STATUS.NOT_FOUND:
        message = '请求的资源不存在'
        break
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        message = '服务器内部错误'
        break
      default:
        message = `请求失败 (${statusCode})`
    }
    
    return this.createError(data?.message || message, type)
  }
  
  /**
   * 创建请求错误
   * @param {Error} originalError - 原始错误
   * @returns {Error} 格式化错误
   */
  createRequestError(originalError) {
    if (originalError.type) {
      return originalError // 已经是格式化的错误
    }
    
    let message = '网络请求失败'
    let type = ERROR_TYPES.NETWORK_ERROR
    
    if (originalError.errMsg) {
      if (originalError.errMsg.includes('timeout')) {
        message = '请求超时，请检查网络连接'
        type = ERROR_TYPES.TIMEOUT_ERROR
      } else if (originalError.errMsg.includes('fail')) {
        message = '网络连接失败，请检查网络设置'
      }
    }
    
    return this.createError(message, type)
  }
  
  /**
   * 创建统一错误对象
   * @param {string} message - 错误消息
   * @param {string} type - 错误类型
   * @returns {Error} 错误对象
   */
  createError(message, type) {
    const error = new Error(message)
    error.type = type
    return error
  }
  
  /**
   * 检查是否是网络错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否是网络错误
   */
  isNetworkError(error) {
    return error.type === ERROR_TYPES.NETWORK_ERROR || 
           error.type === ERROR_TYPES.TIMEOUT_ERROR ||
           (error.errMsg && error.errMsg.includes('fail'))
  }
  
  /**
   * 检查是否是认证错误
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否是认证错误
   */
  isAuthError(error) {
    return error.type === ERROR_TYPES.AUTH_ERROR
  }
  
  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 创建全局请求实例
export const request = new RequestManager()

// 导出便捷方法
export const get = (url, params, options) => request.get(url, params, options)
export const post = (url, data, options) => request.post(url, data, options)
export const put = (url, data, options) => request.put(url, data, options)
export const del = (url, options) => request.delete(url, options)
export const upload = (url, filePath, formData, options) => request.upload(url, filePath, formData, options)

// 默认导出
export default request
