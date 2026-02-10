"use strict";
const common_vendor = require("../../../common/vendor.js");
const utils_request = require("../../../utils/request.js");
const pkgExam_utils_subject = require("../../utils/subject.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_fab2 = common_vendor.resolveComponent("uni-fab");
  (_easycom_uni_icons2 + _easycom_uni_section2 + _easycom_uni_fab2)();
}
const _easycom_uni_icons = () => "../../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_fab = () => "../../../uni_modules/uni-fab/components/uni-fab/uni-fab.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_section + _easycom_uni_fab + CustomTabBar)();
}
const CustomTabBar = () => "../../../components/CustomTabBar.js";
const _sfc_main = {
  __name: "question",
  setup(__props) {
    const practiceModes = common_vendor.reactive([
      {
        key: "real",
        name: "真题练习",
        description: "历年考试真题，贴近实际考试",
        icon: "fire",
        color: "#EF4444",
        count: 0
      },
      {
        key: "mock",
        name: "模拟考试",
        description: "完整模拟考试，检验学习成果",
        icon: "calendar",
        color: "#3B82F6",
        count: 0
      },
      {
        key: "special",
        name: "专项训练",
        description: "针对性练习，突破薄弱环节",
        icon: "gear",
        color: "#10B981",
        count: 0
      },
      {
        key: "random",
        name: "随机练习",
        description: "随机抽取题目，全面复习",
        icon: "loop",
        color: "#F59E0B",
        count: 0
      }
    ]);
    const subjects = common_vendor.ref([]);
    const selectedSubject = common_vendor.ref(pkgExam_utils_subject.SubjectStorage.get());
    const loadingSubjects = common_vendor.ref(false);
    const wrongSetCount = common_vendor.ref(0);
    const loadingSummary = common_vendor.ref(false);
    const syncSelectedSubject = (subject) => {
      selectedSubject.value = subject;
      pkgExam_utils_subject.SubjectStorage.set(subject);
    };
    const applyModeCounts = (counts) => {
      practiceModes.forEach((mode) => {
        if (counts && counts[mode.key] !== void 0) {
          mode.count = Number(counts[mode.key]) || 0;
        }
      });
    };
    const fetchPracticeSummary = async () => {
      if (!selectedSubject.value || loadingSummary.value)
        return;
      loadingSummary.value = true;
      try {
        const data = await utils_request.get("/practice/summary", { subjectId: selectedSubject.value.id }, { showLoading: false });
        const modeCounts = data.mode_counts || {};
        applyModeCounts(modeCounts);
        wrongSetCount.value = Number(data.wrong_set_count || 0);
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/question/question.vue:146", "获取练习统计失败:", error);
      } finally {
        loadingSummary.value = false;
      }
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
        await fetchPracticeSummary();
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/question/question.vue:176", "获取科目失败:", error);
        common_vendor.index.showToast({
          title: error.message || "获取科目失败",
          icon: "none"
        });
      } finally {
        loadingSubjects.value = false;
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
        success: (res) => {
          const subject = subjects.value[res.tapIndex];
          if (subject) {
            syncSelectedSubject(subject);
            fetchPracticeSummary();
          }
        }
      });
    };
    const ensureSubjectSelected = () => {
      if (selectedSubject.value)
        return true;
      common_vendor.index.showToast({
        title: "请先选择科目",
        icon: "none"
      });
      openSubjectPicker();
      return false;
    };
    const openWrongSet = () => {
      var _a, _b;
      if (!ensureSubjectSelected())
        return;
      const subjectId = ((_a = selectedSubject.value) == null ? void 0 : _a.id) || 0;
      const subjectName = ((_b = selectedSubject.value) == null ? void 0 : _b.name) || "";
      common_vendor.index.navigateTo({
        url: `/pkg-exam/pages/wrong-set/wrong-set?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
      });
    };
    common_vendor.onShow(() => {
      const stored = pkgExam_utils_subject.SubjectStorage.get();
      if (stored) {
        selectedSubject.value = stored;
      }
      fetchSubjects();
    });
    const fabPattern = common_vendor.reactive({
      color: "#3B82F6",
      backgroundColor: "#fff",
      selectedColor: "#2563EB"
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
      var _a, _b;
      if (!ensureSubjectSelected())
        return;
      const subjectId = (_a = selectedSubject.value) == null ? void 0 : _a.id;
      const subjectName = ((_b = selectedSubject.value) == null ? void 0 : _b.name) || "";
      switch (mode.key) {
        case "mock":
          common_vendor.index.navigateTo({
            url: `/pkg-exam/pages/exam-list/exam-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        case "real":
          common_vendor.index.navigateTo({
            url: `/pkg-exam/pages/real-exam-list/real-exam-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        case "special":
          common_vendor.index.navigateTo({
            url: `/pkg-exam/pages/special-list/special-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        case "random":
          common_vendor.index.navigateTo({
            url: `/pkg-exam/pages/exam/exam?mode=random&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        default:
          common_vendor.index.showToast({
            title: `开始${mode.name}`,
            icon: "none"
          });
      }
    };
    const fabClick = (e) => {
      if (!ensureSubjectSelected())
        return;
      common_vendor.index.showToast({
        title: "开始快速练习",
        icon: "none"
      });
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pkg-exam/pages/question/question.vue:300", "切换到tab:", index);
    };
    return (_ctx, _cache) => {
      var _a;
      return {
        a: common_vendor.t(((_a = selectedSubject.value) == null ? void 0 : _a.name) || "请选择科目"),
        b: common_vendor.t(subjects.value.length ? "切换" : "加载中"),
        c: common_vendor.p({
          type: "arrowdown",
          size: "16",
          color: "#999"
        }),
        d: common_vendor.o(openSubjectPicker),
        e: common_vendor.f(practiceModes, (mode, index, i0) => {
          return {
            a: "bca3e236-2-" + i0 + ",bca3e236-1",
            b: common_vendor.p({
              type: mode.icon,
              size: "22",
              color: "#fff"
            }),
            c: mode.color,
            d: common_vendor.t(mode.name),
            e: common_vendor.t(mode.description),
            f: common_vendor.t(mode.count),
            g: "bca3e236-3-" + i0 + ",bca3e236-1",
            h: index,
            i: common_vendor.o(($event) => startPractice(mode), index)
          };
        }),
        f: common_vendor.p({
          type: "arrowright",
          size: "16",
          color: "#ccc"
        }),
        g: common_vendor.p({
          title: "练习模式",
          type: "line",
          padding: true
        }),
        h: common_vendor.t(wrongSetCount.value),
        i: common_vendor.o(openWrongSet),
        j: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#dc3545"
        }),
        k: common_vendor.p({
          type: "arrowright",
          size: "16",
          color: "#ccc"
        }),
        l: common_vendor.o(openWrongSet),
        m: common_vendor.p({
          title: "错题集",
          type: "line",
          padding: true
        }),
        n: common_vendor.o(fabClick),
        o: common_vendor.p({
          pattern: fabPattern,
          content: fabContent,
          direction: "vertical"
        }),
        p: common_vendor.o(onTabChange),
        q: common_vendor.p({
          current: 2
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bca3e236"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pkg-exam/pages/question/question.js.map
