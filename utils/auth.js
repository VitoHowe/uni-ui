import { STORAGE_KEYS, API_CONFIG } from './constants.js'

/**
 * Token管理工具类
 */
export class TokenManager {
  /**
   * 设置Token信息
   * @param {Object} tokenData - Token数据 
   * @param {string} tokenData.accessToken - 访问令牌
   * @param {string} tokenData.refreshToken - 刷新令牌
   * @param {string} tokenData.expiresIn - 过期时间（如"2h"）
   */
  static setTokens(tokenData) {
    const { accessToken, refreshToken, expiresIn } = tokenData
    
    // 计算过期时间戳
    const expiresAt = Date.now() + this.parseExpiresIn(expiresIn)
    
    // 存储到内存（Pinia store会处理）
    uni.setStorageSync(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    uni.setStorageSync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    uni.setStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt)
    
    console.log('🔑 Token已更新', { expiresAt: new Date(expiresAt) })
  }
  
  /**
   * 获取访问令牌
   * @returns {string|null} 访问令牌
   */
  static getAccessToken() {
    return uni.getStorageSync(STORAGE_KEYS.ACCESS_TOKEN) || null
  }
  
  /**
   * 获取刷新令牌
   * @returns {string|null} 刷新令牌
   */
  static getRefreshToken() {
    return uni.getStorageSync(STORAGE_KEYS.REFRESH_TOKEN) || null
  }
  
  /**
   * 检查Token是否即将过期
   * @returns {boolean} 是否需要刷新
   */
  static shouldRefreshToken() {
    const expiresAt = uni.getStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    if (!expiresAt) return false
    
    const now = Date.now()
    const timeLeft = expiresAt - now
    
    // 提前5分钟刷新
    return timeLeft <= API_CONFIG.TOKEN_REFRESH_THRESHOLD
  }
  
  /**
   * 检查Token是否已过期
   * @returns {boolean} 是否已过期
   */
  static isTokenExpired() {
    const expiresAt = uni.getStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    if (!expiresAt) return true
    
    return Date.now() >= expiresAt
  }
  
  /**
   * 清除所有Token
   */
  static clearTokens() {
    uni.removeStorageSync(STORAGE_KEYS.ACCESS_TOKEN)
    uni.removeStorageSync(STORAGE_KEYS.REFRESH_TOKEN)
    uni.removeStorageSync(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    console.log('🗑️ Token已清除')
  }
  
  /**
   * 解析过期时间字符串为毫秒数
   * @param {string} expiresIn - 过期时间字符串（如"2h", "7d"）
   * @returns {number} 毫秒数
   */
  static parseExpiresIn(expiresIn) {
    const unit = expiresIn.slice(-1)
    const value = parseInt(expiresIn.slice(0, -1))
    
    switch (unit) {
      case 's': return value * 1000
      case 'm': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      case 'd': return value * 24 * 60 * 60 * 1000
      default: return 2 * 60 * 60 * 1000 // 默认2小时
    }
  }
}

/**
 * 用户信息管理工具
 */
export class UserManager {
  /**
   * 保存用户信息
   * @param {Object} userInfo - 用户信息
   */
  static setUserInfo(userInfo) {
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
    console.log('👤 用户信息已更新', userInfo)
  }
  
  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息
   */
  static getUserInfo() {
    return uni.getStorageSync(STORAGE_KEYS.USER_INFO) || null
  }
  
  /**
   * 清除用户信息
   */
  static clearUserInfo() {
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
    console.log('🗑️ 用户信息已清除')
  }
  
  /**
   * 检查是否是管理员
   * @returns {boolean} 是否是管理员
   */
  static isAdmin() {
    const userInfo = this.getUserInfo()
    return userInfo && userInfo.role_id === 1
  }
  
  /**
   * 检查用户状态是否正常
   * @returns {boolean} 用户状态是否正常
   */
  static isUserActive() {
    const userInfo = this.getUserInfo()
    return userInfo && userInfo.status === 1
  }
}

/**
 * 微信登录工具
 */
export class WechatAuth {
  // 内部变量：记录最后一次获取的code，避免重复使用
  static _lastCode = null
  static _codeTimestamp = 0
  
  /**
   * 获取微信登录Code
   * @param {boolean} forceRefresh - 强制刷新code，即使刚刚获取过
   * @returns {Promise<string>} 微信登录Code
   */
  static getWechatCode(forceRefresh = false) {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      
      // 如果不强制刷新且距离上次获取code不到2秒，直接拒绝（防止重复获取）
      if (!forceRefresh && this._lastCode && (now - this._codeTimestamp) < 2000) {
        console.warn('⚠️ 获取code过于频繁，请稍后重试')
        reject(new Error('获取授权过于频繁，请稍后重试'))
        return
      }
      
      console.log('🔐 开始获取全新的微信Code...')
      
      uni.login({
        provider: 'weixin',
        onlyAuthorize: true,
        success: (res) => {
          console.log('🔐 获取成功', res)
          if (!res.code) {
            console.error('❌ 微信返回的code为空')
            reject(new Error('微信授权失败，请重试'))
            return
          }
          
          // 检查是否与上次code相同（不应该发生，但增加保护）
          if (!forceRefresh && res.code === this._lastCode) {
            console.warn('⚠️ 获取到重复的微信code，强制重新获取')
            // 递归调用，强制刷新
            setTimeout(() => {
              this.getWechatCode(true).then(resolve).catch(reject)
            }, 500)
            return
          }
          
          // 记录新的code和时间戳
          this._lastCode = res.code
          this._codeTimestamp = now
          
          console.log('✅ 获取微信Code成功', {
            code: res.code.substring(0, 8) + '...',
            timestamp: new Date(now).toLocaleTimeString()
          })
          
          resolve(res.code)
        },
        fail: (err) => {
          console.error('❌ 获取微信Code失败', err)
          reject(new Error(err.errMsg || '获取微信授权失败，请重试'))
        }
      })
    })
  }
  
  /**
   * 清除缓存的code信息（在登录失败时调用）
   */
  static clearCodeCache() {
    console.log('🗑️ 清除微信code缓存')
    this._lastCode = null
    this._codeTimestamp = 0
  }
  
  /**
   * 获取用户信息（需要用户授权）
   * @returns {Promise<Object>} 用户信息
   */
  static getUserProfile() {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      uni.getUserProfile({
        desc: '用于完善个人资料',
        success: (res) => {
          console.log('👤 获取用户信息成功', res.userInfo)
          resolve({
            encryptedData: res.encryptedData,
            iv: res.iv,
            signature: res.signature,
            userInfo: res.userInfo
          })
        },
        fail: (err) => {
          console.error('❌ 用户取消授权', err)
          reject(new Error('需要授权才能使用完整功能'))
        }
      })
      // #endif
      
      // #ifndef MP-WEIXIN
      // 非微信小程序环境，返回模拟数据
      resolve({
        userInfo: {
          nickName: '测试用户',
          avatarUrl: '/static/avatar.png'
        }
      })
      // #endif
    })
  }
  
  /**
   * 检查是否支持微信登录
   * @returns {boolean} 是否支持
   */
  static isWechatLoginSupported() {
    // #ifdef MP-WEIXIN
    return true
    // #endif
    
    // #ifndef MP-WEIXIN
    return false
    // #endif
  }
}

/**
 * 登录状态管理
 */
export class LoginStateManager {
  /**
   * 设置登录状态
   * @param {boolean} isLoggedIn - 是否已登录
   */
  static setLoginState(isLoggedIn) {
    uni.setStorageSync(STORAGE_KEYS.LOGIN_STATE, isLoggedIn)
  }
  
  /**
   * 获取登录状态
   * @returns {boolean} 是否已登录
   */
  static getLoginState() {
    return uni.getStorageSync(STORAGE_KEYS.LOGIN_STATE) || false
  }
  
  /**
   * 清除登录状态
   */
  static clearLoginState() {
    uni.removeStorageSync(STORAGE_KEYS.LOGIN_STATE)
  }
  
  /**
   * 完整的登出处理
   */
  static logout() {
    TokenManager.clearTokens()
    UserManager.clearUserInfo()
    this.clearLoginState()
    console.log('🚪 用户已登出')
  }
}

/**
 * 路由守卫工具
 */
export class RouteGuard {
  // 不需要登录就能访问的页面列表（公开页面）
  // 默认情况下，除了这些页面，所有其他页面都需要登录
  static PUBLIC_ROUTES = [
    '/pages/login/login'
  ]
  
  /**
   * 检查页面是否需要登录权限
   * @param {string} path - 页面路径
   * @returns {boolean} 是否需要登录
   */
  static isProtectedRoute(path) {
    // 默认所有页面都需要登录，除非在公开页面列表中
    return !this.isPublicRoute(path)
  }
  
  /**
   * 检查页面是否为公开页面
   * @param {string} path - 页面路径
   * @returns {boolean} 是否为公开页面
   */
  static isPublicRoute(path) {
    return this.PUBLIC_ROUTES.some(route => path.startsWith(route))
  }
  
  /**
   * 保存当前路径（用于登录后跳转）
   * @param {string} path - 页面路径
   */
  static saveReturnPath(path) {
    uni.setStorageSync('return_path', path)
  }
  
  /**
   * 获取并清除返回路径
   * @returns {string} 返回路径
   */
  static getAndClearReturnPath() {
    const path = uni.getStorageSync('return_path') || '/pages/index/index'
    uni.removeStorageSync('return_path')
    return path
  }
}

/**
 * 权限检查工具
 */
export class PermissionChecker {
  /**
   * 检查是否有访问权限
   * @param {string} permission - 权限标识
   * @returns {boolean} 是否有权限
   */
  static hasPermission(permission) {
    const userInfo = UserManager.getUserInfo()
    if (!userInfo) return false
    
    // 管理员拥有所有权限
    if (userInfo.role_id === 1) return true
    
    // 根据具体业务需求实现权限检查逻辑
    switch (permission) {
      case 'file_upload':
        return LoginStateManager.getLoginState()
      case 'user_management':
        return userInfo.role_id === 1
      default:
        return true
    }
  }
  
  /**
   * 检查功能是否可用
   * @param {string} feature - 功能标识
   * @returns {Object} 检查结果 {available: boolean, message: string}
   */
  static checkFeatureAvailable(feature) {
    const isLoggedIn = LoginStateManager.getLoginState()
    const userInfo = UserManager.getUserInfo()
    
    switch (feature) {
      case 'file_upload':
        if (!isLoggedIn) {
          return {
            available: false,
            message: '请先登录后再使用文件上传功能'
          }
        }
        return { available: true, message: '' }
        
      case 'profile_management':
        if (!isLoggedIn) {
          return {
            available: false,
            message: '请先登录后再查看个人资料'
          }
        }
        return { available: true, message: '' }
        
      case 'admin_functions':
        if (!userInfo || userInfo.role_id !== 1) {
          return {
            available: false,
            message: '仅管理员可使用此功能'
          }
        }
        return { available: true, message: '' }
        
      default:
        return { available: true, message: '' }
    }
  }
}
