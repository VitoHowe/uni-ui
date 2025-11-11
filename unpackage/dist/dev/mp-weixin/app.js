"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const stores_auth = require("./stores/auth.js");
const utils_navigationGuard = require("./utils/navigationGuard.js");
if (!Math) {
  "./pages/index/index.js";
  "./pages/study/study.js";
  "./pages/word-practice/word-practice.js";
  "./pages/question/question.js";
  "./pages/profile/profile.js";
  "./pages/upload/upload.js";
  "./pages/login/login.js";
  "./pages/debug/debug.js";
  "./pages/exam-list/exam-list.js";
  "./pages/exam/exam.js";
}
const _sfc_main = {
  async onLaunch() {
    common_vendor.index.__f__("warn", "at App.vue:7", "当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！");
    common_vendor.index.__f__("log", "at App.vue:8", "🚀 App Launch - 应用启动");
    try {
      utils_navigationGuard.NavigationGuard.setupAutoLoginInterceptor();
      const authStore = stores_auth.useAuthStore();
      await authStore.initAuthState();
      common_vendor.index.__f__("log", "at App.vue:17", "✅ 认证状态初始化完成");
    } catch (error) {
      common_vendor.index.__f__("error", "at App.vue:19", "❌ 认证状态初始化失败:", error);
    }
  },
  onShow() {
    common_vendor.index.__f__("log", "at App.vue:24", "👁️ App Show - 应用显示");
    const authStore = stores_auth.useAuthStore();
    authStore.checkAuthStatus();
    utils_navigationGuard.NavigationGuard.checkCurrentPagePermission();
  },
  onHide() {
    common_vendor.index.__f__("log", "at App.vue:35", "🙈 App Hide - 应用隐藏");
  }
};
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.use(common_vendor.createPinia());
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
