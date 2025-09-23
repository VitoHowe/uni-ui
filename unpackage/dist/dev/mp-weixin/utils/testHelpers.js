"use strict";
const common_vendor = require("../common/vendor.js");
const stores_auth = require("../stores/auth.js");
const utils_auth = require("./auth.js");
const utils_request = require("./request.js");
const utils_constants = require("./constants.js");
class AuthTestHelper {
  /**
   * 运行完整的认证系统测试
   */
  static async runFullTest() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:16", "🧪 开始认证系统综合测试");
    const results = [];
    try {
      results.push(await this.testTokenManager());
      results.push(await this.testUserManager());
      results.push(await this.testLoginStateManager());
      results.push(await this.testRequestSystem());
      results.push(await this.testAuthStore());
      const passedTests = results.filter((r) => r.passed).length;
      const totalTests = results.length;
      common_vendor.index.__f__("log", "at utils/testHelpers.js:39", `🎯 测试完成: ${passedTests}/${totalTests} 通过`);
      this.showTestResults(results, passedTests, totalTests);
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:45", "❌ 测试运行失败:", error);
      common_vendor.index.showToast({
        title: "测试运行失败",
        icon: "error"
      });
    }
  }
  /**
   * 测试Token管理器
   */
  static async testTokenManager() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:57", "📝 测试Token管理器...");
    try {
      utils_auth.TokenManager.clearTokens();
      const testTokenData = {
        accessToken: "test_access_token",
        refreshToken: "test_refresh_token",
        expiresIn: "2h"
      };
      utils_auth.TokenManager.setTokens(testTokenData);
      const accessToken = utils_auth.TokenManager.getAccessToken();
      const refreshToken = utils_auth.TokenManager.getRefreshToken();
      if (accessToken !== testTokenData.accessToken || refreshToken !== testTokenData.refreshToken) {
        throw new Error("Token设置或获取失败");
      }
      const shouldRefresh = utils_auth.TokenManager.shouldRefreshToken();
      const isExpired = utils_auth.TokenManager.isTokenExpired();
      common_vendor.index.__f__("log", "at utils/testHelpers.js:83", "✅ Token管理器测试通过");
      return { name: "Token管理器", passed: true, message: "所有功能正常" };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:87", "❌ Token管理器测试失败:", error);
      return { name: "Token管理器", passed: false, message: error.message };
    }
  }
  /**
   * 测试用户管理器
   */
  static async testUserManager() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:96", "👤 测试用户管理器...");
    try {
      utils_auth.UserManager.clearUserInfo();
      const testUser = {
        id: 1,
        nickname: "测试用户",
        avatar_url: "/static/avatar.png",
        role_id: 2,
        status: 1
      };
      utils_auth.UserManager.setUserInfo(testUser);
      const userInfo = utils_auth.UserManager.getUserInfo();
      if (!userInfo || userInfo.id !== testUser.id) {
        throw new Error("用户信息设置或获取失败");
      }
      const isAdmin = utils_auth.UserManager.isAdmin();
      const isActive = utils_auth.UserManager.isUserActive();
      if (isAdmin !== false || isActive !== true) {
        throw new Error("权限检查逻辑错误");
      }
      common_vendor.index.__f__("log", "at utils/testHelpers.js:126", "✅ 用户管理器测试通过");
      return { name: "用户管理器", passed: true, message: "所有功能正常" };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:130", "❌ 用户管理器测试失败:", error);
      return { name: "用户管理器", passed: false, message: error.message };
    }
  }
  /**
   * 测试登录状态管理
   */
  static async testLoginStateManager() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:139", "🔐 测试登录状态管理...");
    try {
      utils_auth.LoginStateManager.setLoginState(true);
      const isLoggedIn = utils_auth.LoginStateManager.getLoginState();
      if (!isLoggedIn) {
        throw new Error("登录状态设置失败");
      }
      utils_auth.LoginStateManager.logout();
      const isLoggedInAfterLogout = utils_auth.LoginStateManager.getLoginState();
      const tokenAfterLogout = utils_auth.TokenManager.getAccessToken();
      const userAfterLogout = utils_auth.UserManager.getUserInfo();
      if (isLoggedInAfterLogout || tokenAfterLogout || userAfterLogout) {
        throw new Error("登出处理不完整");
      }
      common_vendor.index.__f__("log", "at utils/testHelpers.js:160", "✅ 登录状态管理测试通过");
      return { name: "登录状态管理", passed: true, message: "所有功能正常" };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:164", "❌ 登录状态管理测试失败:", error);
      return { name: "登录状态管理", passed: false, message: error.message };
    }
  }
  /**
   * 测试网络请求系统
   */
  static async testRequestSystem() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:173", "🌐 测试网络请求系统...");
    try {
      const testUrl = utils_constants.API_ENDPOINTS.AUTH.PROFILE;
      if (!testUrl || !testUrl.startsWith("/")) {
        throw new Error("API端点配置错误");
      }
      const testError = utils_request.request.createError("测试错误", "TEST_ERROR");
      if (testError.message !== "测试错误" || testError.type !== "TEST_ERROR") {
        throw new Error("错误对象创建失败");
      }
      const fullUrl = utils_request.request.buildFullUrl("/test");
      if (!fullUrl.includes("localhost:3000")) {
        throw new Error("URL构建失败");
      }
      common_vendor.index.__f__("log", "at utils/testHelpers.js:194", "✅ 网络请求系统测试通过");
      return { name: "网络请求系统", passed: true, message: "基础功能正常" };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:198", "❌ 网络请求系统测试失败:", error);
      return { name: "网络请求系统", passed: false, message: error.message };
    }
  }
  /**
   * 测试认证Store
   */
  static async testAuthStore() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:207", "🏪 测试认证Store...");
    try {
      const authStore = stores_auth.useAuthStore();
      if (typeof authStore.isLoggedIn !== "boolean") {
        throw new Error("Store状态初始化失败");
      }
      const isAuthenticated = authStore.isAuthenticated;
      const userNickname = authStore.userNickname;
      const userAvatar = authStore.userAvatar;
      if (typeof isAuthenticated !== "boolean" || typeof userNickname !== "string" || typeof userAvatar !== "string") {
        throw new Error("Store计算属性错误");
      }
      authStore.clearAuthData();
      if (authStore.isLoggedIn || authStore.user) {
        throw new Error("Store状态清空失败");
      }
      common_vendor.index.__f__("log", "at utils/testHelpers.js:235", "✅ 认证Store测试通过");
      return { name: "认证Store", passed: true, message: "所有功能正常" };
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:239", "❌ 认证Store测试失败:", error);
      return { name: "认证Store", passed: false, message: error.message };
    }
  }
  /**
   * 显示测试结果
   */
  static showTestResults(results, passed, total) {
    const resultText = results.map(
      (r) => `${r.passed ? "✅" : "❌"} ${r.name}: ${r.message}`
    ).join("\n");
    const title = passed === total ? "🎉 所有测试通过" : "⚠️ 部分测试失败";
    const summary = `通过: ${passed}/${total}`;
    common_vendor.index.showModal({
      title,
      content: `${summary}

${resultText}`,
      showCancel: false,
      confirmText: "确定"
    });
  }
  /**
   * 模拟登录测试
   */
  static async simulateLogin() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:267", "🎭 模拟登录测试...");
    try {
      const authStore = stores_auth.useAuthStore();
      const mockAuthData = {
        accessToken: "mock_access_token_" + Date.now(),
        refreshToken: "mock_refresh_token_" + Date.now(),
        expiresIn: "2h",
        user: {
          id: 999,
          nickname: "测试用户",
          avatar_url: "/static/uni.png",
          role_id: 2,
          status: 1
        }
      };
      authStore.saveAuthData(mockAuthData);
      if (!authStore.isAuthenticated) {
        throw new Error("模拟登录失败");
      }
      common_vendor.index.showToast({
        title: "模拟登录成功",
        icon: "success"
      });
      common_vendor.index.__f__("log", "at utils/testHelpers.js:299", "✅ 模拟登录成功");
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:303", "❌ 模拟登录失败:", error);
      common_vendor.index.showToast({
        title: "模拟登录失败",
        icon: "error"
      });
      return false;
    }
  }
  /**
   * 测试微信Code管理机制
   */
  static async testWechatCodeManager() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:316", "🧪 测试微信Code管理机制...");
    try {
      const { WechatAuth } = await "./auth.js";
      WechatAuth.clearCodeCache();
      common_vendor.index.__f__("log", "at utils/testHelpers.js:323", "✅ Code缓存清除测试通过");
      if (WechatAuth._lastCode !== null || WechatAuth._codeTimestamp !== 0) {
        throw new Error("Code缓存清除失败");
      }
      common_vendor.index.__f__("log", "at utils/testHelpers.js:330", "✅ 微信Code管理机制测试通过");
      common_vendor.index.showToast({
        title: "Code管理测试通过",
        icon: "success"
      });
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:340", "❌ 微信Code管理机制测试失败:", error);
      common_vendor.index.showToast({
        title: "Code管理测试失败",
        icon: "error"
      });
      return false;
    }
  }
  /**
   * 测试登录重试机制
   */
  static async testLoginRetryMechanism() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:355", "🔄 测试登录重试机制...");
    try {
      const authStore = stores_auth.useAuthStore();
      const codeError = new Error("微信API错误: code been used");
      const isCodeError = authStore.isCodeRelatedError(codeError);
      if (!isCodeError) {
        throw new Error("code错误检测失败");
      }
      const otherError = new Error("网络连接失败");
      const isOtherCodeError = authStore.isCodeRelatedError(otherError);
      if (isOtherCodeError) {
        throw new Error("非code错误误判");
      }
      common_vendor.index.__f__("log", "at utils/testHelpers.js:376", "✅ 登录重试机制测试通过");
      common_vendor.index.showToast({
        title: "重试机制测试通过",
        icon: "success"
      });
      return true;
    } catch (error) {
      common_vendor.index.__f__("error", "at utils/testHelpers.js:386", "❌ 登录重试机制测试失败:", error);
      common_vendor.index.showToast({
        title: "重试机制测试失败",
        icon: "error"
      });
      return false;
    }
  }
  /**
   * 清空所有测试数据
   */
  static clearTestData() {
    common_vendor.index.__f__("log", "at utils/testHelpers.js:401", "🧹 清空测试数据...");
    const authStore = stores_auth.useAuthStore();
    authStore.clearAuthData();
    common_vendor.index.showToast({
      title: "测试数据已清空",
      icon: "success"
    });
  }
}
exports.AuthTestHelper = AuthTestHelper;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/testHelpers.js.map
