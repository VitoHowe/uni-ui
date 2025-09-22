"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _component_uni_progress = common_vendor.resolveComponent("uni-progress");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_component_uni_progress + _easycom_uni_icons2 + _easycom_uni_section2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_section + _easycom_uni_list_item + _easycom_uni_list + CustomTabBar)();
}
const CustomTabBar = () => "../../components/CustomTabBar.js";
const _sfc_main = {
  __name: "study",
  setup(__props) {
    const studyModules = common_vendor.reactive([
      { name: "项目管理基础", icon: "home", color: "#007AFF", progress: 85 },
      { name: "项目整合管理", icon: "gear", color: "#28a745", progress: 72 },
      { name: "项目范围管理", icon: "list", color: "#ffc107", progress: 45 },
      { name: "项目进度管理", icon: "calendar", color: "#dc3545", progress: 30 },
      { name: "项目成本管理", icon: "wallet", color: "#6610f2", progress: 15 },
      { name: "项目质量管理", icon: "checkmarkempty", color: "#fd7e14", progress: 0 }
    ]);
    const recentStudy = common_vendor.reactive([
      {
        title: "项目章程制定",
        description: "学习如何制定项目章程，明确项目目标...",
        date: "今天"
      },
      {
        title: "工作分解结构",
        description: "WBS的创建方法和实践技巧...",
        date: "昨天"
      },
      {
        title: "风险识别技术",
        description: "项目风险识别的常用方法和工具...",
        date: "2天前"
      }
    ]);
    const enterModule = (module) => {
      common_vendor.index.showToast({
        title: `进入${module.name}`,
        icon: "none"
      });
    };
    const continueStudy = (item) => {
      common_vendor.index.showToast({
        title: `继续学习：${item.title}`,
        icon: "none"
      });
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pages/study/study.vue:112", "切换到tab:", index);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          percent: 68,
          color: "#007AFF",
          ["stroke-width"]: "8"
        }),
        b: common_vendor.f(studyModules, (module, index, i0) => {
          return {
            a: "3f273c1e-2-" + i0 + ",3f273c1e-1",
            b: common_vendor.p({
              type: module.icon,
              size: "24",
              color: "#fff"
            }),
            c: module.color,
            d: common_vendor.t(module.name),
            e: common_vendor.t(module.progress),
            f: "3f273c1e-3-" + i0 + ",3f273c1e-1",
            g: common_vendor.p({
              percent: module.progress,
              color: module.color,
              ["stroke-width"]: "4"
            }),
            h: index,
            i: common_vendor.o(($event) => enterModule(module), index)
          };
        }),
        c: common_vendor.p({
          title: "学习模块",
          type: "line",
          padding: true
        }),
        d: common_vendor.f(recentStudy, (item, index, i0) => {
          return {
            a: "3f273c1e-7-" + i0 + "," + ("3f273c1e-6-" + i0),
            b: index,
            c: common_vendor.o(($event) => continueStudy(item), index),
            d: "3f273c1e-6-" + i0 + ",3f273c1e-5",
            e: common_vendor.p({
              title: item.title,
              note: item.description,
              rightText: item.date,
              clickable: true
            })
          };
        }),
        e: common_vendor.p({
          type: "book",
          size: "20",
          color: "#007AFF"
        }),
        f: common_vendor.p({
          title: "最近学习",
          type: "line",
          padding: true
        }),
        g: common_vendor.o(onTabChange),
        h: common_vendor.p({
          current: 1
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3f273c1e"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/study/study.js.map
