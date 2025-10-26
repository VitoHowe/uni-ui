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
      common_vendor.index.__f__("log", "at pages/exam-list/exam-list.vue:265", "📱 题库列表页面显示，刷新数据...");
      fetchBankList();
    });
    const fetchBankList = async () => {
      loading.value = true;
      try {
        const data = await utils_request.get("/parse-results");
        bankList.value = data || [];
        try {
          const progressData = await utils_request.get("/user-progress");
          const progressMap = {};
          if (progressData && progressData.length > 0) {
            progressData.forEach((progress) => {
              progressMap[progress.bank_id] = progress;
            });
          }
          bankList.value.forEach((bank) => {
            const progress = progressMap[bank.bank_id];
            if (progress) {
              bank.current_question_index = progress.current_question_index || 0;
              bank.completed_count = progress.completed_count || 0;
              bank.last_study_time = progress.last_study_time;
              const totalQuestions2 = bank.total_questions || progress.total_questions || 1;
              const currentPosition = Math.max(progress.current_question_index || 0, progress.completed_count || 0);
              bank.progress = Math.min(Math.round(currentPosition / totalQuestions2 * 100), 100);
              common_vendor.index.__f__("log", "at pages/exam-list/exam-list.vue:303", `题库 ${bank.bank_name} 进度计算:`, {
                current_index: progress.current_question_index,
                completed: progress.completed_count,
                total: totalQuestions2,
                calculated_progress: bank.progress
              });
            } else {
              bank.progress = 0;
              bank.current_question_index = 0;
              bank.completed_count = 0;
            }
          });
        } catch (progressError) {
          common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:316", "获取学习进度失败:", progressError);
          bankList.value.forEach((bank) => {
            bank.progress = 0;
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:323", "获取题库列表失败:", error);
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
    const startExam = (bank) => {
      const hasProgress = bank.current_question_index > 0 && bank.current_question_index < bank.total_questions;
      let title = "开始练习";
      let content = `准备开始「${bank.bank_name}」练习
共 ${bank.total_questions} 道题目`;
      let confirmText = "开始";
      if (hasProgress) {
        title = "继续学习";
        content = `「${bank.bank_name}」

上次学习到第 ${bank.current_question_index + 1} 题
进度：${bank.progress}%
已完成：${bank.completed_count} 题

是否继续学习？`;
        confirmText = "继续";
      }
      common_vendor.index.showModal({
        title,
        content,
        confirmText,
        cancelText: "取消",
        success: (res) => {
          if (res.confirm) {
            common_vendor.index.navigateTo({
              url: `/pages/exam/exam?bankId=${bank.bank_id}&resultId=${bank.id}`
            });
          }
        }
      });
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
        content: `确定要重置「${bank.bank_name}」的学习进度吗？

当前进度：${bank.progress}%
已完成：${bank.completed_count} 题

重置后将从第一题重新开始，此操作不可恢复。`,
        confirmText: "重置",
        confirmColor: "#ff9500",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "重置中..." });
              await utils_request.del(`/user-progress/${bank.bank_id}`);
              await fetchBankList();
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "重置成功",
                icon: "success",
                duration: 2e3
              });
              common_vendor.index.__f__("log", "at pages/exam-list/exam-list.vue:485", `🔄 题库 ${bank.bank_name} 学习进度已重置`);
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/exam-list/exam-list.vue:488", "重置进度失败:", error);
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
            m: common_vendor.t(bank.current_question_index || 0),
            n: common_vendor.t(bank.total_questions),
            o: bank.completed_count > 0
          }, bank.completed_count > 0 ? {
            p: common_vendor.t(bank.completed_count)
          } : {}, {
            q: "6b8bcde8-10-" + i0,
            r: common_vendor.t(bank.current_question_index > 0 ? "继续学习" : "开始练习"),
            s: common_vendor.o(($event) => startExam(bank), bank.id),
            t: bank.id,
            v: common_vendor.o(($event) => startExam(bank), bank.id)
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
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6b8bcde8"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam-list/exam-list.js.map
