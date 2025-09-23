"use strict";
const common_vendor = require("../common/vendor.js");
const stores_auth = require("../stores/auth.js");
const utils_auth = require("../utils/auth.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "AuthGuard",
  props: {
    // 标题文本
    title: {
      type: String,
      default: "需要登录"
    },
    // 提示消息
    message: {
      type: String,
      default: "请登录后查看完整功能"
    },
    // 是否显示游客访问选项
    showGuestOption: {
      type: Boolean,
      default: false
    },
    // 是否显示功能预览
    showPreview: {
      type: Boolean,
      default: false
    },
    // 当前页面路径（用于登录后返回）
    currentPath: {
      type: String,
      default: ""
    },
    // 自动重定向到登录页（而不是显示引导）
    autoRedirect: {
      type: Boolean,
      default: false
    }
  },
  emits: ["guestAccess"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const authStore = stores_auth.useAuthStore();
    const shouldRedirect = common_vendor.computed(() => {
      return props.autoRedirect && !authStore.isAuthenticated;
    });
    const goToLogin = () => {
      if (props.currentPath) {
        utils_auth.RouteGuard.saveReturnPath(props.currentPath);
      } else {
        const pages = getCurrentPages();
        if (pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          const path = `/${currentPage.route}`;
          utils_auth.RouteGuard.saveReturnPath(path);
        }
      }
      common_vendor.index.navigateTo({
        url: "/pages/login/login"
      });
    };
    const handleGuestAccess = () => {
      emit("guestAccess");
    };
    if (shouldRedirect.value) {
      goToLogin();
    }
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(authStore).isAuthenticated
      }, common_vendor.unref(authStore).isAuthenticated ? {} : common_vendor.e({
        b: common_vendor.p({
          type: "locked",
          size: "48",
          color: "#007AFF"
        }),
        c: common_vendor.t(__props.title || "需要登录"),
        d: common_vendor.t(__props.message || "请登录后查看完整功能"),
        e: common_vendor.p({
          type: "person",
          size: "18",
          color: "#fff"
        }),
        f: common_vendor.o(goToLogin),
        g: __props.showGuestOption
      }, __props.showGuestOption ? {
        h: common_vendor.o(handleGuestAccess)
      } : {}, {
        i: __props.showPreview
      }, __props.showPreview ? {
        j: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        k: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        l: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        })
      } : {}));
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5f57192a"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/AuthGuard.js.map
