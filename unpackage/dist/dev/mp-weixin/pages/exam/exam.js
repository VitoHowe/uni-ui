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
    const bankId = common_vendor.ref(0);
    const practiceMode = common_vendor.ref("full");
    const startChapterId = common_vendor.ref(null);
    const startQuestionNumber = common_vendor.ref(1);
    const bankInfo = common_vendor.ref({
      bank_name: "",
      total_questions: 0
    });
    const chapters = common_vendor.ref([]);
    const currentChapterIndex = common_vendor.ref(0);
    const currentChapter = common_vendor.ref(null);
    const currentQuestionNumber = common_vendor.ref(1);
    const currentQuestion = common_vendor.ref(null);
    const totalInChapter = common_vendor.ref(0);
    const hasNextQuestion = common_vendor.ref(true);
    const hasPrevQuestion = common_vendor.ref(true);
    const userAnswers = common_vendor.ref({});
    const showAnswer = common_vendor.ref(false);
    const questionCache = common_vendor.ref({});
    const loading = common_vendor.ref(false);
    const statsPopup = common_vendor.ref(null);
    const getAnswerKey = () => {
      if (!currentChapter.value)
        return "";
      return `${currentChapter.value.id}_${currentQuestionNumber.value}`;
    };
    const userAnswer = common_vendor.computed(() => userAnswers.value[getAnswerKey()] || "");
    const titleText = common_vendor.computed(() => {
      var _a;
      if (practiceMode.value === "chapter") {
        return ((_a = currentChapter.value) == null ? void 0 : _a.chapter_name) || bankInfo.value.bank_name;
      }
      return bankInfo.value.bank_name;
    });
    const subtitleText = common_vendor.computed(() => {
      var _a;
      if (practiceMode.value === "chapter") {
        return `第 ${currentQuestionNumber.value} / ${totalInChapter.value} 题`;
      }
      let position = 0;
      chapters.value.forEach((chapter, index) => {
        if (index < currentChapterIndex.value) {
          position += chapter.question_count;
        }
      });
      position += currentQuestionNumber.value;
      const chapterName = ((_a = currentChapter.value) == null ? void 0 : _a.chapter_name) || "";
      return `第 ${position} / ${bankInfo.value.total_questions} 题 (${chapterName})`;
    });
    const progressPercent = common_vendor.computed(() => {
      if (practiceMode.value === "chapter") {
        return totalInChapter.value > 0 ? Math.round(currentQuestionNumber.value / totalInChapter.value * 100) : 0;
      }
      let totalQuestions = 0;
      let currentPosition = 0;
      chapters.value.forEach((chapter, index) => {
        totalQuestions += chapter.question_count;
        if (index < currentChapterIndex.value) {
          currentPosition += chapter.question_count;
        }
      });
      currentPosition += currentQuestionNumber.value;
      return totalQuestions > 0 ? Math.round(currentPosition / totalQuestions * 100) : 0;
    });
    const answeredCount = common_vendor.computed(() => Object.keys(userAnswers.value).length);
    const correctCount = common_vendor.computed(() => {
      return Object.keys(userAnswers.value).filter((key) => {
        const userAns = userAnswers.value[key];
        return checkAnswerByKey(key, userAns);
      }).length;
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
    common_vendor.onMounted(async () => {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      bankId.value = parseInt(options.bankId) || 0;
      practiceMode.value = options.mode || "full";
      startChapterId.value = parseInt(options.chapterId) || null;
      startQuestionNumber.value = parseInt(options.questionNumber) || 1;
      if (!bankId.value) {
        common_vendor.index.showToast({ title: "参数错误", icon: "none" });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
        return;
      }
      await initExam();
      common_vendor.index.onAppHide(() => {
        saveProgress();
      });
    });
    common_vendor.onUnmounted(() => {
      saveProgress();
    });
    common_vendor.watch([currentQuestionNumber, currentChapterIndex], ([newQuestionNum, newChapterIdx], [oldQuestionNum, oldChapterIdx]) => {
      if (oldQuestionNum !== void 0 && newQuestionNum !== oldQuestionNum || oldChapterIdx !== void 0 && newChapterIdx !== oldChapterIdx) {
        saveProgress();
      }
    });
    const initExam = async () => {
      var _a;
      loading.value = true;
      try {
        const bankData = await utils_request.get(`/questions/banks/${bankId.value}`);
        bankInfo.value = {
          bank_name: bankData.name || "题库",
          total_questions: ((_a = bankData.stats) == null ? void 0 : _a.total_questions) || 0
        };
        const chaptersData = await utils_request.get(`/question-banks/${bankId.value}/chapters`);
        chapters.value = chaptersData.chapters || [];
        if (chapters.value.length === 0) {
          common_vendor.index.showToast({ title: "该题库暂无章节", icon: "none" });
          setTimeout(() => common_vendor.index.navigateBack(), 1500);
          return;
        }
        if (startChapterId.value) {
          const index = chapters.value.findIndex((c) => c.id === startChapterId.value);
          currentChapterIndex.value = index >= 0 ? index : 0;
        } else {
          currentChapterIndex.value = 0;
        }
        currentChapter.value = chapters.value[currentChapterIndex.value];
        currentQuestionNumber.value = startQuestionNumber.value;
        await loadQuestion();
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:421", `📖 开始${practiceMode.value === "chapter" ? "章节" : "整卷"}练习`, {
          chapter: currentChapter.value.chapter_name,
          questionNumber: currentQuestionNumber.value
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:427", "初始化失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } finally {
        loading.value = false;
      }
    };
    const loadQuestion = async () => {
      if (!currentChapter.value)
        return;
      loading.value = true;
      try {
        const response = await utils_request.get(
          `/question-banks/${bankId.value}/chapters/${currentChapter.value.id}/questions`,
          { questionNumber: currentQuestionNumber.value }
        );
        if (response.question) {
          currentQuestion.value = response.question;
          totalInChapter.value = response.total;
          hasNextQuestion.value = response.hasNext;
          hasPrevQuestion.value = response.hasPrev;
          const cacheKey = getAnswerKey();
          questionCache.value[cacheKey] = response.question;
          showAnswer.value = false;
          common_vendor.index.__f__("log", "at pages/exam/exam.vue:462", `📖 加载题目: ${currentChapter.value.chapter_name} 第${currentQuestionNumber.value}题`);
        } else {
          if (practiceMode.value === "full" && canSwitchToNextChapter()) {
            await switchToNextChapter();
          } else {
            common_vendor.index.showToast({ title: "已是最后一题", icon: "none" });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:473", "加载题目失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const canSwitchToNextChapter = () => {
      return currentChapterIndex.value < chapters.value.length - 1;
    };
    const canSwitchToPrevChapter = () => {
      return currentChapterIndex.value > 0;
    };
    const switchToNextChapter = async () => {
      if (canSwitchToNextChapter()) {
        currentChapterIndex.value++;
        currentChapter.value = chapters.value[currentChapterIndex.value];
        currentQuestionNumber.value = 1;
        common_vendor.index.showToast({
          title: `进入${currentChapter.value.chapter_name}`,
          icon: "none",
          duration: 1500
        });
        await loadQuestion();
      }
    };
    const switchToPrevChapter = async () => {
      if (canSwitchToPrevChapter()) {
        currentChapterIndex.value--;
        currentChapter.value = chapters.value[currentChapterIndex.value];
        currentQuestionNumber.value = currentChapter.value.question_count;
        await loadQuestion();
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
      const key = getAnswerKey();
      if (currentQuestion.value.type === "multiple") {
        let currentAnswer = userAnswers.value[key] || "";
        if (currentAnswer.includes(label)) {
          currentAnswer = currentAnswer.replace(label, "");
        } else {
          currentAnswer += label;
        }
        currentAnswer = currentAnswer.split("").sort().join("");
        userAnswers.value[key] = currentAnswer;
      } else {
        userAnswers.value[key] = label;
      }
      setTimeout(() => {
        showAnswer.value = true;
      }, 300);
    };
    const toggleAnswer = () => {
      showAnswer.value = !showAnswer.value;
    };
    const prevQuestion = async () => {
      if (hasPrevQuestion.value) {
        currentQuestionNumber.value--;
        await loadQuestion();
      } else {
        if (practiceMode.value === "full" && canSwitchToPrevChapter()) {
          common_vendor.index.showModal({
            title: "返回上一章节",
            content: "是否返回上一章节的最后一题？",
            success: async (res) => {
              if (res.confirm) {
                await switchToPrevChapter();
              }
            }
          });
        } else {
          common_vendor.index.showToast({ title: "已是第一题", icon: "none" });
        }
      }
    };
    const nextQuestion = async () => {
      await saveProgress();
      if (hasNextQuestion.value) {
        currentQuestionNumber.value++;
        await loadQuestion();
      } else {
        if (practiceMode.value === "full" && canSwitchToNextChapter()) {
          common_vendor.index.showModal({
            title: "章节完成",
            content: `「${currentChapter.value.chapter_name}」已完成

是否继续下一章节？`,
            confirmText: "继续",
            cancelText: "退出",
            success: async (res) => {
              if (res.confirm) {
                await switchToNextChapter();
              } else {
                handleBack();
              }
            }
          });
        } else {
          common_vendor.index.showToast({ title: "本章节已完成", icon: "success" });
          finishExam();
        }
      }
    };
    const checkAnswerByKey = (answerKey, userAns) => {
      if (!userAns)
        return false;
      const cachedQuestion = questionCache.value[answerKey];
      if (!cachedQuestion)
        return false;
      const correctAns = formatAnswer(cachedQuestion.answer);
      return userAns === correctAns;
    };
    const showStats = () => {
      statsPopup.value.open();
    };
    const closeStats = () => {
      statsPopup.value.close();
    };
    const saveProgress = async () => {
      if (!bankId.value || !currentChapter.value)
        return;
      try {
        const chapterAnsweredCount = getChapterAnsweredCount(currentChapter.value.id);
        await utils_request.post(
          `/user-progress/${bankId.value}/chapters/${currentChapter.value.id}`,
          {
            current_question_number: currentQuestionNumber.value,
            completed_count: chapterAnsweredCount,
            total_questions: totalInChapter.value
          },
          { showLoading: false }
        );
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:722", "💾 进度已保存:", {
          chapter: currentChapter.value.chapter_name,
          questionNumber: currentQuestionNumber.value,
          answered: chapterAnsweredCount,
          total: totalInChapter.value
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:729", "保存进度失败:", error);
      }
    };
    const getChapterAnsweredCount = (chapterId) => {
      const prefix = `${chapterId}_`;
      return Object.keys(userAnswers.value).filter((key) => key.startsWith(prefix)).length;
    };
    const resetProgress = async () => {
      common_vendor.index.showModal({
        title: "重新练习",
        content: "确定要清除当前章节进度，重新开始练习吗？",
        confirmText: "确定",
        cancelText: "取消",
        success: async (res) => {
          if (res.confirm) {
            try {
              common_vendor.index.showLoading({ title: "重置中..." });
              if (practiceMode.value === "chapter") {
                await utils_request.del(`/user-progress/${bankId.value}/chapters/${currentChapter.value.id}`);
              } else {
                await utils_request.del(`/user-progress/${bankId.value}`);
              }
              currentQuestionNumber.value = 1;
              userAnswers.value = {};
              showAnswer.value = false;
              questionCache.value = {};
              await loadQuestion();
              common_vendor.index.hideLoading();
              common_vendor.index.showToast({
                title: "已重新开始",
                icon: "success"
              });
              common_vendor.index.__f__("log", "at pages/exam/exam.vue:775", "🔄 学习进度已重置");
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/exam/exam.vue:778", "重置进度失败:", error);
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
      const totalQuestions = practiceMode.value === "chapter" ? totalInChapter.value : bankInfo.value.total_questions;
      common_vendor.index.showModal({
        title: "完成练习",
        content: `已完成 ${answeredCount.value}/${totalQuestions} 题
正确率：${accuracy.value}%`,
        confirmText: "查看统计",
        cancelText: "返回",
        success: (res) => {
          if (res.confirm) {
            showStats();
          } else {
            common_vendor.index.navigateBack();
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
        c: common_vendor.t(titleText.value),
        d: common_vendor.t(subtitleText.value),
        e: common_vendor.p({
          type: "bars",
          size: "20",
          color: "#333"
        }),
        f: common_vendor.o(showStats),
        g: progressPercent.value + "%",
        h: common_vendor.t(progressPercent.value),
        i: loading.value
      }, loading.value ? {
        j: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#667eea"
        })
      } : currentQuestion.value ? common_vendor.e({
        l: common_vendor.t(getTypeLabel(currentQuestion.value.type)),
        m: common_vendor.n("type-" + currentQuestion.value.type),
        n: common_vendor.f(3, (i, k0, i0) => {
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
        o: common_vendor.t(_ctx.currentIndex + 1),
        p: common_vendor.t(currentQuestion.value.content),
        q: currentQuestion.value.tags && currentQuestion.value.tags.length > 0
      }, currentQuestion.value.tags && currentQuestion.value.tags.length > 0 ? {
        r: common_vendor.f(currentQuestion.value.tags, (tag, index, i0) => {
          return {
            a: common_vendor.t(tag),
            b: index
          };
        })
      } : {}, {
        s: common_vendor.f(currentQuestion.value.options, (option, index, i0) => {
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
        t: showAnswer.value ? 1 : "",
        v: showAnswer.value
      }, showAnswer.value ? {
        w: common_vendor.p({
          type: "info",
          size: "20",
          color: "#667eea"
        }),
        x: common_vendor.t(formatAnswer(currentQuestion.value.answer)),
        y: common_vendor.t(userAnswer.value || "未作答"),
        z: common_vendor.n(isAnswerCorrect.value ? "correct" : "wrong"),
        A: common_vendor.t(currentQuestion.value.explanation || "暂无解析")
      } : {}, {
        B: common_vendor.p({
          type: "back",
          size: "18",
          color: "#fff"
        }),
        C: !hasPrevQuestion.value && (practiceMode.value === "chapter" || !canSwitchToPrevChapter()),
        D: common_vendor.o(prevQuestion),
        E: !showAnswer.value
      }, !showAnswer.value ? {
        F: common_vendor.p({
          type: "eye",
          size: "18",
          color: "#fff"
        }),
        G: common_vendor.o(toggleAnswer)
      } : {
        H: common_vendor.p({
          type: "eye-slash",
          size: "18",
          color: "#fff"
        }),
        I: common_vendor.o(toggleAnswer)
      }, {
        J: hasNextQuestion.value || practiceMode.value === "full" && canSwitchToNextChapter()
      }, hasNextQuestion.value || practiceMode.value === "full" && canSwitchToNextChapter() ? {
        K: common_vendor.p({
          type: "forward",
          size: "18",
          color: "#fff"
        }),
        L: common_vendor.o(nextQuestion)
      } : {
        M: common_vendor.p({
          type: "checkmarkempty",
          size: "18",
          color: "#fff"
        }),
        N: common_vendor.o(finishExam)
      }) : {}, {
        k: currentQuestion.value,
        O: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#999"
        }),
        P: common_vendor.o(closeStats),
        Q: common_vendor.t(answeredCount.value),
        R: common_vendor.t(correctCount.value),
        S: common_vendor.t(wrongCount.value),
        T: common_vendor.t(accuracy.value),
        U: common_vendor.o(resetProgress),
        V: common_vendor.o(closeStats),
        W: common_vendor.sr(statsPopup, "970fed46-12", {
          "k": "statsPopup"
        }),
        X: common_vendor.p({
          type: "center"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-970fed46"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam/exam.js.map
