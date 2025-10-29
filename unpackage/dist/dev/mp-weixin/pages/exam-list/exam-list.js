"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_easycom_uni_icons2 + _easycom_uni_popup2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_popup)();
}
const _sfc_main = {
  __name: "exam-list",
  setup(__props) {
    const searchKeyword = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const bankList = common_vendor.ref([]);
    const selectedBank = common_vendor.ref(null);
    const sortOptions = [
      { label: "最新创建", value: "created_desc" },
      { label: "最早创建", value: "created_asc" },
      { label: "题目最多", value: "questions_desc" },
      { label: "题目最少", value: "questions_asc" }
    ];
    const currentSort = common_vendor.ref("created_desc");
    const filterPopup = common_vendor.ref(null);
    const actionPopup = common_vendor.ref(null);
    const modePopup = common_vendor.ref(null);
    const chapterSelectPopup = common_vendor.ref(null);
    const totalBanks = common_vendor.computed(() => bankList.value.length);
    const totalQuestions = common_vendor.computed(() => {
      return bankList.value.reduce((sum, bank) => sum + bank.total_questions, 0);
    });
    const todayAdded = common_vendor.computed(() => {
      const today = (/* @__PURE__ */ new Date()).toDateString();
      return bankList.value.filter((bank) => {
        const bankDate = new Date(bank.created_at).toDateString();
        return bankDate === today;
      }).length;
    });
    const filteredBankList = common_vendor.computed(() => {
      let list = [...bankList.value];
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        list = list.filter(
          (bank) => bank.bank_name.toLowerCase().includes(keyword) || bank.file_name.toLowerCase().includes(keyword)
        );
      }
      list.sort((a, b) => {
        switch (currentSort.value) {
          case "created_desc":
            return new Date(b.created_at) - new Date(a.created_at);
          case "created_asc":
            return new Date(a.created_at) - new Date(b.created_at);
          case "questions_desc":
            return b.total_questions - a.total_questions;
          case "questions_asc":
            return a.total_questions - b.total_questions;
          default:
            return 0;
        }
      });
      return list;
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at pages/exam-list/exam-list.vue:324", "📱 题库列表页面显示，刷新数据...");
      fetchBankList();
    });
    const fetchBankList = async () => {
      var _a;
      loading.value = true;
      try {
        const response = await utils_request.get("/questions/banks");
        const banks = response.banks || [];
        bankList.value = banks.map((bank) => ({
          id: bank.id,
          bank_id: bank.id,
          // 向后兼容
          bank_name: bank.name,
          file_name: bank.file_original_name,
          total_questions: bank.question_count,
          created_at: bank.created_at,
          description: bank.description,
          creator_name: bank.creator_name,
          file_type: bank.file_type,
          file_size: bank.file_size
        }));
        for (const bank of bankList.value) {
          try {
            const chaptersData = await utils_request.get(`/question-banks/${bank.id}/chapters`);
            bank.chapters = chaptersData.chapters || [];
            bank.totalChapters = chaptersData.totalChapters || 0;
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:357", `获取题库${bank.id}章节失败:`, error);
            bank.chapters = [];
            bank.totalChapters = 0;
          }
        }
        for (const bank of bankList.value) {
          try {
            const progressData = await utils_request.get(`/user-progress/${bank.id}/chapters`);
            bank.chapterProgress = progressData || [];
            if (bank.chapterProgress.length > 0) {
              let totalCompleted = 0;
              let totalQuestions2 = 0;
              bank.chapterProgress.forEach((cp) => {
                totalCompleted += cp.completed_count || 0;
                totalQuestions2 += cp.total_questions || 0;
              });
              bank.progress = totalQuestions2 > 0 ? Math.round(totalCompleted / totalQuestions2 * 100) : 0;
              bank.completed_count = totalCompleted;
              const lastStudied = bank.chapterProgress.reduce((latest, current) => {
                if (!latest.last_study_time)
                  return current;
                if (!current.last_study_time)
                  return latest;
                return new Date(current.last_study_time) > new Date(latest.last_study_time) ? current : latest;
              });
              bank.current_chapter_id = lastStudied.chapter_id;
              bank.current_question_number = lastStudied.current_question_number || 0;
              bank.last_study_time = lastStudied.last_study_time;
              common_vendor.index.__f__("log", "at pages/exam-list/exam-list.vue:393", `题库 ${bank.bank_name} 进度:`, {
                id: bank.id,
                chapters: bank.chapterProgress.length,
                completed: totalCompleted,
                total: totalQuestions2,
                progress: bank.progress
              });
            } else {
              bank.progress = 0;
              bank.completed_count = 0;
              bank.current_chapter_id = ((_a = bank.chapters[0]) == null ? void 0 : _a.id) || null;
              bank.current_question_number = 0;
            }
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:407", `获取题库${bank.id}进度失败:`, error);
            bank.progress = 0;
            bank.completed_count = 0;
            bank.chapterProgress = [];
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:414", "获取题库列表失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const getQuestionTypes = (bank) => {
      if (!bank.questions || bank.questions.length === 0) {
        return [];
      }
      const typeMap = {
        "single": { label: "单选", count: 0, type: "single" },
        "multiple": { label: "多选", count: 0, type: "multiple" },
        "judge": { label: "判断", count: 0, type: "judge" },
        "fill": { label: "填空", count: 0, type: "fill" }
      };
      bank.questions.forEach((q) => {
        if (typeMap[q.type]) {
          typeMap[q.type].count++;
        }
      });
      return Object.values(typeMap).filter((type) => type.count > 0);
    };
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const now = /* @__PURE__ */ new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 6e4);
      const hours = Math.floor(diff / 36e5);
      const days = Math.floor(diff / 864e5);
      if (minutes < 1)
        return "刚刚";
      if (minutes < 60)
        return `${minutes}分钟前`;
      if (hours < 24)
        return `${hours}小时前`;
      if (days < 7)
        return `${days}天前`;
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    };
    const handleSearch = () => {
    };
    const clearSearch = () => {
      searchKeyword.value = "";
    };
    const showFilterPopup = () => {
      filterPopup.value.open();
    };
    const selectSort = (value) => {
      currentSort.value = value;
    };
    const resetFilter = () => {
      currentSort.value = "created_desc";
    };
    const applyFilter = () => {
      filterPopup.value.close();
    };
    const getProgressText = (bank) => {
      var _a;
      if (!bank.current_chapter_id || bank.current_question_number === 0) {
        return "尚未开始";
      }
      const chapter = (_a = bank.chapters) == null ? void 0 : _a.find((c) => c.id === bank.current_chapter_id);
      if (chapter) {
        return `${chapter.chapter_name}: 第${bank.current_question_number}题`;
      }
      return `已完成 ${bank.completed_count} 题`;
    };
    const startExam = (bank) => {
      if (!bank.chapters || bank.chapters.length === 0) {
        common_vendor.index.showToast({
          title: "该题库暂无章节",
          icon: "none"
        });
        return;
      }
      selectedBank.value = bank;
      modePopup.value.open();
    };
    const startChapterPractice = () => {
      modePopup.value.close();
      chapterSelectPopup.value.open();
    };
    const startFullPractice = () => {
      var _a;
      modePopup.value.close();
      const bank = selectedBank.value;
      let startChapterId = bank.current_chapter_id || ((_a = bank.chapters[0]) == null ? void 0 : _a.id);
      let startQuestionNumber = 1;
      if (bank.current_chapter_id && bank.current_question_number > 0) {
        const chapterName = getChapterName(bank, bank.current_chapter_id);
        common_vendor.index.showModal({
          title: "继续练习",
          content: `上次学习到「${chapterName}」第${bank.current_question_number}题

是否继续？`,
          confirmText: "继续",
          cancelText: "从头开始",
          success: (res) => {
            var _a2;
            if (res.confirm) {
              startChapterId = bank.current_chapter_id;
              startQuestionNumber = bank.current_question_number;
            } else {
              startChapterId = (_a2 = bank.chapters[0]) == null ? void 0 : _a2.id;
              startQuestionNumber = 1;
            }
            navigateToExam("full", startChapterId, startQuestionNumber);
          }
        });
      } else {
        navigateToExam("full", startChapterId, startQuestionNumber);
      }
    };
    const selectChapterAndStart = (chapter) => {
      var _a;
      chapterSelectPopup.value.close();
      const bank = selectedBank.value;
      const chapterProgress = (_a = bank.chapterProgress) == null ? void 0 : _a.find((cp) => cp.chapter_id === chapter.id);
      let startQuestionNumber = 1;
      if (chapterProgress && chapterProgress.current_question_number > 0) {
        common_vendor.index.showModal({
          title: "继续练习",
          content: `「${chapter.chapter_name}」

上次学习到第${chapterProgress.current_question_number}题
进度：${chapterProgress.progress_percentage}%

是否继续？`,
          confirmText: "继续",
          cancelText: "从头开始",
          success: (res) => {
            if (res.confirm) {
              startQuestionNumber = chapterProgress.current_question_number;
            }
            navigateToExam("chapter", chapter.id, startQuestionNumber);
          }
        });
      } else {
        navigateToExam("chapter", chapter.id, startQuestionNumber);
      }
    };
    const navigateToExam = (mode, chapterId, questionNumber = 1) => {
      const bank = selectedBank.value;
      common_vendor.index.navigateTo({
        url: `/pages/exam/exam?bankId=${bank.id}&mode=${mode}&chapterId=${chapterId}&questionNumber=${questionNumber}`
      });
    };
    const getChapterName = (bank, chapterId) => {
      var _a;
      const chapter = (_a = bank.chapters) == null ? void 0 : _a.find((c) => c.id === chapterId);
      return chapter ? chapter.chapter_name : "";
    };
    const getChapterProgressText = (chapter) => {
      var _a;
      if (!selectedBank.value)
        return "未开始";
      const progress = (_a = selectedBank.value.chapterProgress) == null ? void 0 : _a.find((cp) => cp.chapter_id === chapter.id);
      if (!progress || progress.current_question_number === 0) {
        return "未开始";
      }
      return `${progress.progress_percentage}%`;
    };
    const showMoreActions = (bank) => {
      selectedBank.value = bank;
      actionPopup.value.open();
    };
    const closeActionPopup = () => {
      actionPopup.value.close();
    };
    const shareBank = () => {
      actionPopup.value.close();
      common_vendor.index.showToast({
        title: "分享功能开发中",
        icon: "none"
      });
    };
    const resetBankProgress = () => {
      if (!selectedBank.value)
        return;
      const bank = selectedBank.value;
      actionPopup.value.close();
      common_vendor.index.showModal({
        title: "重置学习进度",
        content: `确定要重置「${bank.bank_name}」的所有章节学习进度吗？

当前整体进度：${bank.progress}%
已完成：${bank.completed_count} 题

重置后将从第一题重新开始，此操作不可恢复。`,
        confirmText: "重置",
        confirmColor: "#ff9500",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "重置中..." });
              await utils_request.del(`/user-progress/${bank.id}`);
              await fetchBankList();
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "重置成功",
                icon: "success",
                duration: 2e3
              });
              common_vendor.index.__f__("log", "at pages/exam-list/exam-list.vue:665", `🔄 题库 ${bank.bank_name} 学习进度已重置`);
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:668", "重置进度失败:", error);
              common_vendor.index.showToast({
                title: error.message || "重置失败",
                icon: "none",
                duration: 2e3
              });
            }
          }
        }
      });
    };
    const goToUpload = () => {
      common_vendor.index.navigateTo({
        url: "/pages/upload/upload"
      });
    };
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.p({
          type: "search",
          size: "18",
          color: "#999"
        }),
        b: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, handleSearch]),
        c: searchKeyword.value,
        d: searchKeyword.value
      }, searchKeyword.value ? {
        e: common_vendor.o(clearSearch),
        f: common_vendor.p({
          type: "clear",
          size: "16",
          color: "#999"
        })
      } : {}, {
        g: common_vendor.p({
          type: "funnel",
          size: "18",
          color: "#333"
        }),
        h: common_vendor.o(showFilterPopup),
        i: common_vendor.t(totalBanks.value),
        j: common_vendor.t(totalQuestions.value),
        k: common_vendor.t(todayAdded.value),
        l: loading.value
      }, loading.value ? {
        m: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#007AFF"
        })
      } : filteredBankList.value.length === 0 ? {
        o: common_vendor.p({
          type: "folder-add",
          size: "80",
          color: "#ddd"
        }),
        p: common_vendor.p({
          type: "plus",
          size: "16",
          color: "#fff"
        }),
        q: common_vendor.o(goToUpload)
      } : {
        r: common_vendor.f(filteredBankList.value, (bank, k0, i0) => {
          return common_vendor.e({
            a: "6b8bcde8-6-" + i0,
            b: common_vendor.t(bank.bank_name),
            c: common_vendor.t(bank.file_name),
            d: "6b8bcde8-7-" + i0,
            e: common_vendor.o(($event) => showMoreActions(bank), bank.id),
            f: "6b8bcde8-8-" + i0,
            g: common_vendor.t(bank.total_questions),
            h: "6b8bcde8-9-" + i0,
            i: common_vendor.t(formatDate(bank.created_at)),
            j: common_vendor.f(getQuestionTypes(bank), (type, index, i1) => {
              return {
                a: common_vendor.t(type.label),
                b: common_vendor.t(type.count),
                c: index,
                d: common_vendor.n("tag-" + type.type)
              };
            }),
            k: common_vendor.t(bank.progress || 0),
            l: (bank.progress || 0) + "%",
            m: common_vendor.t(getProgressText(bank)),
            n: bank.completed_count > 0
          }, bank.completed_count > 0 ? {
            o: common_vendor.t(bank.completed_count)
          } : {}, {
            p: "6b8bcde8-10-" + i0,
            q: common_vendor.t(bank.current_question_index > 0 ? "继续学习" : "开始练习"),
            r: common_vendor.o(($event) => startExam(bank), bank.id),
            s: bank.id,
            t: common_vendor.o(($event) => startExam(bank), bank.id)
          });
        }),
        s: common_vendor.p({
          type: "paperplane",
          size: "24",
          color: "#fff"
        }),
        t: common_vendor.p({
          type: "more-filled",
          size: "20",
          color: "#999"
        }),
        v: common_vendor.p({
          type: "compose",
          size: "16",
          color: "#666"
        }),
        w: common_vendor.p({
          type: "calendar",
          size: "16",
          color: "#666"
        }),
        x: common_vendor.p({
          type: "forward",
          size: "16",
          color: "#fff"
        })
      }, {
        n: filteredBankList.value.length === 0,
        y: common_vendor.o(resetFilter),
        z: common_vendor.f(sortOptions, (sort, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(sort.label),
            b: currentSort.value === sort.value
          }, currentSort.value === sort.value ? {
            c: "6b8bcde8-12-" + i0 + ",6b8bcde8-11",
            d: common_vendor.p({
              type: "checkmarkempty",
              size: "18",
              color: "#007AFF"
            })
          } : {}, {
            e: sort.value,
            f: currentSort.value === sort.value ? 1 : "",
            g: common_vendor.o(($event) => selectSort(sort.value), sort.value)
          });
        }),
        A: common_vendor.o(applyFilter),
        B: common_vendor.sr(filterPopup, "6b8bcde8-11", {
          "k": "filterPopup"
        }),
        C: common_vendor.p({
          type: "bottom"
        }),
        D: common_vendor.p({
          type: "redo",
          size: "20",
          color: "#333"
        }),
        E: common_vendor.o(shareBank),
        F: selectedBank.value && selectedBank.value.current_question_index > 0
      }, selectedBank.value && selectedBank.value.current_question_index > 0 ? {
        G: common_vendor.p({
          type: "refreshempty",
          size: "20",
          color: "#ff9500"
        }),
        H: common_vendor.o(resetBankProgress)
      } : {}, {
        I: common_vendor.o(closeActionPopup),
        J: common_vendor.sr(actionPopup, "6b8bcde8-13", {
          "k": "actionPopup"
        }),
        K: common_vendor.p({
          type: "bottom"
        }),
        L: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#999"
        }),
        M: common_vendor.o(($event) => modePopup.value.close()),
        N: common_vendor.p({
          type: "list",
          size: "40",
          color: "#667eea"
        }),
        O: common_vendor.o(startChapterPractice),
        P: common_vendor.p({
          type: "paperplane",
          size: "40",
          color: "#f5576c"
        }),
        Q: common_vendor.o(startFullPractice),
        R: common_vendor.sr(modePopup, "6b8bcde8-16", {
          "k": "modePopup"
        }),
        S: common_vendor.p({
          type: "center"
        }),
        T: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#999"
        }),
        U: common_vendor.o(($event) => chapterSelectPopup.value.close()),
        V: common_vendor.f((_a = selectedBank.value) == null ? void 0 : _a.chapters, (chapter, k0, i0) => {
          return {
            a: common_vendor.t(chapter.chapter_name),
            b: common_vendor.t(chapter.question_count),
            c: common_vendor.t(getChapterProgressText(chapter)),
            d: "6b8bcde8-22-" + i0 + ",6b8bcde8-20",
            e: chapter.id,
            f: common_vendor.o(($event) => selectChapterAndStart(chapter), chapter.id)
          };
        }),
        W: common_vendor.p({
          type: "forward",
          size: "16",
          color: "#999"
        }),
        X: common_vendor.sr(chapterSelectPopup, "6b8bcde8-20", {
          "k": "chapterSelectPopup"
        }),
        Y: common_vendor.p({
          type: "bottom"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6b8bcde8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-list/exam-list.js.map
