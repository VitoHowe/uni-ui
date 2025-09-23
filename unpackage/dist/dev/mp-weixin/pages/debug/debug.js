"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_auth = require("../../stores/auth.js");
const utils_testHelpers = require("../../utils/testHelpers.js");
const utils_constants = require("../../utils/constants.js");
const utils_auth = require("../../utils/auth.js");
const utils_request = require("../../utils/request.js");
if (!Array) {
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  (_easycom_uni_section2 + _easycom_uni_icons2)();
}
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (_easycom_uni_section + _easycom_uni_icons)();
}
const _sfc_main = {
  __name: "debug",
  setup(__props) {
    const authStore = stores_auth.useAuthStore();
    const logs = common_vendor.ref([]);
    const systemInfo = common_vendor.reactive({
      platform: "",
      version: ""
    });
    const apiBaseUrl = common_vendor.computed(() => utils_constants.API_CONFIG.BASE_URL);
    const currentPagePath = common_vendor.computed(() => {
      const pages = getCurrentPages();
      return pages.length > 0 ? `/${pages[pages.length - 1].route}` : "未知";
    });
    const addLog = (message, type = "info") => {
      const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
      logs.value.unshift({
        time,
        message,
        type
      });
      if (logs.value.length > 50) {
        logs.value.pop();
      }
    };
    const runFullTest = async () => {
      addLog("开始运行完整测试套件...", "info");
      try {
        await utils_testHelpers.AuthTestHelper.runFullTest();
        addLog("完整测试套件执行完成", "success");
      } catch (error) {
        addLog(`完整测试失败: ${error.message}`, "error");
      }
    };
    const simulateLogin = async () => {
      addLog("开始模拟登录测试...", "info");
      try {
        const success = await utils_testHelpers.AuthTestHelper.simulateLogin();
        if (success) {
          addLog("模拟登录成功", "success");
        } else {
          addLog("模拟登录失败", "error");
        }
      } catch (error) {
        addLog(`模拟登录异常: ${error.message}`, "error");
      }
    };
    const testTokenRefresh = async () => {
      addLog("开始测试Token刷新机制...", "info");
      try {
        if (!authStore.isAuthenticated) {
          addLog("请先登录后再测试Token刷新", "warning");
          return;
        }
        await authStore.refreshToken();
        addLog("Token刷新成功", "success");
      } catch (error) {
        addLog(`Token刷新失败: ${error.message}`, "error");
      }
    };
    const testNetworkRequest = async () => {
      addLog("开始测试网络请求功能...", "info");
      try {
        const testUrl = utils_request.request.buildFullUrl("/test");
        addLog(`URL构建测试: ${testUrl}`, "info");
        const headers = await utils_request.request.buildHeaders({}, false);
        addLog(`请求头构建测试通过`, "success");
        addLog("网络请求功能测试完成", "success");
      } catch (error) {
        addLog(`网络请求测试失败: ${error.message}`, "error");
      }
    };
    const testPermissions = () => {
      addLog("开始测试权限检查功能...", "info");
      try {
        const uploadPermission = utils_auth.PermissionChecker.checkFeatureAvailable("file_upload");
        addLog(
          `文件上传权限: ${uploadPermission.available ? "允许" : "拒绝"} - ${uploadPermission.message}`,
          uploadPermission.available ? "success" : "warning"
        );
        const profilePermission = utils_auth.PermissionChecker.checkFeatureAvailable("profile_management");
        addLog(
          `个人资料权限: ${profilePermission.available ? "允许" : "拒绝"} - ${profilePermission.message}`,
          profilePermission.available ? "success" : "warning"
        );
        const adminPermission = utils_auth.PermissionChecker.checkFeatureAvailable("admin_functions");
        addLog(
          `管理员功能权限: ${adminPermission.available ? "允许" : "拒绝"} - ${adminPermission.message}`,
          adminPermission.available ? "success" : "warning"
        );
        addLog("权限检查功能测试完成", "success");
      } catch (error) {
        addLog(`权限检查测试失败: ${error.message}`, "error");
      }
    };
    const testWechatCodeManager = async () => {
      addLog("开始测试微信Code管理机制...", "info");
      try {
        const success = await utils_testHelpers.AuthTestHelper.testWechatCodeManager();
        if (success) {
          addLog("微信Code管理机制测试通过", "success");
        } else {
          addLog("微信Code管理机制测试失败", "error");
        }
      } catch (error) {
        addLog(`微信Code管理测试异常: ${error.message}`, "error");
      }
    };
    const testLoginRetry = async () => {
      addLog("开始测试登录重试机制...", "info");
      try {
        const success = await utils_testHelpers.AuthTestHelper.testLoginRetryMechanism();
        if (success) {
          addLog("登录重试机制测试通过", "success");
        } else {
          addLog("登录重试机制测试失败", "error");
        }
      } catch (error) {
        addLog(`登录重试测试异常: ${error.message}`, "error");
      }
    };
    const clearTestData = () => {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空所有测试数据吗？这将清除登录状态和用户信息。",
        success: (res) => {
          if (res.confirm) {
            utils_testHelpers.AuthTestHelper.clearTestData();
            addLog("测试数据已清空", "info");
          }
        }
      });
    };
    const clearLogs = () => {
      logs.value = [];
      common_vendor.index.showToast({
        title: "日志已清空",
        icon: "success"
      });
    };
    const goBack = () => {
      common_vendor.index.reLaunch({
        url: "/pages/index/index"
      });
    };
    const getSystemInfo = () => {
      common_vendor.index.getSystemInfo({
        success: (res) => {
          systemInfo.platform = res.platform || "未知";
          systemInfo.version = res.version || "未知";
        }
      });
    };
    common_vendor.onMounted(() => {
      addLog("认证系统调试页面加载完成", "info");
      getSystemInfo();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(common_vendor.unref(authStore).loginStatusText),
        b: common_vendor.unref(authStore).isAuthenticated ? "#28a745" : "#dc3545",
        c: common_vendor.t(common_vendor.unref(authStore).userNickname),
        d: common_vendor.t(common_vendor.unref(authStore).userRoleText),
        e: common_vendor.t(common_vendor.unref(authStore).tokenInfo.hasToken ? "有效" : "无效"),
        f: common_vendor.unref(authStore).tokenInfo.hasToken ? "#28a745" : "#dc3545",
        g: common_vendor.p({
          title: "当前状态",
          type: "line",
          padding: true
        }),
        h: common_vendor.p({
          type: "gear",
          size: "16",
          color: "#007AFF"
        }),
        i: common_vendor.o(runFullTest),
        j: common_vendor.p({
          type: "person",
          size: "16",
          color: "#28a745"
        }),
        k: common_vendor.o(simulateLogin),
        l: common_vendor.p({
          type: "refresh",
          size: "16",
          color: "#ffc107"
        }),
        m: common_vendor.o(testTokenRefresh),
        n: common_vendor.p({
          type: "cloud-upload",
          size: "16",
          color: "#17a2b8"
        }),
        o: common_vendor.o(testNetworkRequest),
        p: common_vendor.p({
          type: "locked",
          size: "16",
          color: "#6f42c1"
        }),
        q: common_vendor.o(testPermissions),
        r: common_vendor.p({
          type: "weixin",
          size: "16",
          color: "#07c160"
        }),
        s: common_vendor.o(testWechatCodeManager),
        t: common_vendor.p({
          type: "loop",
          size: "16",
          color: "#ff6b6b"
        }),
        v: common_vendor.o(testLoginRetry),
        w: common_vendor.p({
          type: "trash",
          size: "16",
          color: "#dc3545"
        }),
        x: common_vendor.o(clearTestData),
        y: common_vendor.p({
          title: "测试功能",
          type: "line",
          padding: true
        }),
        z: common_vendor.t(apiBaseUrl.value),
        A: common_vendor.t(currentPagePath.value),
        B: common_vendor.t(systemInfo.platform),
        C: common_vendor.t(systemInfo.version),
        D: common_vendor.p({
          title: "调试信息",
          type: "line",
          padding: true
        }),
        E: logs.value.length > 0
      }, logs.value.length > 0 ? {
        F: common_vendor.f(logs.value, (log, index, i0) => {
          return {
            a: common_vendor.t(log.time),
            b: common_vendor.t(log.message),
            c: common_vendor.n(log.type),
            d: index
          };
        }),
        G: common_vendor.o(clearLogs),
        H: common_vendor.p({
          title: "测试日志",
          type: "line",
          padding: true
        })
      } : {}, {
        I: common_vendor.p({
          type: "back",
          size: "16",
          color: "#666"
        }),
        J: common_vendor.o(goBack)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-12bbb3dc"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/debug/debug.js.map
