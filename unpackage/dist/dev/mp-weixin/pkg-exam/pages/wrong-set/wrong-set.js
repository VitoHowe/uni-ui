"use strict";
const common_vendor = require("../../../common/vendor.js");
const utils_request = require("../../../utils/request.js");
const pkgExam_utils_subject = require("../../utils/subject.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const limit = 20;
const _sfc_main = {
  __name: "wrong-set",
  setup(__props) {
    const subject = common_vendor.ref(pkgExam_utils_subject.SubjectStorage.get());
    const wrongQuestions = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const page = common_vendor.ref(1);
    const hasMore = common_vendor.ref(true);
    const modeFilter = common_vendor.ref("all");
    const modeOptions = [
      { label: "全部", value: "all" },
      { label: "真题", value: "real" },
      { label: "模拟", value: "mock" },
      { label: "专项", value: "special" },
      { label: "随机", value: "random" }
    ];
    const modeLabel = (mode) => {
      const map = {
        real: "真题",
        mock: "模拟",
        special: "专项",
        random: "随机"
      };
      return map[mode] || "未知";
    };
    const applySubjectFromRoute = () => {
      var _a, _b;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const subjectId = (_a = currentPage == null ? void 0 : currentPage.options) == null ? void 0 : _a.subjectId;
      const subjectName = (_b = currentPage == null ? void 0 : currentPage.options) == null ? void 0 : _b.subjectName;
      if (subjectId) {
        subject.value = {
          id: Number(subjectId),
          name: subjectName ? decodeURIComponent(subjectName) : `科目 ${subjectId}`,
          code: null
        };
        pkgExam_utils_subject.SubjectStorage.set(subject.value);
      }
    };
    const buildQuery = () => {
      var _a;
      const params = {
        subjectId: ((_a = subject.value) == null ? void 0 : _a.id) || 0,
        page: page.value,
        limit
      };
      if (modeFilter.value !== "all") {
        params.mode = modeFilter.value;
      }
      return params;
    };
    const fetchWrongQuestions = async (reset = false) => {
      var _a;
      if (!((_a = subject.value) == null ? void 0 : _a.id))
        return;
      if (loading.value)
        return;
      if (!hasMore.value && !reset)
        return;
      if (reset) {
        page.value = 1;
        wrongQuestions.value = [];
        hasMore.value = true;
      }
      loading.value = true;
      try {
        const response = await utils_request.get("/practice/wrong-questions", buildQuery(), { showLoading: false });
        const items = response.items || [];
        wrongQuestions.value = reset ? items : wrongQuestions.value.concat(items);
        const total = response.total || 0;
        hasMore.value = wrongQuestions.value.length < total;
        page.value += 1;
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/wrong-set/wrong-set.vue:135", "获取错题集失败:", error);
      } finally {
        loading.value = false;
      }
    };
    const selectMode = async (mode) => {
      if (modeFilter.value === mode)
        return;
      modeFilter.value = mode;
      await fetchWrongQuestions(true);
    };
    const loadMore = async () => {
      await fetchWrongQuestions(false);
    };
    const removeWrong = (item) => {
      common_vendor.index.showModal({
        title: "移除错题",
        content: "确定要移除此错题吗？",
        success: async (res) => {
          if (!res.confirm)
            return;
          try {
            await utils_request.del(`/practice/wrong-questions/${item.id}`, { showLoading: false });
            wrongQuestions.value = wrongQuestions.value.filter((q) => q.id !== item.id);
          } catch (error) {
            common_vendor.index.__f__("error", "at pkg-exam/pages/wrong-set/wrong-set.vue:161", "移除错题失败:", error);
            common_vendor.index.showToast({
              title: error.message || "移除失败",
              icon: "none"
            });
          }
        }
      });
    };
    const getContentPreview = (content) => {
      if (!content)
        return "";
      const text = String(content).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return text.length > 80 ? `${text.slice(0, 80)}...` : text;
    };
    common_vendor.onShow(async () => {
      applySubjectFromRoute();
      await fetchWrongQuestions(true);
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = subject.value) == null ? void 0 : _a.name) || "未选择科目"),
        b: common_vendor.f(modeOptions, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.label),
            b: item.value,
            c: modeFilter.value === item.value ? 1 : "",
            d: common_vendor.o(($event) => selectMode(item.value), item.value)
          };
        }),
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
          color: "#ddd"
        })
      } : {
        g: common_vendor.f(wrongQuestions.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(modeLabel(item.mode)),
            b: common_vendor.t(item.source_name || "未知来源"),
            c: common_vendor.t(getContentPreview(item.content)),
            d: common_vendor.t(item.wrong_times || 0),
            e: common_vendor.t(item.correct_streak || 0),
            f: common_vendor.o(($event) => removeWrong(item), item.id),
            g: item.id
          };
        })
      }, {
        e: wrongQuestions.value.length === 0,
        h: hasMore.value && wrongQuestions.value.length > 0
      }, hasMore.value && wrongQuestions.value.length > 0 ? {
        i: common_vendor.o(loadMore)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c835b2fb"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pkg-exam/pages/wrong-set/wrong-set.js.map
