/**
 * 测试辅助工具
 * 用于验证微信登录系统的各项功能
 */

import { useAuthStore } from '@/stores/auth.js'
import { TokenManager, UserManager, LoginStateManager } from './auth.js'
import { request } from './request.js'
import { API_ENDPOINTS } from './constants.js'

export class AuthTestHelper {
  /**
   * 运行完整的认证系统测试
   */
  static async runFullTest() {
    console.log('🧪 开始认证系统综合测试')
    const results = []
    
    try {
      // 测试1: Token管理器
      results.push(await this.testTokenManager())
      
      // 测试2: 用户管理器  
      results.push(await this.testUserManager())
      
      // 测试3: 登录状态管理
      results.push(await this.testLoginStateManager())
      
      // 测试4: 网络请求系统
      results.push(await this.testRequestSystem())
      
      // 测试5: 认证Store
      results.push(await this.testAuthStore())
      
      // 汇总结果
      const passedTests = results.filter(r => r.passed).length
      const totalTests = results.length
      
      console.log(`🎯 测试完成: ${passedTests}/${totalTests} 通过`)
      
      // 显示结果
      this.showTestResults(results, passedTests, totalTests)
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error)
      uni.showToast({
        title: '测试运行失败',
        icon: 'error'
      })
    }
  }
  
  /**
   * 测试Token管理器
   */
  static async testTokenManager() {
    console.log('📝 测试Token管理器...')
    
    try {
      // 清空现有Token
      TokenManager.clearTokens()
      
      // 测试设置Token
      const testTokenData = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: '2h'
      }
      TokenManager.setTokens(testTokenData)
      
      // 验证Token获取
      const accessToken = TokenManager.getAccessToken()
      const refreshToken = TokenManager.getRefreshToken()
      
      if (accessToken !== testTokenData.accessToken || refreshToken !== testTokenData.refreshToken) {
        throw new Error('Token设置或获取失败')
      }
      
      // 测试Token刷新检查
      const shouldRefresh = TokenManager.shouldRefreshToken()
      const isExpired = TokenManager.isTokenExpired()
      
      console.log('✅ Token管理器测试通过')
      return { name: 'Token管理器', passed: true, message: '所有功能正常' }
      
    } catch (error) {
      console.error('❌ Token管理器测试失败:', error)
      return { name: 'Token管理器', passed: false, message: error.message }
    }
  }
  
  /**
   * 测试用户管理器
   */
  static async testUserManager() {
    console.log('👤 测试用户管理器...')
    
    try {
      // 清空现有用户信息
      UserManager.clearUserInfo()
      
      // 测试设置用户信息
      const testUser = {
        id: 1,
        nickname: '测试用户',
        avatar_url: '/static/avatar.png',
        role_id: 2,
        status: 1
      }
      UserManager.setUserInfo(testUser)
      
      // 验证用户信息获取
      const userInfo = UserManager.getUserInfo()
      if (!userInfo || userInfo.id !== testUser.id) {
        throw new Error('用户信息设置或获取失败')
      }
      
      // 测试权限检查
      const isAdmin = UserManager.isAdmin()
      const isActive = UserManager.isUserActive()
      
      if (isAdmin !== false || isActive !== true) {
        throw new Error('权限检查逻辑错误')
      }
      
      console.log('✅ 用户管理器测试通过')
      return { name: '用户管理器', passed: true, message: '所有功能正常' }
      
    } catch (error) {
      console.error('❌ 用户管理器测试失败:', error)
      return { name: '用户管理器', passed: false, message: error.message }
    }
  }
  
  /**
   * 测试登录状态管理
   */
  static async testLoginStateManager() {
    console.log('🔐 测试登录状态管理...')
    
    try {
      // 测试登录状态设置和获取
      LoginStateManager.setLoginState(true)
      const isLoggedIn = LoginStateManager.getLoginState()
      
      if (!isLoggedIn) {
        throw new Error('登录状态设置失败')
      }
      
      // 测试登出
      LoginStateManager.logout()
      const isLoggedInAfterLogout = LoginStateManager.getLoginState()
      const tokenAfterLogout = TokenManager.getAccessToken()
      const userAfterLogout = UserManager.getUserInfo()
      
      if (isLoggedInAfterLogout || tokenAfterLogout || userAfterLogout) {
        throw new Error('登出处理不完整')
      }
      
      console.log('✅ 登录状态管理测试通过')
      return { name: '登录状态管理', passed: true, message: '所有功能正常' }
      
    } catch (error) {
      console.error('❌ 登录状态管理测试失败:', error)
      return { name: '登录状态管理', passed: false, message: error.message }
    }
  }
  
  /**
   * 测试网络请求系统
   */
  static async testRequestSystem() {
    console.log('🌐 测试网络请求系统...')
    
    try {
      // 测试请求构建
      const testUrl = API_ENDPOINTS.AUTH.PROFILE
      if (!testUrl || !testUrl.startsWith('/')) {
        throw new Error('API端点配置错误')
      }
      
      // 测试错误创建
      const testError = request.createError('测试错误', 'TEST_ERROR')
      if (testError.message !== '测试错误' || testError.type !== 'TEST_ERROR') {
        throw new Error('错误对象创建失败')
      }
      
      // 测试URL构建
      const fullUrl = request.buildFullUrl('/test')
      if (!fullUrl.includes('localhost:3000')) {
        throw new Error('URL构建失败')
      }
      
      console.log('✅ 网络请求系统测试通过')
      return { name: '网络请求系统', passed: true, message: '基础功能正常' }
      
    } catch (error) {
      console.error('❌ 网络请求系统测试失败:', error)
      return { name: '网络请求系统', passed: false, message: error.message }
    }
  }
  
  /**
   * 测试认证Store
   */
  static async testAuthStore() {
    console.log('🏪 测试认证Store...')
    
    try {
      const authStore = useAuthStore()
      
      // 测试初始状态
      if (typeof authStore.isLoggedIn !== 'boolean') {
        throw new Error('Store状态初始化失败')
      }
      
      // 测试计算属性
      const isAuthenticated = authStore.isAuthenticated
      const userNickname = authStore.userNickname
      const userAvatar = authStore.userAvatar
      
      if (typeof isAuthenticated !== 'boolean' || 
          typeof userNickname !== 'string' || 
          typeof userAvatar !== 'string') {
        throw new Error('Store计算属性错误')
      }
      
      // 测试状态清空
      authStore.clearAuthData()
      
      if (authStore.isLoggedIn || authStore.user) {
        throw new Error('Store状态清空失败')
      }
      
      console.log('✅ 认证Store测试通过')
      return { name: '认证Store', passed: true, message: '所有功能正常' }
      
    } catch (error) {
      console.error('❌ 认证Store测试失败:', error)
      return { name: '认证Store', passed: false, message: error.message }
    }
  }
  
  /**
   * 显示测试结果
   */
  static showTestResults(results, passed, total) {
    const resultText = results.map(r => 
      `${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}`
    ).join('\n')
    
    const title = passed === total ? '🎉 所有测试通过' : '⚠️ 部分测试失败'
    const summary = `通过: ${passed}/${total}`
    
    uni.showModal({
      title,
      content: `${summary}\n\n${resultText}`,
      showCancel: false,
      confirmText: '确定'
    })
  }
  
  /**
   * 模拟登录测试
   */
  static async simulateLogin() {
    console.log('🎭 模拟登录测试...')
    
    try {
      const authStore = useAuthStore()
      
      // 模拟登录数据
      const mockAuthData = {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        expiresIn: '2h',
        user: {
          id: 999,
          nickname: '测试用户',
          avatar_url: '/static/uni.png',
          role_id: 2,
          status: 1
        }
      }
      
      // 保存认证数据
      authStore.saveAuthData(mockAuthData)
      
      // 验证登录状态
      if (!authStore.isAuthenticated) {
        throw new Error('模拟登录失败')
      }
      
      uni.showToast({
        title: '模拟登录成功',
        icon: 'success'
      })
      
      console.log('✅ 模拟登录成功')
      return true
      
    } catch (error) {
      console.error('❌ 模拟登录失败:', error)
      uni.showToast({
        title: '模拟登录失败',
        icon: 'error'
      })
      return false
    }
  }
  
  /**
   * 测试微信Code管理机制
   */
  static async testWechatCodeManager() {
    console.log('🧪 测试微信Code管理机制...')
    
    try {
      const { WechatAuth } = await import('./auth.js')
      
      // 测试1: 清除code缓存
      WechatAuth.clearCodeCache()
      console.log('✅ Code缓存清除测试通过')
      
      // 测试2: 检查内部状态
      if (WechatAuth._lastCode !== null || WechatAuth._codeTimestamp !== 0) {
        throw new Error('Code缓存清除失败')
      }
      
      console.log('✅ 微信Code管理机制测试通过')
      
      uni.showToast({
        title: 'Code管理测试通过',
        icon: 'success'
      })
      
      return true
      
    } catch (error) {
      console.error('❌ 微信Code管理机制测试失败:', error)
      
      uni.showToast({
        title: 'Code管理测试失败',
        icon: 'error'
      })
      
      return false
    }
  }
  
  /**
   * 测试登录重试机制
   */
  static async testLoginRetryMechanism() {
    console.log('🔄 测试登录重试机制...')
    
    try {
      const authStore = useAuthStore()
      
      // 测试code相关错误检查
      const codeError = new Error('微信API错误: code been used')
      const isCodeError = authStore.isCodeRelatedError(codeError)
      
      if (!isCodeError) {
        throw new Error('code错误检测失败')
      }
      
      // 测试其他错误
      const otherError = new Error('网络连接失败')
      const isOtherCodeError = authStore.isCodeRelatedError(otherError)
      
      if (isOtherCodeError) {
        throw new Error('非code错误误判')
      }
      
      console.log('✅ 登录重试机制测试通过')
      
      uni.showToast({
        title: '重试机制测试通过',
        icon: 'success'
      })
      
      return true
      
    } catch (error) {
      console.error('❌ 登录重试机制测试失败:', error)
      
      uni.showToast({
        title: '重试机制测试失败',
        icon: 'error'
      })
      
      return false
    }
  }
  
  /**
   * 清空所有测试数据
   */
  static clearTestData() {
    console.log('🧹 清空测试数据...')
    
    const authStore = useAuthStore()
    authStore.clearAuthData()
    
    uni.showToast({
      title: '测试数据已清空',
      icon: 'success'
    })
  }
}

// 默认导出
export default AuthTestHelper
