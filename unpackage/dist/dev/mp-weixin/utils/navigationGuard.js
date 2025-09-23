"use strict";
const common_vendor = require("../common/vendor.js");
const utils_auth = require("./auth.js");
class NavigationGuard {
  /**
   * 检查页面访问权限
   * @param {string} url - 目标页面URL
   * @returns {boolean} 是否允许访问
   */
  static checkPageAccess(url) {
    const pagePath = this.extractPagePath(url);
    common_vendor.index.__f__("log", "at utils/navigationGuard.js:16", "🚦 检查页面访问权限:", pagePath);
    if (utils_auth.RouteGuard.isPublicRoute(pagePath)) {
      common_vendor.index.__f__("log", "at utils/navigationGuard.js:20", "✅ 公开页面，允许访问");
      return true;
    }
    if (utils_auth.RouteGuard.isProtectedRoute(pagePath)) {
      const isLoggedIn = utils_auth.LoginStateManager.getLoginState();
      if (!isLoggedIn) {
        common_vendor.index.__f__("log", "at utils/navigationGuard.js:29", "❌ 受保护页面，需要登录");
        this.handleUnauthorizedAccess(pagePath);
        return false;
      }
      common_vendor.index.__f__("log", "at utils/navigationGuard.js:34", "✅ 已登录，允许访问受保护页面");
      return true;
    }
    common_vendor.index.__f__("log", "at utils/navigationGuard.js:39", "✅ 其他页面，默认允许访问");
    return true;
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
    const { url, type = "navigateTo", extra = {} } = options;
    try {
      if (!this.checkPageAccess(url)) {
        return false;
      }
      const navigationMethod = common_vendor.index[type];
      if (!navigationMethod) {
        throw new Error(`不支持的导航类型: ${type}`);
      }
      await new Promise((resolve, reject) => {
        navigationMethod({
          url,
          ...extra,
          success: resolve,
          fail: reject
        });
      });
      common_vendor.index.__f__("log", "at utils/navigationGuard.js:75", "✅ 页面跳转成功:", url);
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/navigationGuard.js:79", "❌ 页面跳转失败:", error);
      common_vendor.index.showToast({
        title: "页面跳转失败",
        icon: "error"
      });
      return false;
    }
  }
  /**
   * 处理未授权访问
   * @param {string} targetPath - 目标页面路径
   */
  static handleUnauthorizedAccess(targetPath) {
    utils_auth.RouteGuard.saveReturnPath(targetPath);
    common_vendor.index.showModal({
      title: "需要登录",
      content: "访问此页面需要登录，是否立即登录？",
      confirmText: "立即登录",
      cancelText: "稍后再说",
      success: (res) => {
        if (res.confirm) {
          common_vendor.index.navigateTo({
            url: "/pages/login/login"
          });
        }
      }
    });
  }
  /**
   * 从URL中提取页面路径
   * @param {string} url - 完整URL
   * @returns {string} 页面路径
   */
  static extractPagePath(url) {
    const path = url.split("?")[0];
    return path.startsWith("/") ? path : `/${path}`;
  }
  /**
   * 自动登录拦截器 - 在应用启动时调用
   */
  static setupAutoLoginInterceptor() {
    common_vendor.index.__f__("log", "at utils/navigationGuard.js:130", "🛡️ 设置自动登录拦截器");
    const originalMethods = {
      navigateTo: common_vendor.index.navigateTo,
      redirectTo: common_vendor.index.redirectTo,
      reLaunch: common_vendor.index.reLaunch,
      switchTab: common_vendor.index.switchTab
    };
    Object.keys(originalMethods).forEach((method) => {
      common_vendor.index[method] = (options) => {
        if (options.url && !this.checkPageAccess(options.url)) {
          return;
        }
        return originalMethods[method](options);
      };
    });
  }
  /**
   * 检查当前页面权限（用于页面onShow时调用）
   */
  static checkCurrentPagePermission() {
    const pages = getCurrentPages();
    if (pages.length === 0)
      return;
    const currentPage = pages[pages.length - 1];
    const currentPath = `/${currentPage.route}`;
    if (utils_auth.RouteGuard.isProtectedRoute(currentPath)) {
      const isLoggedIn = utils_auth.LoginStateManager.getLoginState();
      if (!isLoggedIn) {
        common_vendor.index.__f__("log", "at utils/navigationGuard.js:168", "⚠️ 当前页面需要登录权限");
        setTimeout(() => {
          common_vendor.index.showToast({
            title: "建议登录后使用完整功能",
            icon: "none",
            duration: 2e3
          });
        }, 1e3);
      }
    }
  }
  /**
   * 登录成功后的导航处理
   */
  static handleLoginSuccess() {
    const returnPath = utils_auth.RouteGuard.getAndClearReturnPath();
    common_vendor.index.__f__("log", "at utils/navigationGuard.js:189", "🎉 登录成功，准备跳转:", returnPath);
    if (returnPath && returnPath !== "/pages/index/index") {
      common_vendor.index.redirectTo({
        url: returnPath,
        fail: () => {
          common_vendor.index.reLaunch({
            url: "/pages/index/index"
          });
        }
      });
    } else {
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    }
  }
}
exports.NavigationGuard = NavigationGuard;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/navigationGuard.js.map
