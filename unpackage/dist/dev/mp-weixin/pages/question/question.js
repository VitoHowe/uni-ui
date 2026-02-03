"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_subject = require("../../utils/subject.js");
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
        key: "real",
        name: "真题练习",
        description: "历年考试真题，贴近实际考试",
        icon: "fire",
        color: "#dc3545",
        count: 1200
      },
      {
        key: "mock",
        name: "模拟考试",
        description: "完整模拟考试，检验学习成果",
        icon: "calendar",
        color: "#007AFF",
        count: 150
      },
      {
        key: "special",
        name: "专项训练",
        description: "针对性练习，突破薄弱环节",
        icon: "gear",
        color: "#28a745",
        count: 800
      },
      {
        key: "random",
        name: "随机练习",
        description: "随机抽取题目，全面复习",
        icon: "loop",
        color: "#ffc107",
        count: 500
      }
    ]);
    const subjects = common_vendor.ref([]);
    const selectedSubject = common_vendor.ref(utils_subject.SubjectStorage.get());
    const loadingSubjects = common_vendor.ref(false);
    const syncSelectedSubject = (subject) => {
      selectedSubject.value = subject;
      utils_subject.SubjectStorage.set(subject);
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
        common_vendor.index.__f__("error", "at pages/question/question.vue:185", "获取科目失败:", error);
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
    common_vendor.onShow(() => {
      const stored = utils_subject.SubjectStorage.get();
      if (stored) {
        selectedSubject.value = stored;
      }
      fetchSubjects();
    });
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
      var _a, _b;
      if (!ensureSubjectSelected())
        return;
      const subjectId = (_a = selectedSubject.value) == null ? void 0 : _a.id;
      const subjectName = ((_b = selectedSubject.value) == null ? void 0 : _b.name) || "";
      switch (mode.key) {
        case "mock":
          common_vendor.index.navigateTo({
            url: `/pages/exam-list/exam-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        case "real":
          common_vendor.index.navigateTo({
            url: `/pages/real-exam-list/real-exam-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        case "special":
          common_vendor.index.navigateTo({
            url: `/pages/special-list/special-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        case "random":
          common_vendor.index.navigateTo({
            url: `/pages/exam/exam?mode=random&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
          });
          return;
        default:
          common_vendor.index.showToast({
            title: `开始${mode.name}`,
            icon: "none"
          });
      }
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
      if (!ensureSubjectSelected())
        return;
      common_vendor.index.showToast({
        title: "开始快速练习",
        icon: "none"
      });
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pages/question/question.vue:344", "切换到tab:", index);
    };
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
        e: common_vendor.f(practiceModes, (mode, index, i0) => {
          return {
            a: "a6df9a91-2-" + i0 + ",a6df9a91-1",
            b: common_vendor.p({
              type: mode.icon,
              size: "22",
              color: "#fff"
            }),
            c: mode.color,
            d: common_vendor.t(mode.name),
            e: common_vendor.t(mode.description),
            f: common_vendor.t(mode.count),
            g: "a6df9a91-3-" + i0 + ",a6df9a91-1",
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
        h: common_vendor.t(wrongQuestions.length),
        i: common_vendor.o(clearWrongQuestions),
        j: wrongQuestions.length > 0
      }, wrongQuestions.length > 0 ? {
        k: common_vendor.f(wrongQuestions, (question, index, i0) => {
          return {
            a: "a6df9a91-7-" + i0 + "," + ("a6df9a91-6-" + i0),
            b: index,
            c: common_vendor.o(($event) => reviewQuestion(), index),
            d: "a6df9a91-6-" + i0 + ",a6df9a91-5",
            e: common_vendor.p({
              title: question.title,
              note: question.type,
              rightText: question.date,
              clickable: true
            })
          };
        }),
        l: common_vendor.p({
          type: "closeempty",
          size: "18",
          color: "#dc3545"
        })
      } : {
        m: common_vendor.p({
          type: "checkmarkempty",
          size: "48",
          color: "#28a745"
        })
      }, {
        n: common_vendor.p({
          title: "错题本",
          type: "line",
          padding: true
        }),
        o: common_vendor.o(fabClick),
        p: common_vendor.p({
          pattern: fabPattern,
          content: fabContent,
          direction: "vertical"
        }),
        q: common_vendor.o(onTabChange),
        r: common_vendor.p({
          current: 2
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a6df9a91"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/question/question.js.map
