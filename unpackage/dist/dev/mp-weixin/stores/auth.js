"use strict";
const common_vendor = require("../common/vendor.js");
const utils_request = require("../utils/request.js");
const utils_constants = require("../utils/constants.js");
const utils_auth = require("../utils/auth.js");
const useAuthStore = common_vendor.defineStore("auth", {
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
      return state.isLoggedIn && state.user && utils_auth.TokenManager.getAccessToken();
    },
    /**
     * 用户昵称
     */
    userNickname: (state) => {
      var _a;
      return ((_a = state.user) == null ? void 0 : _a.nickname) || "用户";
    },
    /**
     * 用户头像
     */
    userAvatar: (state) => {
      var _a;
      return ((_a = state.user) == null ? void 0 : _a.avatar_url) || "/static/uni.png";
    },
    /**
     * 是否是管理员
     */
    isAdmin: (state) => {
      var _a;
      return ((_a = state.user) == null ? void 0 : _a.role_id) === 1;
    },
    /**
     * 用户角色文本
     */
    userRoleText: (state) => {
      if (!state.user)
        return "未登录";
      return state.user.role_id === 1 ? "管理员" : "普通用户";
    },
    /**
     * 登录状态文本
     */
    loginStatusText: (state) => {
      if (state.loading.login)
        return "登录中...";
      if (state.loading.refresh)
        return "刷新中...";
      if (!state.isLoggedIn)
        return "未登录";
      return "已登录";
    },
    /**
     * Token是否即将过期
     */
    tokenWillExpire: () => {
      return utils_auth.TokenManager.shouldRefreshToken();
    }
  },
  actions: {
    /**
     * 初始化认证状态
     * 应用启动时调用，恢复本地存储的登录状态
     */
    async initAuthState() {
      try {
        common_vendor.index.__f__("log", "at stores/auth.js:99", "🚀 初始化认证状态");
        const isLoggedIn = utils_auth.LoginStateManager.getLoginState();
        const userInfo = utils_auth.UserManager.getUserInfo();
        const hasToken = !!utils_auth.TokenManager.getAccessToken();
        if (isLoggedIn && userInfo && hasToken) {
          if (utils_auth.TokenManager.isTokenExpired()) {
            common_vendor.index.__f__("log", "at stores/auth.js:109", "⚠️ Token已过期，尝试刷新");
            await this.refreshToken();
          } else {
            this.isLoggedIn = true;
            this.user = userInfo;
            this.updateTokenInfo();
            common_vendor.index.__f__("log", "at stores/auth.js:116", "✅ 登录状态已恢复", userInfo);
          }
        } else {
          this.clearAuthData();
          const pages = getCurrentPages();
          if (pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            const currentPath = `/${currentPage.route}`;
            if (currentPath !== "/pages/login/login") {
              common_vendor.index.__f__("log", "at stores/auth.js:130", "🚪 用户未登录，跳转到登录页面");
              common_vendor.index.reLaunch({
                url: "/pages/login/login"
              });
            }
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at stores/auth.js:138", "❌ 初始化认证状态失败:", error);
        this.logout(false);
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
        throw new Error("正在登录中，请稍候...");
      }
      try {
        this.loading.login = true;
        common_vendor.index.__f__("log", "at stores/auth.js:156", "🔐 开始微信登录", { requireUserInfo, isRetry });
        if (!utils_auth.WechatAuth.isWechatLoginSupported()) {
          throw new Error("当前环境不支持微信登录");
        }
        const code = await utils_auth.WechatAuth.getWechatCode(isRetry);
        common_vendor.index.__f__("log", "at stores/auth.js:166", "📝 准备登录数据", {
          codePrefix: code.substring(0, 8) + "...",
          requireUserInfo,
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
        });
        const loginData = { code };
        if (requireUserInfo) {
          try {
            const userProfile = await utils_auth.WechatAuth.getUserProfile();
            Object.assign(loginData, {
              encryptedData: userProfile.encryptedData,
              iv: userProfile.iv,
              signature: userProfile.signature
            });
            common_vendor.index.__f__("log", "at stores/auth.js:184", "👤 已获取用户信息，准备完整登录");
          } catch (profileError) {
            common_vendor.index.__f__("warn", "at stores/auth.js:186", "⚠️ 用户取消授权，仅进行基础登录");
          }
        }
        const response = await utils_request.request.post(utils_constants.API_ENDPOINTS.AUTH.LOGIN, loginData, {
          needAuth: false,
          showLoading: false
        });
        this.saveAuthData(response);
        common_vendor.index.__f__("log", "at stores/auth.js:199", "✅ 微信登录成功");
        return true;
      } catch (error) {
        common_vendor.index.__f__("error", "at stores/auth.js:203", "❌ 微信登录失败:", error);
        utils_auth.WechatAuth.clearCodeCache();
        if (this.isCodeRelatedError(error)) {
          common_vendor.index.__f__("log", "at stores/auth.js:210", "🔄 检测到code相关错误，准备重试");
          if (!isRetry) {
            common_vendor.index.__f__("log", "at stores/auth.js:214", "🔄 自动重试登录（使用新code）");
            await this.delay(1e3);
            return await this.loginWithWechat(requireUserInfo, true);
          }
        }
        throw error;
      } finally {
        this.loading.login = false;
      }
    },
    /**
     * 检查是否为code相关错误
     * @param {Error} error - 错误对象
     * @returns {boolean} 是否为code相关错误
     */
    isCodeRelatedError(error) {
      var _a;
      const errorMsg = ((_a = error.message) == null ? void 0 : _a.toLowerCase()) || "";
      return errorMsg.includes("code") && (errorMsg.includes("been used") || errorMsg.includes("invalid") || errorMsg.includes("expired"));
    },
    /**
     * 延迟函数
     * @param {number} ms - 延迟毫秒数
     * @returns {Promise<void>}
     */
    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    /**
     * 刷新Token
     * @returns {Promise<void>}
     */
    async refreshToken() {
      if (this.loading.refresh) {
        return;
      }
      const refreshToken = utils_auth.TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error("没有刷新令牌，请重新登录");
      }
      try {
        this.loading.refresh = true;
        common_vendor.index.__f__("log", "at stores/auth.js:264", "🔄 刷新Token");
        const response = await utils_request.request.post(utils_constants.API_ENDPOINTS.AUTH.REFRESH, {
          refreshToken
        }, {
          needAuth: false,
          showLoading: false
        });
        utils_auth.TokenManager.setTokens(response);
        this.updateTokenInfo();
        common_vendor.index.__f__("log", "at stores/auth.js:277", "✅ Token刷新成功");
      } catch (error) {
        common_vendor.index.__f__("error", "at stores/auth.js:280", "❌ Token刷新失败:", error);
        this.logout(false);
        throw error;
      } finally {
        this.loading.refresh = false;
      }
    },
    /**
     * 获取用户资料
     * @returns {Promise<void>}
     */
    async getUserProfile() {
      if (!this.isAuthenticated) {
        throw new Error("用户未登录");
      }
      try {
        this.loading.profile = true;
        common_vendor.index.__f__("log", "at stores/auth.js:300", "👤 获取用户资料");
        const userInfo = await utils_request.request.get(utils_constants.API_ENDPOINTS.AUTH.PROFILE);
        this.user = userInfo;
        utils_auth.UserManager.setUserInfo(userInfo);
        common_vendor.index.__f__("log", "at stores/auth.js:308", "✅ 用户资料获取成功");
      } catch (error) {
        common_vendor.index.__f__("error", "at stores/auth.js:311", "❌ 获取用户资料失败:", error);
        throw error;
      } finally {
        this.loading.profile = false;
      }
    },
    /**
     * 退出登录
     * @param {boolean} callApi - 是否调用登出API
     * @returns {Promise<void>}
     */
    async logout(callApi = true) {
      try {
        common_vendor.index.__f__("log", "at stores/auth.js:325", "🚪 用户退出登录");
        if (callApi && this.isAuthenticated) {
          try {
            await utils_request.request.post(utils_constants.API_ENDPOINTS.AUTH.LOGOUT);
          } catch (apiError) {
            common_vendor.index.__f__("warn", "at stores/auth.js:332", "⚠️ 调用登出API失败，继续本地登出", apiError);
          }
        }
        this.clearAuthData();
        common_vendor.index.reLaunch({
          url: "/pages/login/login"
        });
        common_vendor.index.showToast({
          title: "已退出登录",
          icon: "success"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at stores/auth.js:350", "❌ 退出登录过程出错:", error);
      }
    },
    /**
     * 检查登录状态
     * @returns {boolean} 是否已登录
     */
    checkAuthStatus() {
      const hasToken = !!utils_auth.TokenManager.getAccessToken();
      const isExpired = utils_auth.TokenManager.isTokenExpired();
      const hasUser = !!this.user;
      const stateLoggedIn = this.isLoggedIn;
      const actuallyLoggedIn = hasToken && !isExpired && hasUser && stateLoggedIn;
      if (this.isLoggedIn !== actuallyLoggedIn) {
        this.isLoggedIn = actuallyLoggedIn;
        if (!actuallyLoggedIn) {
          this.clearAuthData();
        }
      }
      return actuallyLoggedIn;
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
      const { accessToken, refreshToken, expiresIn, user } = authData;
      utils_auth.TokenManager.setTokens({
        accessToken,
        refreshToken,
        expiresIn
      });
      utils_auth.UserManager.setUserInfo(user);
      utils_auth.LoginStateManager.setLoginState(true);
      this.isLoggedIn = true;
      this.user = user;
      this.updateTokenInfo();
      common_vendor.index.__f__("log", "at stores/auth.js:405", "💾 认证数据已保存");
    },
    /**
     * 清除认证数据
     */
    clearAuthData() {
      utils_auth.TokenManager.clearTokens();
      utils_auth.UserManager.clearUserInfo();
      utils_auth.LoginStateManager.clearLoginState();
      this.isLoggedIn = false;
      this.user = null;
      this.tokenInfo = {
        hasToken: false,
        expiresAt: null
      };
      common_vendor.index.__f__("log", "at stores/auth.js:429", "🗑️ 认证数据已清除");
    },
    /**
     * 更新Token信息（用于UI显示）
     */
    updateTokenInfo() {
      const hasToken = !!utils_auth.TokenManager.getAccessToken();
      const expiresAt = common_vendor.index.getStorageSync("token_expires_at");
      this.tokenInfo = {
        hasToken,
        expiresAt
      };
    },
    /**
     * 强制刷新用户信息
     */
    async forceRefreshUser() {
      if (!this.isAuthenticated)
        return;
      try {
        await this.getUserProfile();
      } catch (error) {
        common_vendor.index.__f__("warn", "at stores/auth.js:454", "⚠️ 强制刷新用户信息失败:", error);
      }
    }
  }
});
exports.useAuthStore = useAuthStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/auth.js.map
