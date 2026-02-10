"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const common_vendor = require("../common/vendor.js");
const utils_constants = require("./constants.js");
class TokenManager {
  /**
   * 设置Token信息
   * @param {Object} tokenData - Token数据 
   * @param {string} tokenData.accessToken - 访问令牌
   * @param {string} tokenData.refreshToken - 刷新令牌
   * @param {string} tokenData.expiresIn - 过期时间（如"2h"）
   */
  static setTokens(tokenData) {
    const { accessToken, refreshToken, expiresIn } = tokenData;
    const expiresAt = Date.now() + this.parseExpiresIn(expiresIn);
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt);
    common_vendor.index.__f__("log", "at utils/auth.js:25", "🔑 Token已更新", { expiresAt: new Date(expiresAt) });
  }
  /**
   * 获取访问令牌
   * @returns {string|null} 访问令牌
   */
  static getAccessToken() {
    return common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.ACCESS_TOKEN) || null;
  }
  /**
   * 获取刷新令牌
   * @returns {string|null} 刷新令牌
   */
  static getRefreshToken() {
    return common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.REFRESH_TOKEN) || null;
  }
  /**
   * 检查Token是否即将过期
   * @returns {boolean} 是否需要刷新
   */
  static shouldRefreshToken() {
    const expiresAt = common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt)
      return false;
    const now = Date.now();
    const timeLeft = expiresAt - now;
    return timeLeft <= utils_constants.API_CONFIG.TOKEN_REFRESH_THRESHOLD;
  }
  /**
   * 检查Token是否已过期
   * @returns {boolean} 是否已过期
   */
  static isTokenExpired() {
    const expiresAt = common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt)
      return true;
    return Date.now() >= expiresAt;
  }
  /**
   * 清除所有Token
   */
  static clearTokens() {
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.ACCESS_TOKEN);
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.REFRESH_TOKEN);
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.TOKEN_EXPIRES_AT);
    common_vendor.index.__f__("log", "at utils/auth.js:77", "🗑️ Token已清除");
  }
  /**
   * 解析过期时间字符串为毫秒数
   * @param {string} expiresIn - 过期时间字符串（如"2h", "7d"）
   * @returns {number} 毫秒数
   */
  static parseExpiresIn(expiresIn) {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    switch (unit) {
      case "s":
        return value * 1e3;
      case "m":
        return value * 60 * 1e3;
      case "h":
        return value * 60 * 60 * 1e3;
      case "d":
        return value * 24 * 60 * 60 * 1e3;
      default:
        return 2 * 60 * 60 * 1e3;
    }
  }
}
class UserManager {
  /**
   * 保存用户信息
   * @param {Object} userInfo - 用户信息
   */
  static setUserInfo(userInfo) {
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.USER_INFO, userInfo);
    common_vendor.index.__f__("log", "at utils/auth.js:109", "👤 用户信息已更新", userInfo);
  }
  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息
   */
  static getUserInfo() {
    return common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.USER_INFO) || null;
  }
  /**
   * 清除用户信息
   */
  static clearUserInfo() {
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.USER_INFO);
    common_vendor.index.__f__("log", "at utils/auth.js:125", "🗑️ 用户信息已清除");
  }
  /**
   * 检查是否是管理员
   * @returns {boolean} 是否是管理员
   */
  static isAdmin() {
    const userInfo = this.getUserInfo();
    return userInfo && userInfo.role_id === 1;
  }
  /**
   * 检查用户状态是否正常
   * @returns {boolean} 用户状态是否正常
   */
  static isUserActive() {
    const userInfo = this.getUserInfo();
    return userInfo && userInfo.status === 1;
  }
}
class WechatAuth {
  /**
   * 获取微信登录Code
   * @param {boolean} forceRefresh - 强制刷新code，即使刚刚获取过
   * @returns {Promise<string>} 微信登录Code
   */
  static getWechatCode(forceRefresh = false) {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      if (!forceRefresh && this._lastCode && now - this._codeTimestamp < 2e3) {
        common_vendor.index.__f__("warn", "at utils/auth.js:166", "⚠️ 获取code过于频繁，请稍后重试");
        reject(new Error("获取授权过于频繁，请稍后重试"));
        return;
      }
      common_vendor.index.__f__("log", "at utils/auth.js:171", "🔐 开始获取全新的微信Code...");
      common_vendor.index.login({
        provider: "weixin",
        onlyAuthorize: true,
        success: (res) => {
          common_vendor.index.__f__("log", "at utils/auth.js:177", "🔐 获取成功", res);
          if (!res.code) {
            common_vendor.index.__f__("error", "at utils/auth.js:179", "❌ 微信返回的code为空");
            reject(new Error("微信授权失败，请重试"));
            return;
          }
          if (!forceRefresh && res.code === this._lastCode) {
            common_vendor.index.__f__("warn", "at utils/auth.js:186", "⚠️ 获取到重复的微信code，强制重新获取");
            setTimeout(() => {
              this.getWechatCode(true).then(resolve).catch(reject);
            }, 500);
            return;
          }
          this._lastCode = res.code;
          this._codeTimestamp = now;
          common_vendor.index.__f__("log", "at utils/auth.js:198", "✅ 获取微信Code成功", {
            code: res.code.substring(0, 8) + "...",
            timestamp: new Date(now).toLocaleTimeString()
          });
          resolve(res.code);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/auth.js:206", "❌ 获取微信Code失败", err);
          reject(new Error(err.errMsg || "获取微信授权失败，请重试"));
        }
      });
    });
  }
  /**
   * 清除缓存的code信息（在登录失败时调用）
   */
  static clearCodeCache() {
    common_vendor.index.__f__("log", "at utils/auth.js:217", "🗑️ 清除微信code缓存");
    this._lastCode = null;
    this._codeTimestamp = 0;
  }
  /**
   * 获取用户信息（需要用户授权）
   * @returns {Promise<Object>} 用户信息
   */
  static getUserProfile() {
    return new Promise((resolve, reject) => {
      common_vendor.index.getUserProfile({
        desc: "用于完善个人资料",
        success: (res) => {
          common_vendor.index.__f__("log", "at utils/auth.js:232", "👤 获取用户信息成功", res.userInfo);
          resolve({
            encryptedData: res.encryptedData,
            iv: res.iv,
            signature: res.signature,
            userInfo: res.userInfo
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at utils/auth.js:241", "❌ 用户取消授权", err);
          reject(new Error("需要授权才能使用完整功能"));
        }
      });
    });
  }
  /**
   * 检查是否支持微信登录
   * @returns {boolean} 是否支持
   */
  static isWechatLoginSupported() {
    return true;
  }
}
// 内部变量：记录最后一次获取的code，避免重复使用
__publicField(WechatAuth, "_lastCode", null);
__publicField(WechatAuth, "_codeTimestamp", 0);
class LoginStateManager {
  /**
   * 设置登录状态
   * @param {boolean} isLoggedIn - 是否已登录
   */
  static setLoginState(isLoggedIn) {
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.LOGIN_STATE, isLoggedIn);
  }
  /**
   * 获取登录状态
   * @returns {boolean} 是否已登录
   */
  static getLoginState() {
    return common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.LOGIN_STATE) || false;
  }
  /**
   * 清除登录状态
   */
  static clearLoginState() {
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.LOGIN_STATE);
  }
  /**
   * 完整的登出处理
   */
  static logout() {
    TokenManager.clearTokens();
    UserManager.clearUserInfo();
    this.clearLoginState();
    common_vendor.index.__f__("log", "at utils/auth.js:308", "🚪 用户已登出");
  }
}
class RouteGuard {
  /**
   * 检查页面是否需要登录权限
   * @param {string} path - 页面路径
   * @returns {boolean} 是否需要登录
   */
  static isProtectedRoute(path) {
    return !this.isPublicRoute(path);
  }
  /**
   * 检查页面是否为公开页面
   * @param {string} path - 页面路径
   * @returns {boolean} 是否为公开页面
   */
  static isPublicRoute(path) {
    return this.PUBLIC_ROUTES.some((route) => path.startsWith(route));
  }
  /**
   * 保存当前路径（用于登录后跳转）
   * @param {string} path - 页面路径
   */
  static saveReturnPath(path) {
    common_vendor.index.setStorageSync("return_path", path);
  }
  /**
   * 获取并清除返回路径
   * @returns {string} 返回路径
   */
  static getAndClearReturnPath() {
    const path = common_vendor.index.getStorageSync("return_path") || "/pages/index/index";
    common_vendor.index.removeStorageSync("return_path");
    return path;
  }
}
// 不需要登录就能访问的页面列表（公开页面）
// 默认情况下，除了这些页面，所有其他页面都需要登录
__publicField(RouteGuard, "PUBLIC_ROUTES", [
  "/pages/login/login"
]);
class PermissionChecker {
  /**
   * 检查是否有访问权限
   * @param {string} permission - 权限标识
   * @returns {boolean} 是否有权限
   */
  static hasPermission(permission) {
    const userInfo = UserManager.getUserInfo();
    if (!userInfo)
      return false;
    if (userInfo.role_id === 1)
      return true;
    switch (permission) {
      case "file_upload":
        return LoginStateManager.getLoginState();
      case "user_management":
        return userInfo.role_id === 1;
      default:
        return true;
    }
  }
  /**
   * 检查功能是否可用
   * @param {string} feature - 功能标识
   * @returns {Object} 检查结果 {available: boolean, message: string}
   */
  static checkFeatureAvailable(feature) {
    const isLoggedIn = LoginStateManager.getLoginState();
    const userInfo = UserManager.getUserInfo();
    switch (feature) {
      case "file_upload":
        if (!isLoggedIn) {
          return {
            available: false,
            message: "请先登录后再使用文件上传功能"
          };
        }
        return { available: true, message: "" };
      case "profile_management":
        if (!isLoggedIn) {
          return {
            available: false,
            message: "请先登录后再查看个人资料"
          };
        }
        return { available: true, message: "" };
      case "admin_functions":
        if (!userInfo || userInfo.role_id !== 1) {
          return {
            available: false,
            message: "仅管理员可使用此功能"
          };
        }
        return { available: true, message: "" };
      default:
        return { available: true, message: "" };
    }
  }
}
exports.LoginStateManager = LoginStateManager;
exports.PermissionChecker = PermissionChecker;
exports.RouteGuard = RouteGuard;
exports.TokenManager = TokenManager;
exports.UserManager = UserManager;
exports.WechatAuth = WechatAuth;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/auth.js.map
