import { defineStore } from 'pinia'
import { request } from '@/utils/request.js'
import { API_ENDPOINTS } from '@/utils/constants.js'
import { 
  TokenManager, 
  UserManager, 
  WechatAuth, 
  LoginStateManager 
} from '@/utils/auth.js'
import NavigationGuard from '@/utils/navigationGuard.js'

/**
 * 认证状态管理Store
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    // 登录状态
    isLoggedIn: false,
    
    // 用户信息
    user: null,
    
    // 加载状态
    loading: {
      login: false,
      refresh: false,
      profile: false
    },
    
    // Token信息（仅用于状态显示，实际存储在TokenManager中）
    tokenInfo: {
      hasToken: false,
      expiresAt: null
    }
  }),
  
  getters: {
    /**
     * 是否已认证
     */
    isAuthenticated: (state) => {
      return state.isLoggedIn && state.user && TokenManager.getAccessToken()
    },
    
    /**
     * 用户昵称
     */
    userNickname: (state) => {
      return state.user?.nickname || '用户'
    },
    
    /**
     * 用户头像
     */
    userAvatar: (state) => {
      return state.user?.avatar_url || '/static/uni.png'
    },
    
    /**
     * 是否是管理员
     */
    isAdmin: (state) => {
      return state.user?.role_id === 1
    },
    
    /**
     * 用户角色文本
     */
    userRoleText: (state) => {
      if (!state.user) return '未登录'
      return state.user.role_id === 1 ? '管理员' : '普通用户'
    },
    
    /**
     * 登录状态文本
     */
    loginStatusText: (state) => {
      if (state.loading.login) return '登录中...'
      if (state.loading.refresh) return '刷新中...'
      if (!state.isLoggedIn) return '未登录'
      return '已登录'
    },
    
    /**
     * Token是否即将过期
     */
    tokenWillExpire: () => {
      return TokenManager.shouldRefreshToken()
    }
  },
  
  actions: {
    /**
     * 初始化认证状态
     * 应用启动时调用，恢复本地存储的登录状态
     */
    async initAuthState() {
      try {
        console.log('🚀 初始化认证状态')
        
        // 检查本地存储的登录状态
        const isLoggedIn = LoginStateManager.getLoginState()
        const userInfo = UserManager.getUserInfo()
        const hasToken = !!TokenManager.getAccessToken()
        
        if (isLoggedIn && userInfo && hasToken) {
          // 检查Token是否过期
          if (TokenManager.isTokenExpired()) {
            console.log('⚠️ Token已过期，尝试刷新')
            await this.refreshToken()
          } else {
            // 恢复登录状态
            this.isLoggedIn = true
            this.user = userInfo
            this.updateTokenInfo()
            console.log('✅ 登录状态已恢复', userInfo)
          }
        } else {
          // 清除不完整的状态
          this.clearAuthData()
          
          // 检查当前页面是否为登录页面，如果不是，则跳转到登录页面
          const pages = getCurrentPages()
          if (pages.length > 0) {
            const currentPage = pages[pages.length - 1]
            const currentPath = `/${currentPage.route}`
            
            // 如果当前不在登录页面，跳转到登录页面
            if (currentPath !== '/pages/login/login') {
              console.log('🚪 用户未登录，跳转到登录页面')
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }
          }
        }
      } catch (error) {
        console.error('❌ 初始化认证状态失败:', error)
        this.logout(false)
      }
    },
    
    /**
     * 微信小程序登录
     * @param {boolean} requireUserInfo - 是否需要获取用户信息
     * @param {boolean} isRetry - 是否为重试调用
     * @returns {Promise<boolean>} 登录是否成功
     */
    async loginWithWechat(requireUserInfo = false, isRetry = false) {
      if (this.loading.login) {
        throw new Error('正在登录中，请稍候...')
      }
      
      try {
        this.loading.login = true
        console.log('🔐 开始微信登录', { requireUserInfo, isRetry })
        
        // 检查是否支持微信登录
        if (!WechatAuth.isWechatLoginSupported()) {
          throw new Error('当前环境不支持微信登录')
        }
        
        // 获取微信登录Code（重试时强制刷新）
        const code = await WechatAuth.getWechatCode(isRetry)
        
        console.log('📝 准备登录数据', {
          codePrefix: code.substring(0, 8) + '...',
          requireUserInfo,
          timestamp: new Date().toLocaleTimeString()
        })
        
        // 构建登录请求数据
        const loginData = { code }
        
        // 如果需要用户信息，获取用户授权
        if (requireUserInfo) {
          try {
            const userProfile = await WechatAuth.getUserProfile()
            Object.assign(loginData, {
              encryptedData: userProfile.encryptedData,
              iv: userProfile.iv,
              signature: userProfile.signature
            })
            console.log('👤 已获取用户信息，准备完整登录')
          } catch (profileError) {
            console.warn('⚠️ 用户取消授权，仅进行基础登录')
          }
        }
        
        // 调用登录API
        const response = await request.post(API_ENDPOINTS.AUTH.LOGIN, loginData, {
          needAuth: false,
          showLoading: false
        })
        
        // 保存认证信息
        this.saveAuthData(response)
        
        console.log('✅ 微信登录成功')
        return true
        
      } catch (error) {
        console.error('❌ 微信登录失败:', error)
        
        // 登录失败时清除code缓存
        WechatAuth.clearCodeCache()
        
        // 检查是否为code相关错误
        if (this.isCodeRelatedError(error)) {
          console.log('🔄 检测到code相关错误，准备重试')
          
          // 如果不是重试调用且错误与code相关，则尝试重试一次
          if (!isRetry) {
            console.log('🔄 自动重试登录（使用新code）')
            await this.delay(1000) // 延迟1秒后重试
            return await this.loginWithWechat(requireUserInfo, true)
          }
        }
        
        throw error
      } finally {
        this.loading.login = false
      }
    },
    
    /**
     * 检查是否为code相关错误
     * @param {Error} error - 错误对象
     * @returns {boolean} 是否为code相关错误
     */
    isCodeRelatedError(error) {
      const errorMsg = error.message?.toLowerCase() || ''
      return errorMsg.includes('code') && 
             (errorMsg.includes('been used') || 
              errorMsg.includes('invalid') ||
              errorMsg.includes('expired'))
    },
    
    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise<void>}
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    },
    
    /**
     * 刷新Token
     * @returns {Promise<void>}
     */
    async refreshToken() {
      if (this.loading.refresh) {
        return
      }
      
      const refreshToken = TokenManager.getRefreshToken()
      if (!refreshToken) {
        throw new Error('没有刷新令牌，请重新登录')
      }
      
      try {
        this.loading.refresh = true
        console.log('🔄 刷新Token')
        
        const response = await request.post(API_ENDPOINTS.AUTH.REFRESH, {
          refreshToken
        }, {
          needAuth: false,
          showLoading: false
        })
        
        // 更新Token信息
        TokenManager.setTokens(response)
        this.updateTokenInfo()
        
        console.log('✅ Token刷新成功')
        
      } catch (error) {
        console.error('❌ Token刷新失败:', error)
        // 刷新失败，清除登录状态
        this.logout(false)
        throw error
      } finally {
        this.loading.refresh = false
      }
    },
    
    /**
     * 获取用户资料
     * @returns {Promise<void>}
     */
    async getUserProfile() {
      if (!this.isAuthenticated) {
        throw new Error('用户未登录')
      }
      
      try {
        this.loading.profile = true
        console.log('👤 获取用户资料')
        
        const userInfo = await request.get(API_ENDPOINTS.AUTH.PROFILE)
        
        // 更新用户信息
        this.user = userInfo
        UserManager.setUserInfo(userInfo)
        
        console.log('✅ 用户资料获取成功')
        
      } catch (error) {
        console.error('❌ 获取用户资料失败:', error)
        throw error
      } finally {
        this.loading.profile = false
      }
    },
    
    /**
     * 退出登录
     * @param {boolean} callApi - 是否调用登出API
     * @returns {Promise<void>}
     */
    async logout(callApi = true) {
      try {
        console.log('🚪 用户退出登录')
        
        // 调用登出API
        if (callApi && this.isAuthenticated) {
          try {
            await request.post(API_ENDPOINTS.AUTH.LOGOUT)
          } catch (apiError) {
            console.warn('⚠️ 调用登出API失败，继续本地登出', apiError)
          }
        }
        
        // 清除所有认证相关数据
        this.clearAuthData()
        
        // 跳转到登录页面（因为现在所有页面都需要登录）
        uni.reLaunch({
          url: '/pages/login/login'
        })
        
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })
        
      } catch (error) {
        console.error('❌ 退出登录过程出错:', error)
      }
    },
    
    /**
     * 检查登录状态
     * @returns {boolean} 是否已登录
     */
    checkAuthStatus() {
      const hasToken = !!TokenManager.getAccessToken()
      const isExpired = TokenManager.isTokenExpired()
      const hasUser = !!this.user
      const stateLoggedIn = this.isLoggedIn
      
      const actuallyLoggedIn = hasToken && !isExpired && hasUser && stateLoggedIn
      
      if (this.isLoggedIn !== actuallyLoggedIn) {
        this.isLoggedIn = actuallyLoggedIn
        if (!actuallyLoggedIn) {
          this.clearAuthData()
        }
      }
      
      return actuallyLoggedIn
    },
    
    /**
     * 保存认证数据
     * @param {Object} authData - 认证数据
     * @param {string} authData.accessToken - 访问令牌
     * @param {string} authData.refreshToken - 刷新令牌
     * @param {string} authData.expiresIn - 过期时间
     * @param {Object} authData.user - 用户信息
     */
    saveAuthData(authData) {
      const { accessToken, refreshToken, expiresIn, user } = authData
      
      // 保存Token
      TokenManager.setTokens({
        accessToken,
        refreshToken,
        expiresIn
      })
      
      // 保存用户信息
      UserManager.setUserInfo(user)
      
      // 保存登录状态
      LoginStateManager.setLoginState(true)
      
      // 更新Store状态
      this.isLoggedIn = true
      this.user = user
      this.updateTokenInfo()
      
      console.log('💾 认证数据已保存')
    },
    
    /**
     * 清除认证数据
     */
    clearAuthData() {
      // 清除Token
      TokenManager.clearTokens()
      
      // 清除用户信息
      UserManager.clearUserInfo()
      
      // 清除登录状态
      LoginStateManager.clearLoginState()
      
      // 重置Store状态
      this.isLoggedIn = false
      this.user = null
      this.tokenInfo = {
        hasToken: false,
        expiresAt: null
      }
      
      console.log('🗑️ 认证数据已清除')
    },
    
    /**
     * 更新Token信息（用于UI显示）
     */
    updateTokenInfo() {
      const hasToken = !!TokenManager.getAccessToken()
      const expiresAt = uni.getStorageSync('token_expires_at')
      
      this.tokenInfo = {
        hasToken,
        expiresAt
      }
    },
    
    /**
     * 强制刷新用户信息
     */
    async forceRefreshUser() {
      if (!this.isAuthenticated) return
      
      try {
        await this.getUserProfile()
      } catch (error) {
        console.warn('⚠️ 强制刷新用户信息失败:', error)
      }
    }
  }
})
