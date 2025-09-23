"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const stores_auth = require("../../stores/auth.js");
const utils_navigationGuard = require("../../utils/navigationGuard.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "login",
  setup(__props) {
    const authStore = stores_auth.useAuthStore();
    const appVersion = common_vendor.ref("1.0.0");
    const showLoadingMask = common_vendor.ref(false);
    const loadingText = common_vendor.ref("登录中...");
    const features = common_vendor.reactive([
      {
        title: "智能学习",
        description: "个性化学习路径推荐",
        icon: "gear",
        color: "#007AFF"
      },
      {
        title: "题库练习",
        description: "海量题目，精准练习",
        icon: "compose",
        color: "#28a745"
      },
      {
        title: "进度同步",
        description: "多端数据实时同步",
        icon: "cloud-upload",
        color: "#ffc107"
      },
      {
        title: "文件上传",
        description: "支持文档批量解析",
        icon: "folder",
        color: "#17a2b8"
      }
    ]);
    const canLogin = common_vendor.computed(() => {
      return !authStore.loading.login && !showLoadingMask.value;
    });
    const getLoginButtonText = () => {
      if (showLoadingMask.value) {
        return loadingText.value || "处理中...";
      }
      if (authStore.loading.login) {
        return "登录中...";
      }
      return "微信一键登录";
    };
    const onLogoError = () => {
      common_vendor.index.__f__("warn", "at pages/login/login.vue:167", "Logo加载失败，使用默认图标");
    };
    const handleWechatLogin = async () => {
      common_vendor.index.__f__("log", "at pages/login/login.vue:172", "🔘 用户点击微信登录按钮");
      if (!canLogin.value) {
        common_vendor.index.__f__("warn", "at pages/login/login.vue:176", "⚠️ 当前正在登录中，忽略重复点击");
        return;
      }
      try {
        showLoadingMask.value = true;
        loadingText.value = "正在获取微信授权...";
        common_vendor.index.__f__("log", "at pages/login/login.vue:184", "🚀 开始微信登录流程");
        await authStore.loginWithWechat(true, false);
        loadingText.value = "登录成功，跳转中...";
        common_vendor.index.__f__("log", "at pages/login/login.vue:190", "🎉 微信登录成功，准备跳转");
        await navigateAfterLogin();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/login/login.vue:196", "❌ 微信登录失败:", error);
        if (authStore.isCodeRelatedError && authStore.isCodeRelatedError(error)) {
          common_vendor.index.__f__("log", "at pages/login/login.vue:200", "🔄 检测到code错误，显示重试选项");
          common_vendor.index.showModal({
            title: "登录失败",
            content: "微信授权码已失效，是否重新尝试登录？",
            confirmText: "重试登录",
            cancelText: "稍后再试",
            success: async (res) => {
              if (res.confirm) {
                setTimeout(() => {
                  handleWechatLogin();
                }, 500);
              }
            }
          });
        } else {
          handleLoginError(error);
        }
      } finally {
        showLoadingMask.value = false;
      }
    };
    const onGetUserInfo = async (event) => {
      common_vendor.index.__f__("log", "at pages/login/login.vue:225", "获取用户信息:", event.detail);
      if (event.detail.errMsg === "getUserInfo:ok") {
        return;
      } else {
        common_vendor.index.__f__("log", "at pages/login/login.vue:232", "🔄 用户拒绝授权，尝试基础登录（使用新code）");
        if (!canLogin.value) {
          common_vendor.index.__f__("warn", "at pages/login/login.vue:235", "⚠️ 当前正在登录中，忽略重复请求");
          return;
        }
        try {
          showLoadingMask.value = true;
          loadingText.value = "正在进行基础登录...";
          await authStore.loginWithWechat(false, true);
          loadingText.value = "登录成功，跳转中...";
          await navigateAfterLogin();
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/login/login.vue:250", "基础登录失败:", error);
          handleLoginError(error);
        } finally {
          showLoadingMask.value = false;
        }
      }
    };
    const handleGuestBrowse = () => {
      common_vendor.index.showModal({
        title: "游客模式",
        content: "游客模式下部分功能受限，建议登录后使用完整功能。确定以游客身份浏览吗？",
        confirmText: "确定浏览",
        cancelText: "返回登录",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.reLaunch({
              url: "/pages/index/index"
            });
          }
        }
      });
    };
    const navigateAfterLogin = async () => {
      common_vendor.index.__f__("log", "at pages/login/login.vue:278", "登录成功，处理跳转逻辑");
      setTimeout(() => {
        utils_navigationGuard.NavigationGuard.handleLoginSuccess();
      }, 1e3);
    };
    const handleLoginError = (error) => {
      let title = "登录失败";
      let content = error.message || "登录过程中发生未知错误，请稍后重试";
      if (error.message && error.message.includes("取消")) {
        title = "登录取消";
        content = "您取消了微信授权。您可以选择游客浏览，或稍后重新登录获取完整功能。";
      } else if (error.message && error.message.includes("网络")) {
        title = "网络错误";
        content = "网络连接异常，请检查网络设置后重试。";
      } else if (error.message && error.message.includes("服务器")) {
        title = "服务异常";
        content = "服务器暂时无法响应，请稍后重试。";
      }
      common_vendor.index.showModal({
        title,
        content,
        showCancel: false,
        confirmText: "知道了"
      });
    };
    const showUserAgreement = () => {
      common_vendor.index.showModal({
        title: "用户协议",
        content: "这里应该显示完整的用户协议内容...",
        showCancel: false,
        confirmText: "知道了"
      });
    };
    const showPrivacyPolicy = () => {
      common_vendor.index.showModal({
        title: "隐私政策",
        content: "这里应该显示完整的隐私政策内容...",
        showCancel: false,
        confirmText: "知道了"
      });
    };
    const checkAuthState = () => {
      if (authStore.isAuthenticated) {
        common_vendor.index.__f__("log", "at pages/login/login.vue:334", "用户已登录，跳转至首页");
        common_vendor.index.reLaunch({
          url: "/pages/index/index"
        });
      }
    };
    common_vendor.onMounted(() => {
      checkAuthState();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_assets._imports_0,
        b: common_vendor.o(onLogoError),
        c: common_vendor.f(features, (feature, index, i0) => {
          return {
            a: "e4e4508d-0-" + i0,
            b: common_vendor.p({
              type: feature.icon,
              size: "24",
              color: "#fff"
            }),
            c: feature.color,
            d: common_vendor.t(feature.title),
            e: common_vendor.t(feature.description),
            f: index
          };
        }),
        d: !common_vendor.unref(authStore).loading.login && !showLoadingMask.value
      }, !common_vendor.unref(authStore).loading.login && !showLoadingMask.value ? {
        e: common_vendor.p({
          type: "weixin",
          size: "20",
          color: "#fff"
        })
      } : {
        f: common_vendor.p({
          type: "spinner-cycle",
          size: "20",
          color: "#fff"
        })
      }, {
        g: common_vendor.t(getLoginButtonText()),
        h: common_vendor.unref(authStore).loading.login ? 1 : "",
        i: common_vendor.unref(authStore).loading.login || showLoadingMask.value,
        j: common_vendor.o(handleWechatLogin),
        k: common_vendor.o(onGetUserInfo),
        l: common_vendor.unref(authStore).loading.login,
        m: common_vendor.o(handleGuestBrowse),
        n: common_vendor.o(showUserAgreement),
        o: common_vendor.o(showPrivacyPolicy),
        p: common_vendor.t(appVersion.value),
        q: showLoadingMask.value
      }, showLoadingMask.value ? {
        r: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#007AFF"
        }),
        s: common_vendor.t(loadingText.value)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
