"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_subject = require("../../utils/subject.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "real-exam-list",
  setup(__props) {
    const papers = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const subjects = common_vendor.ref([]);
    const selectedSubject = common_vendor.ref(utils_subject.SubjectStorage.get());
    const loadingSubjects = common_vendor.ref(false);
    const syncSelectedSubject = (subject) => {
      selectedSubject.value = subject;
      utils_subject.SubjectStorage.set(subject);
    };
    const applySubjectFromRoute = () => {
      var _a, _b;
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const subjectId = (_a = currentPage == null ? void 0 : currentPage.options) == null ? void 0 : _a.subjectId;
      const subjectName = (_b = currentPage == null ? void 0 : currentPage.options) == null ? void 0 : _b.subjectName;
      if (subjectId) {
        syncSelectedSubject({
          id: Number(subjectId),
          name: subjectName ? decodeURIComponent(subjectName) : `科目 ${subjectId}`,
          code: null
        });
      }
    };
    const ensureSubjectSelected = () => {
      if (selectedSubject.value)
        return true;
      common_vendor.index.showToast({
        title: "请先选择科目",
        icon: "none"
      });
      return false;
    };
    const fetchSubjects = async () => {
      if (loadingSubjects.value)
        return;
      loadingSubjects.value = true;
      try {
        const data = await utils_request.get("/subjects");
        const list = (data.subjects || []).map(utils_subject.normalizeSubject);
        subjects.value = list;
        if (!selectedSubject.value && list.length) {
          syncSelectedSubject(list[0]);
          return;
        }
        if (selectedSubject.value) {
          const matched = list.find((item) => item.id === selectedSubject.value.id);
          if (matched) {
            syncSelectedSubject(matched);
          } else if (list.length) {
            syncSelectedSubject(list[0]);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/real-exam-list/real-exam-list.vue:105", "获取科目失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取科目失败",
          icon: "none"
        });
      } finally {
        loadingSubjects.value = false;
      }
    };
    const fetchPapers = async () => {
      if (!ensureSubjectSelected()) {
        papers.value = [];
        return;
      }
      loading.value = true;
      try {
        const response = await utils_request.get("/real-exams", {
          subjectId: selectedSubject.value.id,
          page: 1,
          limit: 20
        });
        papers.value = response.papers || [];
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/real-exam-list/real-exam-list.vue:129", "获取真题失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取真题失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const openSubjectPicker = () => {
      if (loadingSubjects.value)
        return;
      if (!subjects.value.length) {
        common_vendor.index.showToast({
          title: "暂无可选科目",
          icon: "none"
        });
        return;
      }
      common_vendor.index.showActionSheet({
        itemList: subjects.value.map((item) => item.name),
        success: async (res) => {
          const subject = subjects.value[res.tapIndex];
          if (subject) {
            syncSelectedSubject(subject);
            await fetchPapers();
          }
        }
      });
    };
    const startPaper = (paper) => {
      var _a, _b;
      const subjectId = ((_a = selectedSubject.value) == null ? void 0 : _a.id) || 0;
      const subjectName = ((_b = selectedSubject.value) == null ? void 0 : _b.name) || "";
      const paperName = paper.name || "";
      common_vendor.index.navigateTo({
        url: `/pages/exam/exam?mode=real&paperId=${paper.id}&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&paperName=${encodeURIComponent(paperName)}`
      });
    };
    const formatDate = (dateStr) => {
      if (!dateStr)
        return "";
      return new Date(dateStr).toLocaleDateString();
    };
    common_vendor.onShow(async () => {
      applySubjectFromRoute();
      const stored = utils_subject.SubjectStorage.get();
      if (stored) {
        selectedSubject.value = stored;
      }
      await fetchSubjects();
      await fetchPapers();
    });
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.t(((_a = selectedSubject.value) == null ? void 0 : _a.name) || "请选择科目"),
        b: common_vendor.t(subjects.value.length ? "切换" : "加载中"),
        c: common_vendor.p({
          type: "arrowdown",
          size: "16",
          color: "#999"
        }),
        d: common_vendor.o(openSubjectPicker),
        e: loading.value
      }, loading.value ? {
        f: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#007AFF"
        })
      } : papers.value.length === 0 ? {
        h: common_vendor.p({
          type: "folder-add",
          size: "80",
          color: "#ddd"
        })
      } : {
        i: common_vendor.f(papers.value, (paper, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(paper.name),
            b: common_vendor.t(paper.total_questions || 0),
            c: paper.description
          }, paper.description ? {
            d: common_vendor.t(paper.description)
          } : {}, {
            e: common_vendor.t(formatDate(paper.created_at)),
            f: paper.id,
            g: common_vendor.o(($event) => startPaper(paper), paper.id)
          });
        })
      }, {
        g: papers.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-5e01ac4d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/real-exam-list/real-exam-list.js.map
