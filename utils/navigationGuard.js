import { RouteGuard, LoginStateManager } from './auth.js'

/**
 * 导航守卫管理器
 * 提供页面跳转时的权限检查功能
 */
export class NavigationGuard {
  /**
   * 检查页面访问权限
   * @param {string} url - 目标页面URL
   * @returns {boolean} 是否允许访问
   */
  static checkPageAccess(url) {
    // 提取页面路径
    const pagePath = this.extractPagePath(url)
    console.log('🚦 检查页面访问权限:', pagePath)
    
    // 如果是公开页面，直接允许访问
    if (RouteGuard.isPublicRoute(pagePath)) {
      console.log('✅ 公开页面，允许访问')
      return true
    }
    
    // 如果是受保护页面，检查登录状态
    if (RouteGuard.isProtectedRoute(pagePath)) {
      const isLoggedIn = LoginStateManager.getLoginState()
      
      if (!isLoggedIn) {
        console.log('❌ 受保护页面，需要登录')
        this.handleUnauthorizedAccess(pagePath)
        return false
      }
      
      console.log('✅ 已登录，允许访问受保护页面')
      return true
    }
    
    // 其他页面默认允许访问
    console.log('✅ 其他页面，默认允许访问')
    return true
  }
  
  /**
   * 安全导航 - 带权限检查的页面跳转
   * @param {Object} options - 跳转选项
   * @param {string} options.url - 目标URL
   * @param {string} options.type - 跳转类型: navigateTo|redirectTo|reLaunch|switchTab
   * @param {Object} options.extra - 额外参数
   * @returns {Promise<boolean>} 跳转是否成功
   */
  static async safeNavigate(options) {
    const { url, type = 'navigateTo', extra = {} } = options
    
    try {
      // 检查访问权限
      if (!this.checkPageAccess(url)) {
        return false
      }
      
      // 执行跳转
      const navigationMethod = uni[type]
      if (!navigationMethod) {
        throw new Error(`不支持的导航类型: ${type}`)
      }
      
      await new Promise((resolve, reject) => {
        navigationMethod({
          url,
          ...extra,
          success: resolve,
          fail: reject
        })
      })
      
      console.log('✅ 页面跳转成功:', url)
      return true
      
    } catch (error) {
      console.error('❌ 页面跳转失败:', error)
      uni.showToast({
        title: '页面跳转失败',
        icon: 'error'
      })
      return false
    }
  }
  
  /**
   * 处理未授权访问
   * @param {string} targetPath - 目标页面路径
   */
  static handleUnauthorizedAccess(targetPath) {
    // 保存目标路径
    RouteGuard.saveReturnPath(targetPath)
    
    // 显示登录提示
    uni.showModal({
      title: '需要登录',
      content: '访问此页面需要登录，是否立即登录？',
      confirmText: '立即登录',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          // 跳转到登录页面
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
  
  /**
   * 从URL中提取页面路径
   * @param {string} url - 完整URL
   * @returns {string} 页面路径
   */
  static extractPagePath(url) {
    // 移除查询参数
    const path = url.split('?')[0]
    
    // 如果不是以/开头，添加/
    return path.startsWith('/') ? path : `/${path}`
  }
  
  /**
   * 自动登录拦截器 - 在应用启动时调用
   */
  static setupAutoLoginInterceptor() {
    console.log('🛡️ 设置自动登录拦截器')
    
    // 拦截页面跳转方法
    const originalMethods = {
      navigateTo: uni.navigateTo,
      redirectTo: uni.redirectTo,
      reLaunch: uni.reLaunch,
      switchTab: uni.switchTab
    }
    
    // 包装导航方法
    Object.keys(originalMethods).forEach(method => {
      uni[method] = (options) => {
        // 检查权限
        if (options.url && !this.checkPageAccess(options.url)) {
          return
        }
        
        // 调用原始方法
        return originalMethods[method](options)
      }
    })
  }
  
  /**
   * 检查当前页面权限（用于页面onShow时调用）
   */
  static checkCurrentPagePermission() {
    const pages = getCurrentPages()
    if (pages.length === 0) return
    
    const currentPage = pages[pages.length - 1]
    const currentPath = `/${currentPage.route}`
    
    // 如果是受保护页面且未登录，提示用户
    if (RouteGuard.isProtectedRoute(currentPath)) {
      const isLoggedIn = LoginStateManager.getLoginState()
      if (!isLoggedIn) {
        console.log('⚠️ 当前页面需要登录权限')
        
        // 延迟显示提示，避免与页面加载冲突
        setTimeout(() => {
          uni.showToast({
            title: '建议登录后使用完整功能',
            icon: 'none',
            duration: 2000
          })
        }, 1000)
      }
    }
  }
  
  /**
   * 登录成功后的导航处理
   */
  static handleLoginSuccess() {
    // 获取并清除保存的返回路径
    const returnPath = RouteGuard.getAndClearReturnPath()
    
    console.log('🎉 登录成功，准备跳转:', returnPath)
    
    // 跳转到目标页面
    if (returnPath && returnPath !== '/pages/index/index') {
      uni.redirectTo({
        url: returnPath,
        fail: () => {
          // 如果跳转失败，回到首页
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }
      })
    } else {
      // 跳转到首页
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
}

/**
 * 便捷导航方法
 */
export const safeNavigateTo = (url, extra = {}) => {
  return NavigationGuard.safeNavigate({ url, type: 'navigateTo', extra })
}

export const safeRedirectTo = (url, extra = {}) => {
  return NavigationGuard.safeNavigate({ url, type: 'redirectTo', extra })
}

export const safeReLaunch = (url, extra = {}) => {
  return NavigationGuard.safeNavigate({ url, type: 'reLaunch', extra })
}

export const safeSwitchTab = (url, extra = {}) => {
  return NavigationGuard.safeNavigate({ url, type: 'switchTab', extra })
}

// 默认导出
export default NavigationGuard
