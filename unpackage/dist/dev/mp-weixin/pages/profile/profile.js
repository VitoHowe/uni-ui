"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_auth = require("../../stores/auth.js");
require("../../utils/constants.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_icons2 + _easycom_uni_section2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_icons + AuthGuard + _easycom_uni_section + _easycom_uni_list_item + _easycom_uni_list + CustomTabBar)();
}
const CustomTabBar = () => "../../components/CustomTabBar.js";
const AuthGuard = () => "../../components/AuthGuard.js";
const _sfc_main = {
  __name: "profile",
  setup(__props) {
    const authStore = stores_auth.useAuthStore();
    const studyStats = common_vendor.reactive([
      { label: "学习天数", value: "45", color: "#007AFF" },
      { label: "完成章节", value: "18", color: "#28a745" },
      { label: "练习题数", value: "523", color: "#ffc107" },
      { label: "正确率", value: "87%", color: "#dc3545" }
    ]);
    const menuItems = common_vendor.reactive([
      {
        title: "学习计划",
        icon: "calendar",
        color: "#007AFF",
        rightText: "",
        action: "studyPlan"
      },
      {
        title: "学习笔记",
        icon: "compose",
        color: "#28a745",
        rightText: "12篇",
        action: "studyNotes"
      },
      {
        title: "收藏夹",
        icon: "star",
        color: "#ffc107",
        rightText: "8个",
        action: "favorites"
      },
      {
        title: "学习报告",
        icon: "bars",
        color: "#6f42c1",
        rightText: "",
        action: "studyReport"
      },
      {
        title: "文件管理",
        icon: "cloud-upload",
        color: "#17a2b8",
        rightText: "",
        action: "fileManagement"
      }
    ]);
    const settingItems = common_vendor.reactive([
      {
        title: "消息通知",
        note: "管理推送通知设置",
        icon: "sound",
        action: "notification"
      },
      {
        title: "学习提醒",
        note: "设置每日学习提醒时间",
        icon: "calendar",
        action: "reminder"
      },
      {
        title: "清除缓存",
        note: "清理应用缓存数据",
        icon: "trash",
        action: "clearCache"
      },
      {
        title: "意见反馈",
        note: "向我们反馈问题和建议",
        icon: "chatboxes",
        action: "feedback"
      },
      {
        title: "关于我们",
        note: "应用版本信息",
        icon: "info",
        action: "about"
      }
    ]);
    const onAvatarError = () => {
      common_vendor.index.__f__("log", "at pages/profile/profile.vue:222", "头像加载失败");
    };
    const editProfile = () => {
      common_vendor.index.showToast({
        title: "编辑个人资料",
        icon: "none"
      });
    };
    const handleMenuClick = (menu) => {
      switch (menu.action) {
        case "studyPlan":
          common_vendor.index.showToast({ title: "学习计划", icon: "none" });
          break;
        case "studyNotes":
          common_vendor.index.showToast({ title: "学习笔记", icon: "none" });
          break;
        case "favorites":
          common_vendor.index.showToast({ title: "收藏夹", icon: "none" });
          break;
        case "studyReport":
          common_vendor.index.showToast({ title: "学习报告", icon: "none" });
          break;
        case "fileManagement":
          common_vendor.index.navigateTo({ url: "/pkg-tools/pages/upload/upload" });
          break;
      }
    };
    const handleSettingClick = (setting) => {
      switch (setting.action) {
        case "notification":
          common_vendor.index.showToast({ title: "消息通知设置", icon: "none" });
          break;
        case "reminder":
          common_vendor.index.showToast({ title: "学习提醒设置", icon: "none" });
          break;
        case "clearCache":
          handleClearCache();
          break;
        case "feedback":
          common_vendor.index.showToast({ title: "意见反馈", icon: "none" });
          break;
        case "about":
          common_vendor.index.showToast({ title: "关于我们", icon: "none" });
          break;
      }
    };
    const handleClearCache = () => {
      common_vendor.index.showModal({
        title: "确认清除",
        content: "确定要清除应用缓存吗？",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.showToast({
              title: "缓存清除成功",
              icon: "success"
            });
          }
        }
      });
    };
    const handleLogout = () => {
      if (!authStore.isAuthenticated) {
        common_vendor.index.navigateTo({
          url: "/pages/login/login"
        });
        return;
      }
      common_vendor.index.showModal({
        title: "确认退出",
        content: "确定要退出登录吗？退出后部分功能将无法使用。",
        success: async (res) => {
          if (res.confirm) {
            try {
              await authStore.logout();
            } catch (error) {
              common_vendor.index.__f__("error", "at pages/profile/profile.vue:313", "退出登录失败:", error);
              common_vendor.index.showToast({
                title: "退出失败，请重试",
                icon: "error"
              });
            }
          }
        }
      });
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pages/profile/profile.vue:326", "切换到tab:", index);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !common_vendor.unref(authStore).isAuthenticated
      }, !common_vendor.unref(authStore).isAuthenticated ? {
        b: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        d: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        e: common_vendor.p({
          title: "个人中心",
          message: "登录后可查看学习统计、管理个人资料和使用完整功能",
          ["show-preview"]: true,
          ["current-path"]: "/pages/profile/profile"
        })
      } : {
        f: common_vendor.unref(authStore).userAvatar,
        g: common_vendor.o(onAvatarError),
        h: common_vendor.t(common_vendor.unref(authStore).userNickname),
        i: common_vendor.t(common_vendor.unref(authStore).isAuthenticated ? `${common_vendor.unref(authStore).userRoleText} · 正在备考高级信息系统项目管理师` : "请登录后查看完整功能"),
        j: common_vendor.p({
          type: "compose",
          size: "18",
          color: "#007AFF"
        }),
        k: common_vendor.o(editProfile),
        l: common_vendor.f(studyStats, (stat, index, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: stat.color,
            c: common_vendor.t(stat.label),
            d: index
          };
        }),
        m: common_vendor.p({
          title: "学习统计",
          type: "line",
          padding: true
        }),
        n: common_vendor.f(menuItems, (menu, index, i0) => {
          return {
            a: "dd383ca2-9-" + i0 + "," + ("dd383ca2-8-" + i0),
            b: common_vendor.p({
              type: menu.icon,
              size: "20",
              color: "#fff"
            }),
            c: menu.color,
            d: index,
            e: common_vendor.o(($event) => handleMenuClick(menu), index),
            f: "dd383ca2-8-" + i0 + ",dd383ca2-7",
            g: common_vendor.p({
              title: menu.title,
              rightText: menu.rightText,
              clickable: true
            })
          };
        }),
        o: common_vendor.p({
          title: "功能菜单",
          type: "line",
          padding: true
        }),
        p: common_vendor.f(settingItems, (setting, index, i0) => {
          return {
            a: "dd383ca2-13-" + i0 + "," + ("dd383ca2-12-" + i0),
            b: common_vendor.p({
              type: setting.icon,
              size: "20",
              color: "#666"
            }),
            c: "dd383ca2-14-" + i0 + "," + ("dd383ca2-12-" + i0),
            d: index,
            e: common_vendor.o(($event) => handleSettingClick(setting), index),
            f: "dd383ca2-12-" + i0 + ",dd383ca2-11",
            g: common_vendor.p({
              title: setting.title,
              note: setting.note,
              clickable: true
            })
          };
        }),
        q: common_vendor.p({
          type: "arrowright",
          size: "16",
          color: "#ccc"
        }),
        r: common_vendor.p({
          title: "设置",
          type: "line",
          padding: true
        }),
        s: common_vendor.t(common_vendor.unref(authStore).isAuthenticated ? "退出登录" : "立即登录"),
        t: !common_vendor.unref(authStore).isAuthenticated ? 1 : "",
        v: common_vendor.o(handleLogout),
        w: common_vendor.o(onTabChange),
        x: common_vendor.p({
          current: 3
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-dd383ca2"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profile.js.map
