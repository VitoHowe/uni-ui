"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_fab2 = common_vendor.resolveComponent("uni-fab");
  (_easycom_uni_icons2 + _easycom_uni_section2 + _easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_fab2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_fab = () => "../../uni_modules/uni-fab/components/uni-fab/uni-fab.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_section + _easycom_uni_list_item + _easycom_uni_list + _easycom_uni_fab + CustomTabBar)();
}
const CustomTabBar = () => "../../components/CustomTabBar.js";
const _sfc_main = {
  __name: "question",
  setup(__props) {
    const practiceModes = common_vendor.reactive([
      {
        name: "真题练习",
        description: "历年考试真题，贴近实际考试",
        icon: "fire",
        color: "#dc3545",
        count: 1200
      },
      {
        name: "模拟考试",
        description: "完整模拟考试，检验学习成果",
        icon: "calendar",
        color: "#007AFF",
        count: 150
      },
      {
        name: "专项训练",
        description: "针对性练习，突破薄弱环节",
        icon: "gear",
        color: "#28a745",
        count: 800
      },
      {
        name: "随机练习",
        description: "随机抽取题目，全面复习",
        icon: "loop",
        color: "#ffc107",
        count: 500
      }
    ]);
    const wrongQuestions = common_vendor.reactive([
      {
        title: "关于项目章程的描述，以下哪项是错误的？",
        type: "单选题",
        date: "2天前"
      },
      {
        title: "项目范围说明书不包括以下哪项内容？",
        type: "单选题",
        date: "3天前"
      },
      {
        title: "在进行风险定性分析时，主要考虑的因素包括...",
        type: "多选题",
        date: "5天前"
      }
    ]);
    const fabPattern = common_vendor.reactive({
      color: "#007AFF",
      backgroundColor: "#fff",
      selectedColor: "#007AFF"
    });
    const fabContent = common_vendor.reactive([
      {
        iconPath: "/static/c1.png",
        selectedIconPath: "/static/c1.png",
        text: "快速练习",
        active: false
      }
    ]);
    const startPractice = (mode) => {
      if (mode.name === "模拟考试") {
        common_vendor.index.navigateTo({
          url: "/pages/exam-list/exam-list"
        });
        return;
      }
      common_vendor.index.showToast({
        title: `开始${mode.name}`,
        icon: "none"
      });
    };
    const reviewQuestion = (question) => {
      common_vendor.index.showToast({
        title: "查看错题详情",
        icon: "none"
      });
    };
    const clearWrongQuestions = () => {
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空所有错题吗？",
        success: (res) => {
          if (res.confirm) {
            wrongQuestions.splice(0);
            common_vendor.index.showToast({
              title: "已清空错题本",
              icon: "success"
            });
          }
        }
      });
    };
    const fabClick = (e) => {
      common_vendor.index.showToast({
        title: "开始快速练习",
        icon: "none"
      });
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pages/question/question.vue:222", "切换到tab:", index);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(practiceModes, (mode, index, i0) => {
          return {
            a: "a6df9a91-1-" + i0 + ",a6df9a91-0",
            b: common_vendor.p({
              type: mode.icon,
              size: "22",
              color: "#fff"
            }),
            c: mode.color,
            d: common_vendor.t(mode.name),
            e: common_vendor.t(mode.description),
            f: common_vendor.t(mode.count),
            g: "a6df9a91-2-" + i0 + ",a6df9a91-0",
            h: index,
            i: common_vendor.o(($event) => startPractice(mode), index)
          };
        }),
        b: common_vendor.p({
          type: "arrowright",
          size: "16",
          color: "#ccc"
        }),
        c: common_vendor.p({
          title: "练习模式",
          type: "line",
          padding: true
        }),
        d: common_vendor.t(wrongQuestions.length),
        e: common_vendor.o(clearWrongQuestions),
        f: wrongQuestions.length > 0
      }, wrongQuestions.length > 0 ? {
        g: common_vendor.f(wrongQuestions, (question, index, i0) => {
          return {
            a: "a6df9a91-6-" + i0 + "," + ("a6df9a91-5-" + i0),
            b: index,
            c: common_vendor.o(($event) => reviewQuestion(), index),
            d: "a6df9a91-5-" + i0 + ",a6df9a91-4",
            e: common_vendor.p({
              title: question.title,
              note: question.type,
              rightText: question.date,
              clickable: true
            })
          };
        }),
        h: common_vendor.p({
          type: "closeempty",
          size: "18",
          color: "#dc3545"
        })
      } : {
        i: common_vendor.p({
          type: "checkmarkempty",
          size: "48",
          color: "#28a745"
        })
      }, {
        j: common_vendor.p({
          title: "错题本",
          type: "line",
          padding: true
        }),
        k: common_vendor.o(fabClick),
        l: common_vendor.p({
          pattern: fabPattern,
          content: fabContent,
          direction: "vertical"
        }),
        m: common_vendor.o(onTabChange),
        n: common_vendor.p({
          current: 2
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a6df9a91"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/question/question.js.map
