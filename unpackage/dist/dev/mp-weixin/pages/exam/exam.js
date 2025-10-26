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
  __name: "exam",
  setup(__props) {
    const bankInfo = common_vendor.ref({
      bank_name: "",
      file_name: ""
    });
    const resultId = common_vendor.ref(0);
    const bankId = common_vendor.ref(0);
    const questions = common_vendor.ref([]);
    const currentIndex = common_vendor.ref(0);
    const userAnswers = common_vendor.ref({});
    const showAnswer = common_vendor.ref(false);
    const historyAnsweredCount = common_vendor.ref(0);
    const loading = common_vendor.ref(false);
    const statsPopup = common_vendor.ref(null);
    const currentQuestion = common_vendor.computed(() => questions.value[currentIndex.value] || null);
    const userAnswer = common_vendor.computed(() => userAnswers.value[currentIndex.value] || "");
    const progressPercent = common_vendor.computed(() => {
      if (questions.value.length === 0)
        return 0;
      return Math.round((currentIndex.value + 1) / questions.value.length * 100);
    });
    const answeredCount = common_vendor.computed(() => Object.keys(userAnswers.value).length);
    const correctCount = common_vendor.computed(() => {
      return Object.keys(userAnswers.value).filter((index) => checkAnswer(parseInt(index))).length;
    });
    const wrongCount = common_vendor.computed(() => answeredCount.value - correctCount.value);
    const accuracy = common_vendor.computed(() => {
      if (answeredCount.value === 0)
        return 0;
      return Math.round(correctCount.value / answeredCount.value * 100);
    });
    const isAnswerCorrect = common_vendor.computed(() => {
      if (!userAnswer.value)
        return false;
      return userAnswer.value === formatAnswer(currentQuestion.value.answer);
    });
    common_vendor.onMounted(() => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      resultId.value = parseInt(options.resultId) || 0;
      bankId.value = parseInt(options.bankId) || 0;
      if (resultId.value) {
        fetchExamData();
      }
      common_vendor.index.onAppHide(() => {
        saveProgress();
      });
    });
    common_vendor.onUnmounted(() => {
      saveProgress();
    });
    common_vendor.watch(currentIndex, (newIndex, oldIndex) => {
      if (oldIndex !== void 0 && newIndex !== oldIndex) {
        saveProgress();
      }
    });
    const fetchExamData = async () => {
      loading.value = true;
      try {
        const data = await utils_request.get(`/parse-results/${resultId.value}`);
        bankInfo.value = {
          bank_name: data.bank_name,
          file_name: data.file_name
        };
        questions.value = data.questions || [];
        try {
          const progressData = await utils_request.get(`/user-progress/${bankId.value}`);
          if (progressData && progressData.current_question_index > 0) {
            const lastIndex = progressData.current_question_index;
            historyAnsweredCount.value = progressData.completed_count || 0;
            if (lastIndex < questions.value.length) {
              currentIndex.value = lastIndex;
              common_vendor.index.__f__("log", "at pages/exam/exam.vue:357", `📖 继续学习，从第 ${lastIndex + 1} 题开始，历史已答 ${historyAnsweredCount.value} 题`);
            }
          } else {
            common_vendor.index.__f__("log", "at pages/exam/exam.vue:360", "🆕 开始新的学习");
            historyAnsweredCount.value = 0;
          }
        } catch (progressError) {
          common_vendor.index.__f__("error", "at pages/exam/exam.vue:364", "获取学习进度失败:", progressError);
          currentIndex.value = 0;
          historyAnsweredCount.value = 0;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:371", "获取题库失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const getTypeLabel = (type) => {
      const typeMap = {
        "single": "单选题",
        "multiple": "多选题",
        "judge": "判断题",
        "fill": "填空题"
      };
      return typeMap[type] || "未知题型";
    };
    const getOptionLabel = (index) => {
      return String.fromCharCode(65 + index);
    };
    const formatAnswer = (answer) => {
      if (!answer)
        return "";
      if (Array.isArray(answer)) {
        return answer.sort().join("");
      }
      return answer.toString().toUpperCase();
    };
    const isOptionSelected = (optionIndex) => {
      const answer = userAnswers.value[currentIndex.value];
      if (!answer)
        return false;
      const label = getOptionLabel(optionIndex);
      if (currentQuestion.value.type === "multiple") {
        return answer.includes(label);
      }
      return answer === label;
    };
    const isCorrectOption = (optionIndex) => {
      const correctAnswer = formatAnswer(currentQuestion.value.answer);
      const label = getOptionLabel(optionIndex);
      if (currentQuestion.value.type === "multiple") {
        return correctAnswer.includes(label);
      }
      return correctAnswer === label;
    };
    const selectOption = (optionIndex) => {
      if (showAnswer.value)
        return;
      const label = getOptionLabel(optionIndex);
      if (currentQuestion.value.type === "multiple") {
        let currentAnswer = userAnswers.value[currentIndex.value] || "";
        if (currentAnswer.includes(label)) {
          currentAnswer = currentAnswer.replace(label, "");
        } else {
          currentAnswer += label;
        }
        currentAnswer = currentAnswer.split("").sort().join("");
        userAnswers.value[currentIndex.value] = currentAnswer;
      } else {
        userAnswers.value[currentIndex.value] = label;
      }
      setTimeout(() => {
        showAnswer.value = true;
      }, 300);
    };
    const toggleAnswer = () => {
      showAnswer.value = !showAnswer.value;
    };
    const prevQuestion = () => {
      if (currentIndex.value > 0) {
        currentIndex.value--;
        showAnswer.value = false;
      }
    };
    const nextQuestion = () => {
      if (currentIndex.value < questions.value.length - 1) {
        currentIndex.value++;
        showAnswer.value = false;
      }
    };
    const jumpToQuestion = (index) => {
      currentIndex.value = index;
      showAnswer.value = false;
      closeStats();
    };
    const checkAnswer = (index) => {
      const userAns = userAnswers.value[index];
      if (!userAns)
        return false;
      const question = questions.value[index];
      const correctAns = formatAnswer(question.answer);
      return userAns === correctAns;
    };
    const showStats = () => {
      statsPopup.value.open();
    };
    const closeStats = () => {
      statsPopup.value.close();
    };
    const saveProgress = async () => {
      if (!bankId.value || questions.value.length === 0)
        return;
      try {
        const totalCompleted = historyAnsweredCount.value + answeredCount.value;
        await utils_request.post(`/user-progress/${bankId.value}`, {
          parse_result_id: resultId.value,
          current_question_index: currentIndex.value,
          completed_count: totalCompleted,
          // 累计已答题数
          total_questions: questions.value.length
        }, {
          showLoading: false
          // 后台保存，不显示加载提示
        });
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:536", "💾 学习进度已保存:", {
          current: currentIndex.value + 1,
          historyAnswered: historyAnsweredCount.value,
          sessionAnswered: answeredCount.value,
          totalCompleted,
          total: questions.value.length,
          progress: progressPercent.value + "%"
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:545", "保存学习进度失败:", error);
      }
    };
    const resetProgress = async () => {
      common_vendor.index.showModal({
        title: "重新练习",
        content: "确定要清除当前进度，重新开始练习吗？",
        confirmText: "确定",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "重置中..." });
              await utils_request.del(`/user-progress/${bankId.value}`);
              currentIndex.value = 0;
              userAnswers.value = {};
              showAnswer.value = false;
              historyAnsweredCount.value = 0;
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "已重新开始",
                icon: "success"
              });
              common_vendor.index.__f__("log", "at pages/exam/exam.vue:577", "🔄 学习进度已重置");
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/exam/exam.vue:580", "重置进度失败:", error);
              common_vendor.index.showToast({
                title: error.message || "重置失败",
                icon: "none"
              });
            }
          }
        }
      });
    };
    const finishExam = () => {
      saveProgress();
      common_vendor.index.showModal({
        title: "完成练习",
        content: `已完成 ${answeredCount.value}/${questions.value.length} 题
正确率：${accuracy.value}%`,
        confirmText: "查看统计",
        cancelText: "重新练习",
        success: (res) => {
          if (res.confirm) {
            showStats();
          } else {
            resetProgress();
          }
        }
      });
    };
    const handleBack = () => {
      common_vendor.index.showModal({
        title: "确认退出",
        content: "学习进度已自动保存，确定要退出吗？",
        success: async (res) => {
          if (res.confirm) {
            await saveProgress();
            common_vendor.index.navigateBack();
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          type: "back",
          size: "20",
          color: "#333"
        }),
        b: common_vendor.o(handleBack),
        c: common_vendor.t(bankInfo.value.bank_name),
        d: common_vendor.t(currentIndex.value + 1),
        e: common_vendor.t(questions.value.length),
        f: common_vendor.p({
          type: "bars",
          size: "20",
          color: "#333"
        }),
        g: common_vendor.o(showStats),
        h: progressPercent.value + "%",
        i: common_vendor.t(progressPercent.value),
        j: loading.value
      }, loading.value ? {
        k: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#667eea"
        })
      } : currentQuestion.value ? common_vendor.e({
        m: common_vendor.t(getTypeLabel(currentQuestion.value.type)),
        n: common_vendor.n("type-" + currentQuestion.value.type),
        o: common_vendor.f(3, (i, k0, i0) => {
          return {
            a: i,
            b: "970fed46-3-" + i0,
            c: common_vendor.p({
              type: "star-filled",
              size: 14,
              color: i <= currentQuestion.value.difficulty ? "#ffc107" : "#ddd"
            })
          };
        }),
        p: common_vendor.t(currentIndex.value + 1),
        q: common_vendor.t(currentQuestion.value.content),
        r: currentQuestion.value.tags && currentQuestion.value.tags.length > 0
      }, currentQuestion.value.tags && currentQuestion.value.tags.length > 0 ? {
        s: common_vendor.f(currentQuestion.value.tags, (tag, index, i0) => {
          return {
            a: common_vendor.t(tag),
            b: index
          };
        })
      } : {}, {
        t: common_vendor.f(currentQuestion.value.options, (option, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(getOptionLabel(index)),
            b: common_vendor.t(option),
            c: showAnswer.value && isCorrectOption(index)
          }, showAnswer.value && isCorrectOption(index) ? {
            d: "970fed46-4-" + i0,
            e: common_vendor.p({
              type: "checkmarkempty",
              size: "20",
              color: "#28a745"
            })
          } : showAnswer.value && isOptionSelected(index) && !isCorrectOption(index) ? {
            g: "970fed46-5-" + i0,
            h: common_vendor.p({
              type: "closeempty",
              size: "20",
              color: "#dc3545"
            })
          } : isOptionSelected(index) ? {} : {}, {
            f: showAnswer.value && isOptionSelected(index) && !isCorrectOption(index),
            i: isOptionSelected(index),
            j: index,
            k: isOptionSelected(index) ? 1 : "",
            l: showAnswer.value && isCorrectOption(index) ? 1 : "",
            m: showAnswer.value && isOptionSelected(index) && !isCorrectOption(index) ? 1 : "",
            n: common_vendor.o(($event) => selectOption(index), index)
          });
        }),
        v: showAnswer.value ? 1 : "",
        w: showAnswer.value
      }, showAnswer.value ? {
        x: common_vendor.p({
          type: "info",
          size: "20",
          color: "#667eea"
        }),
        y: common_vendor.t(formatAnswer(currentQuestion.value.answer)),
        z: common_vendor.t(userAnswer.value || "未作答"),
        A: common_vendor.n(isAnswerCorrect.value ? "correct" : "wrong"),
        B: common_vendor.t(currentQuestion.value.explanation || "暂无解析")
      } : {}, {
        C: common_vendor.p({
          type: "back",
          size: "18",
          color: "#fff"
        }),
        D: currentIndex.value === 0,
        E: common_vendor.o(prevQuestion),
        F: !showAnswer.value
      }, !showAnswer.value ? {
        G: common_vendor.p({
          type: "eye",
          size: "18",
          color: "#fff"
        }),
        H: common_vendor.o(toggleAnswer)
      } : {
        I: common_vendor.p({
          type: "eye-slash",
          size: "18",
          color: "#fff"
        }),
        J: common_vendor.o(toggleAnswer)
      }, {
        K: currentIndex.value < questions.value.length - 1
      }, currentIndex.value < questions.value.length - 1 ? {
        L: common_vendor.p({
          type: "forward",
          size: "18",
          color: "#fff"
        }),
        M: common_vendor.o(nextQuestion)
      } : {
        N: common_vendor.p({
          type: "checkmarkempty",
          size: "18",
          color: "#fff"
        }),
        O: common_vendor.o(finishExam)
      }) : {}, {
        l: currentQuestion.value,
        P: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#999"
        }),
        Q: common_vendor.o(closeStats),
        R: common_vendor.t(answeredCount.value),
        S: common_vendor.t(correctCount.value),
        T: common_vendor.t(wrongCount.value),
        U: common_vendor.t(accuracy.value),
        V: common_vendor.f(questions.value, (q, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: index,
            c: index === currentIndex.value ? 1 : "",
            d: userAnswers.value[index] ? 1 : "",
            e: userAnswers.value[index] && checkAnswer(index) ? 1 : "",
            f: userAnswers.value[index] && !checkAnswer(index) ? 1 : "",
            g: common_vendor.o(($event) => jumpToQuestion(index), index)
          };
        }),
        W: common_vendor.o(resetProgress),
        X: common_vendor.o(closeStats),
        Y: common_vendor.sr(statsPopup, "970fed46-12", {
          "k": "statsPopup"
        }),
        Z: common_vendor.p({
          type: "center"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-970fed46"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam/exam.js.map
