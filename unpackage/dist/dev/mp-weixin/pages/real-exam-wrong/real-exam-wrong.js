"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "real-exam-wrong",
  setup(__props) {
    const wrongQuestions = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const paperId = common_vendor.ref(0);
    const paperName = common_vendor.ref("");
    const fetchWrongQuestions = async () => {
      if (!paperId.value)
        return;
      loading.value = true;
      try {
        const response = await utils_request.get(`/real-exams/${paperId.value}/wrong-questions`);
        wrongQuestions.value = response.questions || [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/real-exam-wrong/real-exam-wrong.vue:56", "获取错题失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取错题失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const getTypeLabel = (type) => {
      const typeMap = {
        single: "单选题",
        multiple: "多选题",
        judge: "判断题",
        fill: "填空题",
        essay: "简答题"
      };
      return typeMap[type] || "未知题型";
    };
    const formatAnswer = (answer) => {
      if (!answer)
        return "";
      if (Array.isArray(answer)) {
        return answer.sort().join("");
      }
      return answer.toString().toUpperCase();
    };
    common_vendor.onShow(async () => {
      var _a, _b;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      paperId.value = parseInt((_a = currentPage == null ? void 0 : currentPage.options) == null ? void 0 : _a.paperId) || 0;
      paperName.value = ((_b = currentPage == null ? void 0 : currentPage.options) == null ? void 0 : _b.paperName) ? decodeURIComponent(currentPage.options.paperName) : "";
      await fetchWrongQuestions();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(paperName.value || "真题错题"),
        b: common_vendor.t(wrongQuestions.value.length),
        c: loading.value
      }, loading.value ? {
        d: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#dc3545"
        })
      } : wrongQuestions.value.length === 0 ? {
        f: common_vendor.p({
          type: "checkmarkempty",
          size: "80",
          color: "#28a745"
        })
      } : {
        g: common_vendor.f(wrongQuestions.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.question_no),
            b: common_vendor.t(getTypeLabel(item.type)),
            c: common_vendor.t(item.content),
            d: common_vendor.t(formatAnswer(item.selected_answer) || "-"),
            e: common_vendor.t(formatAnswer(item.correct_answer || item.answer)),
            f: item.question_id
          };
        })
      }, {
        e: wrongQuestions.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-75e4aea9"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/real-exam-wrong/real-exam-wrong.js.map
