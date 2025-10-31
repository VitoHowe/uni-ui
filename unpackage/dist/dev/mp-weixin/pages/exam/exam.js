"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_imageParser = require("../../utils/imageParser.js");
const utils_constants = require("../../utils/constants.js");
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
    const menuButtonInfo = common_vendor.ref({});
    const statusBarHeight = common_vendor.ref(0);
    const navBarHeight = common_vendor.ref(0);
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
    const parsedContent = common_vendor.computed(() => {
      if (!currentQuestion.value || !currentQuestion.value.content)
        return "";
      const baseUrl = utils_constants.API_CONFIG.BASE_URL.replace("/api", "");
      return utils_imageParser.parseQuestionImages(currentQuestion.value.content, bankId.value, baseUrl);
    });
    const parsedExplanation = common_vendor.computed(() => {
      if (!currentQuestion.value || !currentQuestion.value.explanation)
        return "";
      const baseUrl = utils_constants.API_CONFIG.BASE_URL.replace("/api", "");
      return utils_imageParser.parseQuestionImages(currentQuestion.value.explanation, bankId.value, baseUrl);
    });
    const currentImageUrls = common_vendor.computed(() => {
      if (!currentQuestion.value)
        return [];
      const baseUrl = utils_constants.API_CONFIG.BASE_URL.replace("/api", "");
      return utils_imageParser.extractAllQuestionImages(currentQuestion.value, bankId.value, baseUrl);
    });
    common_vendor.onMounted(async () => {
      try {
        const menuButton = common_vendor.index.getMenuButtonBoundingClientRect();
        const systemInfo = common_vendor.index.getSystemInfoSync();
        menuButtonInfo.value = menuButton;
        statusBarHeight.value = systemInfo.statusBarHeight || 0;
        const gap = menuButton.top - statusBarHeight.value;
        navBarHeight.value = menuButton.height + gap * 2 + statusBarHeight.value;
      } catch (e) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:393", "获取胶囊按钮信息失败:", e);
      }
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
      loading.value = true;
      try {
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:440", "📖 开始初始化考试，参数:", {
          bankId: bankId.value,
          mode: practiceMode.value,
          chapterId: startChapterId.value,
          questionNumber: startQuestionNumber.value
        });
        const bankData = await utils_request.get(`/questions/banks/${bankId.value}`, {}, { showLoading: false });
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:449", "✅ 题库信息:", bankData);
        bankInfo.value = {
          bank_name: bankData.name || "题库",
          total_questions: bankData.question_count || 0
        };
        const chaptersData = await utils_request.get(`/question-banks/${bankId.value}/chapters`, {}, { showLoading: false });
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:458", "✅ 章节列表:", chaptersData);
        chapters.value = chaptersData.chapters || [];
        if (chapters.value.length === 0) {
          common_vendor.index.showToast({ title: "该题库暂无章节", icon: "none" });
          setTimeout(() => common_vendor.index.navigateBack(), 1500);
          return;
        }
        if (startChapterId.value) {
          const index = chapters.value.findIndex((c) => c.id === startChapterId.value);
          currentChapterIndex.value = index >= 0 ? index : 0;
          common_vendor.index.__f__("log", "at pages/exam/exam.vue:472", `📍 找到起始章节，索引: ${currentChapterIndex.value}`);
        } else {
          currentChapterIndex.value = 0;
          common_vendor.index.__f__("log", "at pages/exam/exam.vue:475", "📍 使用第一个章节");
        }
        currentChapter.value = chapters.value[currentChapterIndex.value];
        currentQuestionNumber.value = startQuestionNumber.value;
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:481", "📍 当前章节:", currentChapter.value);
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:482", "📍 起始题号:", currentQuestionNumber.value);
        await loadQuestion();
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:487", `✅ 初始化完成，开始${practiceMode.value === "chapter" ? "章节" : "整卷"}练习`);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:490", "❌ 初始化失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } finally {
        loading.value = false;
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:498", "✅ 初始化loading状态已重置");
      }
    };
    const loadQuestion = async () => {
      if (!currentChapter.value) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:505", "❌ currentChapter is null");
        return;
      }
      loading.value = true;
      try {
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:511", `📖 开始加载题目: 题库${bankId.value}, 章节${currentChapter.value.id}, 题号${currentQuestionNumber.value}`);
        const response = await utils_request.get(
          `/question-banks/${bankId.value}/chapters/${currentChapter.value.id}/questions`,
          { questionNumber: currentQuestionNumber.value },
          { showLoading: false }
          // 使用组件自己的loading状态，不显示系统加载提示
        );
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:519", "📡 题目数据响应:", response);
        if (response && response.question) {
          currentQuestion.value = response.question;
          totalInChapter.value = response.total || 0;
          hasNextQuestion.value = response.hasNext || false;
          hasPrevQuestion.value = response.hasPrev || false;
          if (practiceMode.value === "full" && chapters.value.length > 0) {
            let totalCount = 0;
            chapters.value.forEach((chapter) => {
              totalCount += chapter.question_count || 0;
            });
            if (totalCount > 0) {
              bankInfo.value.total_questions = totalCount;
            }
          }
          const cacheKey = getAnswerKey();
          questionCache.value[cacheKey] = response.question;
          showAnswer.value = false;
          common_vendor.index.__f__("log", "at pages/exam/exam.vue:545", `✅ 题目加载成功: ${currentChapter.value.chapter_name} 第${currentQuestionNumber.value}题`);
        } else {
          common_vendor.index.__f__("warn", "at pages/exam/exam.vue:547", "⚠️ 响应中没有question字段:", response);
          if (practiceMode.value === "full" && canSwitchToNextChapter()) {
            await switchToNextChapter();
          } else {
            common_vendor.index.showToast({ title: "已是最后一题", icon: "none" });
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:557", "❌ 加载题目失败:", error);
        common_vendor.index.showToast({
          title: error.message || "加载失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
        common_vendor.index.__f__("log", "at pages/exam/exam.vue:564", "✅ loading状态已重置为false");
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
      const key = getAnswerKey();
      const answer = userAnswers.value[key];
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
        if (practiceMode.value === "chapter") {
          await utils_request.post(
            `/user-progress/${bankId.value}/chapters/${currentChapter.value.id}`,
            {
              practice_mode: "chapter",
              current_question_number: currentQuestionNumber.value,
              completed_count: currentQuestionNumber.value,
              total_questions: totalInChapter.value
            },
            { showLoading: false }
          );
          common_vendor.index.__f__("log", "at pages/exam/exam.vue:805", "💾 章节进度已保存:", {
            mode: "chapter",
            chapter: currentChapter.value.chapter_name,
            questionNumber: currentQuestionNumber.value,
            completedCount: currentQuestionNumber.value,
            total: totalInChapter.value
          });
        } else {
          let totalCompleted = currentQuestionNumber.value;
          for (let i = 0; i < currentChapterIndex.value; i++) {
            totalCompleted += chapters.value[i].question_count || 0;
          }
          await utils_request.post(
            `/user-progress/${bankId.value}/chapters/0`,
            {
              practice_mode: "full",
              current_chapter_id: currentChapter.value.id,
              current_question_number: currentQuestionNumber.value,
              completed_count: totalCompleted,
              total_questions: bankInfo.value.total_questions
            },
            { showLoading: false }
          );
          common_vendor.index.__f__("log", "at pages/exam/exam.vue:832", "💾 整卷进度已保存:", {
            mode: "full",
            chapter: currentChapter.value.chapter_name,
            chapterQuestionNumber: currentQuestionNumber.value,
            totalCompleted,
            total: bankInfo.value.total_questions
          });
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/exam/exam.vue:841", "保存进度失败:", error);
      }
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
              common_vendor.index.__f__("log", "at pages/exam/exam.vue:881", "🔄 学习进度已重置");
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/exam/exam.vue:884", "重置进度失败:", error);
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
    const handleImageClick = () => {
      if (currentImageUrls.value.length > 0) {
        common_vendor.index.previewImage({
          urls: currentImageUrls.value,
          current: 0
        });
      }
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
        e: (menuButtonInfo.value.left || 0) > 0 ? menuButtonInfo.value.left - 20 + "px" : "auto",
        f: progressPercent.value + "%",
        g: common_vendor.t(progressPercent.value),
        h: common_vendor.p({
          type: "bars",
          size: "18",
          color: "#667eea"
        }),
        i: common_vendor.o(showStats),
        j: statusBarHeight.value + "px",
        k: navBarHeight.value + "px",
        l: loading.value
      }, loading.value ? {
        m: common_vendor.p({
          type: "spinner-cycle",
          size: "40",
          color: "#667eea"
        })
      } : currentQuestion.value ? common_vendor.e({
        o: common_vendor.t(getTypeLabel(currentQuestion.value.type)),
        p: common_vendor.n("type-" + currentQuestion.value.type),
        q: common_vendor.f(3, (i, k0, i0) => {
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
        r: common_vendor.t(currentQuestionNumber.value),
        s: parsedContent.value,
        t: common_vendor.o(handleImageClick),
        v: currentQuestion.value.tags && currentQuestion.value.tags.length > 0
      }, currentQuestion.value.tags && currentQuestion.value.tags.length > 0 ? {
        w: common_vendor.f(currentQuestion.value.tags, (tag, index, i0) => {
          return {
            a: common_vendor.t(tag),
            b: index
          };
        })
      } : {}, {
        x: common_vendor.f(currentQuestion.value.options, (option, index, i0) => {
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
        y: showAnswer.value ? 1 : "",
        z: showAnswer.value
      }, showAnswer.value ? common_vendor.e({
        A: common_vendor.p({
          type: "info",
          size: "20",
          color: "#667eea"
        }),
        B: common_vendor.t(formatAnswer(currentQuestion.value.answer)),
        C: common_vendor.t(userAnswer.value || "未作答"),
        D: common_vendor.n(isAnswerCorrect.value ? "correct" : "wrong"),
        E: currentQuestion.value.explanation
      }, currentQuestion.value.explanation ? {
        F: parsedExplanation.value
      } : {}, {
        G: common_vendor.o(handleImageClick)
      }) : {}, {
        H: common_vendor.p({
          type: "back",
          size: "16",
          color: "#fff"
        }),
        I: !hasPrevQuestion.value && (practiceMode.value === "chapter" || !canSwitchToPrevChapter()),
        J: common_vendor.o(prevQuestion),
        K: !showAnswer.value
      }, !showAnswer.value ? {
        L: common_vendor.p({
          type: "eye",
          size: "16",
          color: "#fff"
        }),
        M: common_vendor.o(toggleAnswer)
      } : {
        N: common_vendor.p({
          type: "eye-slash",
          size: "16",
          color: "#fff"
        }),
        O: common_vendor.o(toggleAnswer)
      }, {
        P: hasNextQuestion.value || practiceMode.value === "full" && canSwitchToNextChapter()
      }, hasNextQuestion.value || practiceMode.value === "full" && canSwitchToNextChapter() ? {
        Q: common_vendor.p({
          type: "forward",
          size: "16",
          color: "#fff"
        }),
        R: common_vendor.o(nextQuestion)
      } : {
        S: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#fff"
        }),
        T: common_vendor.o(finishExam)
      }) : {}, {
        n: currentQuestion.value,
        U: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#999"
        }),
        V: common_vendor.o(closeStats),
        W: common_vendor.t(answeredCount.value),
        X: common_vendor.t(correctCount.value),
        Y: common_vendor.t(wrongCount.value),
        Z: common_vendor.t(accuracy.value),
        aa: common_vendor.o(resetProgress),
        ab: common_vendor.o(closeStats),
        ac: common_vendor.sr(statsPopup, "970fed46-12", {
          "k": "statsPopup"
        }),
        ad: common_vendor.p({
          type: "center"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-970fed46"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/exam/exam.js.map
