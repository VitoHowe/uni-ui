"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_counter = require("../../stores/counter.js");
if (!Array) {
  const _component_uni_progress = common_vendor.resolveComponent("uni-progress");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_component_uni_progress + _easycom_uni_section2 + _easycom_uni_icons2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_section + _easycom_uni_icons + _easycom_uni_list_item + _easycom_uni_list + CustomTabBar)();
}
const CustomTabBar = () => "../../components/CustomTabBar.js";
const _sfc_main = {
  __name: "index",
  setup(__props) {
    stores_counter.useCounterStore();
    const examCountdown = common_vendor.reactive({
      days: 158
      // 这里可以根据实际考试日期计算
    });
    const overallProgress = common_vendor.ref(68);
    const progressStats = common_vendor.reactive([
      { label: "已学章节", value: "18/26" },
      { label: "练习题数", value: "523" },
      { label: "正确率", value: "87%" }
    ]);
    const dailyQuestion = common_vendor.reactive({
      content: "项目章程的主要作用不包括以下哪一项？",
      type: "单选题",
      points: 5
    });
    const quickActions = common_vendor.reactive([
      { name: "继续学习", icon: "book", color: "#007AFF", action: "continue_study" },
      { name: "模拟考试", icon: "calendar", color: "#28a745", action: "mock_exam" },
      { name: "错题本", icon: "closeempty", color: "#dc3545", action: "wrong_questions" },
      { name: "学习笔记", icon: "compose", color: "#ffc107", action: "study_notes" },
      { name: "学习计划", icon: "gear", color: "#6610f2", action: "study_plan" },
      { name: "收藏夹", icon: "star", color: "#fd7e14", action: "favorites" }
    ]);
    const studyUpdates = common_vendor.reactive([
      {
        title: "完成学习",
        content: "项目整合管理 - 制定项目章程",
        time: "2小时前",
        icon: "checkmarkempty",
        color: "#28a745"
      },
      {
        title: "练习题目",
        content: "完成项目管理基础专项练习 20题",
        time: "昨天",
        icon: "compose",
        color: "#007AFF"
      },
      {
        title: "学习提醒",
        content: "今日学习目标：完成项目范围管理章节",
        time: "今天",
        icon: "sound",
        color: "#ffc107"
      }
    ]);
    const openDailyQuestion = () => {
      common_vendor.index.showToast({
        title: "打开每日一题",
        icon: "none"
      });
    };
    const handleActionClick = (action) => {
      switch (action.action) {
        case "continue_study":
          common_vendor.index.navigateTo({ url: "/pages/study/study" });
          break;
        case "mock_exam":
          common_vendor.index.navigateTo({ url: "/pages/question/question" });
          break;
        case "wrong_questions":
          common_vendor.index.showToast({ title: "错题本", icon: "none" });
          break;
        case "study_notes":
          common_vendor.index.showToast({ title: "学习笔记", icon: "none" });
          break;
        case "study_plan":
          common_vendor.index.showToast({ title: "学习计划", icon: "none" });
          break;
        case "favorites":
          common_vendor.index.showToast({ title: "收藏夹", icon: "none" });
          break;
      }
    };
    const viewUpdate = (update) => {
      common_vendor.index.showToast({
        title: `查看：${update.title}`,
        icon: "none"
      });
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pages/index/index.vue:224", "切换到tab:", index);
    };
    common_vendor.onMounted(() => {
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.t(examCountdown.days),
        b: common_vendor.p({
          percent: overallProgress.value,
          ["show-info"]: true,
          color: "#007AFF",
          ["stroke-width"]: "8"
        }),
        c: common_vendor.f(progressStats, (stat, index, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: common_vendor.t(stat.label),
            c: index
          };
        }),
        d: common_vendor.p({
          title: "学习进度",
          type: "line",
          padding: true
        }),
        e: common_vendor.t(dailyQuestion.content),
        f: common_vendor.p({
          type: "arrowright",
          size: "16",
          color: "#007AFF"
        }),
        g: common_vendor.o(openDailyQuestion),
        h: common_vendor.p({
          title: "每日一题",
          type: "line",
          padding: true
        }),
        i: common_vendor.f(quickActions, (action, index, i0) => {
          return {
            a: "1cf27b2a-5-" + i0 + ",1cf27b2a-4",
            b: common_vendor.p({
              type: action.icon,
              size: "24",
              color: "#fff"
            }),
            c: action.color,
            d: common_vendor.t(action.name),
            e: index,
            f: common_vendor.o(($event) => handleActionClick(action), index)
          };
        }),
        j: common_vendor.p({
          title: "快捷功能",
          type: "line",
          padding: true
        }),
        k: common_vendor.f(studyUpdates, (update, index, i0) => {
          return {
            a: "1cf27b2a-9-" + i0 + "," + ("1cf27b2a-8-" + i0),
            b: common_vendor.p({
              type: update.icon,
              size: "18",
              color: "#fff"
            }),
            c: update.color,
            d: index,
            e: common_vendor.o(($event) => viewUpdate(update), index),
            f: "1cf27b2a-8-" + i0 + ",1cf27b2a-7",
            g: common_vendor.p({
              title: update.title,
              note: update.content,
              rightText: update.time,
              clickable: true
            })
          };
        }),
        l: common_vendor.p({
          title: "学习动态",
          type: "line",
          padding: true
        }),
        m: common_vendor.o(onTabChange),
        n: common_vendor.p({
          current: 0
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
