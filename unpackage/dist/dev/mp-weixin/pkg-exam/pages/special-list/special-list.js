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
const _sfc_main = {
  __name: "special-list",
  setup(__props) {
    const chapters = common_vendor.ref([]);
    const loading = common_vendor.ref(false);
    const subjects = common_vendor.ref([]);
    const selectedSubject = common_vendor.ref(pkgExam_utils_subject.SubjectStorage.get());
    const loadingSubjects = common_vendor.ref(false);
    const progressMap = common_vendor.ref({});
    const practiceStats = common_vendor.ref({
      answered_count: 0,
      correct_count: 0,
      wrong_count: 0,
      accuracy: 0
    });
    const syncSelectedSubject = (subject) => {
      selectedSubject.value = subject;
      pkgExam_utils_subject.SubjectStorage.set(subject);
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
    const fetchProgress = async () => {
      if (!ensureSubjectSelected()) {
        progressMap.value = {};
        return;
      }
      try {
        const response = await utils_request.get(`/subjects/${selectedSubject.value.id}/chapters/progress`, {}, { showLoading: false });
        const list = Array.isArray(response) ? response : response.progress || [];
        const nextMap = {};
        list.forEach((item) => {
          if (!item)
            return;
          const percent = item.progress_percentage !== void 0 ? Number(item.progress_percentage) : item.total_questions > 0 ? Math.round(item.completed_count / item.total_questions * 100) : 0;
          nextMap[item.subject_chapter_id] = percent;
        });
        progressMap.value = nextMap;
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/special-list/special-list.vue:126", "获取专项进度失败:", error);
      }
    };
    const getChapterProgress = (chapterId) => {
      var _a;
      const value = ((_a = progressMap.value) == null ? void 0 : _a[chapterId]) || 0;
      return Math.min(Math.max(Number(value), 0), 100);
    };
    const getChapterName = (chapter) => {
      return chapter.display_name || chapter.chapter_name || `章节 ${chapter.id}`;
    };
    const fetchSubjects = async () => {
      if (loadingSubjects.value)
        return;
      loadingSubjects.value = true;
      try {
        const data = await utils_request.get("/subjects");
        const list = (data.subjects || []).map(pkgExam_utils_subject.normalizeSubject);
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
        common_vendor.index.__f__("error", "at pkg-exam/pages/special-list/special-list.vue:161", "获取科目失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取科目失败",
          icon: "none"
        });
      } finally {
        loadingSubjects.value = false;
      }
    };
    const resetPracticeStats = () => {
      practiceStats.value = {
        answered_count: 0,
        correct_count: 0,
        wrong_count: 0,
        accuracy: 0
      };
    };
    const fetchPracticeSummary = async () => {
      if (!ensureSubjectSelected()) {
        resetPracticeStats();
        return;
      }
      try {
        const response = await utils_request.get(
          "/practice/summary",
          { subjectId: selectedSubject.value.id, mode: "special" },
          { showLoading: false }
        );
        practiceStats.value = response.stats || {
          answered_count: 0,
          correct_count: 0,
          wrong_count: 0,
          accuracy: 0
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/special-list/special-list.vue:198", "获取练习统计失败:", error);
        resetPracticeStats();
      }
    };
    const fetchChapters = async () => {
      if (!ensureSubjectSelected()) {
        chapters.value = [];
        return;
      }
      loading.value = true;
      try {
        const response = await utils_request.get(`/subjects/${selectedSubject.value.id}/chapters`);
        chapters.value = response.chapters || [];
        await fetchProgress();
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/special-list/special-list.vue:214", "获取章节失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取章节失败",
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
            await fetchPracticeSummary();
            await fetchChapters();
          }
        }
      });
    };
    const startChapter = (chapter) => {
      var _a, _b;
      const subjectId = ((_a = selectedSubject.value) == null ? void 0 : _a.id) || 0;
      const subjectName = ((_b = selectedSubject.value) == null ? void 0 : _b.name) || "";
      const chapterName = getChapterName(chapter);
      common_vendor.index.navigateTo({
        url: `/pkg-exam/pages/exam/exam?mode=special&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&subjectChapterId=${chapter.id}&chapterName=${encodeURIComponent(chapterName)}`
      });
    };
    common_vendor.onShow(async () => {
      applySubjectFromRoute();
      const stored = pkgExam_utils_subject.SubjectStorage.get();
      if (stored) {
        selectedSubject.value = stored;
      }
      await fetchSubjects();
      await fetchPracticeSummary();
      await fetchChapters();
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
        e: common_vendor.t(practiceStats.value.answered_count),
        f: common_vendor.t(practiceStats.value.accuracy),
        g: common_vendor.t(practiceStats.value.wrong_count),
        h: loading.value
      }, loading.value ? {
        i: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#3B82F6"
        })
      } : chapters.value.length === 0 ? {
        k: common_vendor.p({
          type: "folder-add",
          size: "80",
          color: "#ddd"
        })
      } : {
        l: common_vendor.f(chapters.value, (chapter, k0, i0) => {
          return {
            a: common_vendor.t(getChapterName(chapter)),
            b: common_vendor.t(chapter.question_count || 0),
            c: `${getChapterProgress(chapter.id)}%`,
            d: common_vendor.t(getChapterProgress(chapter.id)),
            e: chapter.id,
            f: common_vendor.o(($event) => startChapter(chapter), chapter.id)
          };
        })
      }, {
        j: chapters.value.length === 0
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-17f58c6b"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pkg-exam/pages/special-list/special-list.js.map
