"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_wordBank = require("../../utils/wordBank.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_icons2 + _easycom_uni_section2 + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_section + _easycom_uni_list_item + _easycom_uni_list)();
}
const WORD_PROGRESS_KEY = "WORD_PRACTICE_PROGRESS";
const PAGE_SIZE = 30;
const _sfc_main = {
  __name: "word-practice",
  setup(__props) {
    const allowedWordIds = new Set(utils_wordBank.wordIds);
    const readProgress = () => {
      try {
        const snapshot = common_vendor.index.getStorageSync(WORD_PROGRESS_KEY) || {};
        const normalize = (list) => Array.isArray(list) ? list.filter((id) => allowedWordIds.has(id)) : [];
        return {
          favorites: normalize(snapshot.favorites),
          mastered: normalize(snapshot.mastered),
          review: normalize(snapshot.review)
        };
      } catch (error) {
        common_vendor.index.__f__("warn", "at pages/word-practice/word-practice.vue:188", "读取单词进度失败", error);
        return { favorites: [], mastered: [], review: [] };
      }
    };
    const persistProgress = (state) => {
      common_vendor.index.setStorageSync(WORD_PROGRESS_KEY, {
        favorites: state.favorites,
        mastered: state.mastered,
        review: state.review
      });
    };
    const progressState = common_vendor.reactive(readProgress());
    const wordPracticeList = common_vendor.ref(
      utils_wordBank.wordBank.map((item) => ({
        ...item,
        bookmarked: progressState.favorites.includes(item.id),
        mastery: progressState.mastered.includes(item.id) ? "mastered" : progressState.review.includes(item.id) ? "review" : "pending"
      }))
    );
    const currentWordIndex = common_vendor.ref(0);
    const searchKeyword = common_vendor.ref("");
    const currentPage = common_vendor.ref(1);
    const pronunciationState = common_vendor.reactive({
      loading: false,
      error: ""
    });
    let audioContext = null;
    const masteryMap = {
      mastered: "已掌握",
      review: "待复习",
      pending: "待学习"
    };
    const currentWord = common_vendor.computed(() => wordPracticeList.value[currentWordIndex.value] || null);
    const favoriteWords = common_vendor.computed(() => wordPracticeList.value.filter((item) => item.bookmarked));
    const reviewWords = common_vendor.computed(() => wordPracticeList.value.filter((item) => item.mastery === "review"));
    const learningRate = common_vendor.computed(() => {
      if (!wordPracticeList.value.length)
        return 0;
      return Math.round(progressState.mastered.length / wordPracticeList.value.length * 100);
    });
    const heroStats = common_vendor.computed(() => [
      { label: "词库总量", value: wordPracticeList.value.length },
      { label: "已掌握", value: progressState.mastered.length },
      { label: "收藏夹", value: progressState.favorites.length }
    ]);
    const filteredWords = common_vendor.computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase();
      if (!keyword)
        return wordPracticeList.value;
      return wordPracticeList.value.filter((item) => {
        return item.english.toLowerCase().includes(keyword) || item.chinese.includes(keyword);
      });
    });
    const totalPages = common_vendor.computed(() => Math.max(1, Math.ceil(filteredWords.value.length / PAGE_SIZE)));
    const paginatedWords = common_vendor.computed(() => {
      const start = (currentPage.value - 1) * PAGE_SIZE;
      return filteredWords.value.slice(start, start + PAGE_SIZE);
    });
    const nextWordPreview = common_vendor.computed(() => {
      if (!wordPracticeList.value.length)
        return "--";
      const nextIndex = (currentWordIndex.value + 1) % wordPracticeList.value.length;
      return wordPracticeList.value[nextIndex].english;
    });
    const quickActions = common_vendor.computed(() => [
      {
        type: "random",
        name: "随机抽词",
        desc: "灵感练习",
        count: "",
        icon: "loop",
        bg: "#7a86ff"
      },
      {
        type: "favorites",
        name: "收藏夹",
        desc: "重点词汇",
        count: favoriteWords.value.length,
        icon: "star",
        bg: "#ffb347"
      },
      {
        type: "review",
        name: "待复习",
        desc: "错题本",
        count: reviewWords.value.length,
        icon: "closeempty",
        bg: "#ff6b6b"
      },
      {
        type: "list",
        name: "全部词汇",
        desc: "跳至列表",
        count: filteredWords.value.length,
        icon: "list",
        bg: "#5ad8a6"
      }
    ]);
    const updateProgressArrays = (wordId, type) => {
      const removeFrom = (arr) => arr.filter((id) => id !== wordId);
      if (type === "mastered") {
        progressState.mastered = Array.from(/* @__PURE__ */ new Set([...removeFrom(progressState.mastered), wordId]));
        progressState.review = removeFrom(progressState.review);
      } else if (type === "review") {
        progressState.review = Array.from(/* @__PURE__ */ new Set([...removeFrom(progressState.review), wordId]));
        progressState.mastered = removeFrom(progressState.mastered);
      }
      persistProgress(progressState);
    };
    const toggleBookmark = (word) => {
      word.bookmarked = !word.bookmarked;
      if (word.bookmarked) {
        if (!progressState.favorites.includes(word.id)) {
          progressState.favorites.push(word.id);
        }
        common_vendor.index.showToast({ title: "已加入收藏", icon: "none" });
      } else {
        progressState.favorites = progressState.favorites.filter((id) => id !== word.id);
        common_vendor.index.showToast({ title: "已取消收藏", icon: "none" });
      }
      persistProgress(progressState);
    };
    const markWord = (status) => {
      if (!currentWord.value)
        return;
      currentWord.value.mastery = status;
      updateProgressArrays(currentWord.value.id, status);
      const toastText = status === "mastered" ? "标记为已掌握" : "已加入待复习";
      common_vendor.index.showToast({ title: toastText, icon: "none" });
      switchWord("next");
    };
    const switchWord = (direction) => {
      if (!wordPracticeList.value.length)
        return;
      if (direction === "next") {
        currentWordIndex.value = (currentWordIndex.value + 1) % wordPracticeList.value.length;
      } else {
        currentWordIndex.value = (currentWordIndex.value - 1 + wordPracticeList.value.length) % wordPracticeList.value.length;
      }
      pronunciationState.error = "";
    };
    const changePage = (direction) => {
      if (direction === "prev" && currentPage.value > 1) {
        currentPage.value -= 1;
      }
      if (direction === "next" && currentPage.value < totalPages.value) {
        currentPage.value += 1;
      }
    };
    const resetFilters = () => {
      searchKeyword.value = "";
      currentPage.value = 1;
    };
    const onSearchConfirm = () => {
      currentPage.value = 1;
    };
    const clearSearch = () => {
      searchKeyword.value = "";
    };
    common_vendor.watch(searchKeyword, () => {
      currentPage.value = 1;
    });
    const handleQuickAction = (action) => {
      if (action.type === "list") {
        common_vendor.index.pageScrollTo({
          selector: ".word-list-section",
          duration: 300
        });
        return;
      }
      if (action.type === "random") {
        jumpRandom();
        return;
      }
      if (action.type === "favorites") {
        if (!favoriteWords.value.length) {
          common_vendor.index.showToast({ title: "暂无收藏", icon: "none" });
          return;
        }
        jumpToWord(favoriteWords.value[0].id);
        common_vendor.index.showToast({ title: "已定位到收藏单词", icon: "none" });
        return;
      }
      if (action.type === "review") {
        if (!reviewWords.value.length) {
          common_vendor.index.showToast({ title: "暂无待复习", icon: "none" });
          return;
        }
        jumpToWord(reviewWords.value[0].id);
        common_vendor.index.showToast({ title: "已定位到待复习单词", icon: "none" });
      }
    };
    const jumpRandom = () => {
      if (!filteredWords.value.length)
        return;
      const randomWord = filteredWords.value[Math.floor(Math.random() * filteredWords.value.length)];
      jumpToWord(randomWord.id);
    };
    const jumpToWord = (wordId) => {
      const index = wordPracticeList.value.findIndex((item) => item.id === wordId);
      if (index !== -1) {
        jumpToPageForWord(wordId);
        currentWordIndex.value = index;
        pronunciationState.error = "";
      }
    };
    const setupAudioContext = () => {
      if (audioContext || !common_vendor.index.createInnerAudioContext)
        return;
      audioContext = common_vendor.index.createInnerAudioContext();
      audioContext.obeyMuteSwitch = false;
      audioContext.onStop(() => {
        pronunciationState.error = "";
      });
      audioContext.onError((err) => {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:424", "音频播放失败", err);
        pronunciationState.error = "音频播放失败，请检查网络";
      });
    };
    const playPronunciation = async () => {
      if (!currentWord.value)
        return;
      if (!common_vendor.index.createInnerAudioContext) {
        common_vendor.index.showToast({ title: "当前环境不支持音频", icon: "none" });
        return;
      }
      pronunciationState.error = "";
      pronunciationState.loading = true;
      try {
        setupAudioContext();
        if (!audioContext) {
          pronunciationState.error = "发音组件初始化失败";
          return;
        }
        const audioUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(currentWord.value.english)}`;
        audioContext.src = audioUrl;
        audioContext.play();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:447", "播放发音失败", error);
        pronunciationState.error = "发音接口异常，请稍后再试";
      } finally {
        pronunciationState.loading = false;
      }
    };
    const jumpToPageForWord = (wordId) => {
      const index = filteredWords.value.findIndex((item) => item.id === wordId);
      if (index === -1)
        return;
      currentPage.value = Math.floor(index / PAGE_SIZE) + 1;
    };
    common_vendor.watch(filteredWords, () => {
      if ((currentPage.value - 1) * PAGE_SIZE >= filteredWords.value.length) {
        currentPage.value = 1;
      }
    });
    common_vendor.onMounted(() => {
      setupAudioContext();
    });
    common_vendor.onUnmounted(() => {
      if (audioContext) {
        audioContext.stop();
        audioContext.destroy();
        audioContext = null;
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(wordPracticeList.value.length),
        b: common_vendor.t(learningRate.value),
        c: common_vendor.f(heroStats.value, (stat, k0, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: common_vendor.t(stat.label),
            c: stat.label
          };
        }),
        d: common_vendor.p({
          type: "search",
          size: "18",
          color: "#65728a"
        }),
        e: common_vendor.o(onSearchConfirm),
        f: searchKeyword.value,
        g: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        h: searchKeyword.value
      }, searchKeyword.value ? {
        i: common_vendor.p({
          type: "closeempty",
          size: "16",
          color: "#65728a"
        }),
        j: common_vendor.o(clearSearch)
      } : {}, {
        k: common_vendor.t(filteredWords.value.length),
        l: common_vendor.t(currentPage.value),
        m: common_vendor.t(totalPages.value),
        n: common_vendor.o(jumpRandom),
        o: searchKeyword.value
      }, searchKeyword.value ? {
        p: common_vendor.o(resetFilters)
      } : {}, {
        q: common_vendor.f(quickActions.value, (action, k0, i0) => {
          return {
            a: "2dd63b0c-3-" + i0 + ",2dd63b0c-2",
            b: common_vendor.p({
              type: action.icon,
              size: "20",
              color: "#fff"
            }),
            c: action.bg,
            d: common_vendor.t(action.name),
            e: common_vendor.t(action.desc),
            f: common_vendor.t(action.count),
            g: action.type,
            h: common_vendor.o(($event) => handleQuickAction(action), action.type)
          };
        }),
        r: common_vendor.p({
          title: "功能入口",
          type: "line",
          padding: true
        }),
        s: currentWord.value
      }, currentWord.value ? common_vendor.e({
        t: common_vendor.t(currentWord.value.english),
        v: common_vendor.t(currentWord.value.chinese),
        w: common_vendor.t(currentWord.value.english.charAt(0).toUpperCase()),
        x: common_vendor.p({
          type: "sound",
          size: "18",
          color: "#fff"
        }),
        y: common_vendor.o(playPronunciation),
        z: common_vendor.p({
          type: "star",
          size: "18",
          color: currentWord.value.bookmarked ? "#f7b500" : "#fff"
        }),
        A: common_vendor.t(currentWord.value.bookmarked ? "已收藏" : "收藏"),
        B: common_vendor.o(($event) => toggleBookmark(currentWord.value)),
        C: common_vendor.p({
          type: "checkmarkempty",
          size: "18",
          color: "#fff"
        }),
        D: common_vendor.o(($event) => markWord("mastered")),
        E: common_vendor.p({
          type: "refresh",
          size: "18",
          color: "#fff"
        }),
        F: common_vendor.o(($event) => markWord("review")),
        G: common_vendor.t(currentWordIndex.value + 1),
        H: common_vendor.t(wordPracticeList.value.length),
        I: common_vendor.t(masteryMap[currentWord.value.mastery]),
        J: pronunciationState.error
      }, pronunciationState.error ? {
        K: common_vendor.t(pronunciationState.error)
      } : {}, {
        L: common_vendor.o(($event) => switchWord("prev")),
        M: common_vendor.o(($event) => switchWord("next")),
        N: common_vendor.t(nextWordPreview.value)
      }) : {
        O: common_vendor.p({
          type: "info",
          size: "32",
          color: "#999"
        })
      }, {
        P: common_vendor.p({
          title: "当前单词",
          type: "line",
          padding: true
        }),
        Q: favoriteWords.value.length
      }, favoriteWords.value.length ? {
        R: common_vendor.f(favoriteWords.value, (word, k0, i0) => {
          return {
            a: common_vendor.t(word.english),
            b: common_vendor.t(word.chinese),
            c: word.id,
            d: common_vendor.o(($event) => jumpToWord(word.id), word.id)
          };
        })
      } : {
        S: common_vendor.p({
          type: "star",
          size: "34",
          color: "#f7b500"
        })
      }, {
        T: common_vendor.p({
          title: "收藏夹",
          type: "line",
          padding: true
        }),
        U: reviewWords.value.length
      }, reviewWords.value.length ? {
        V: common_vendor.f(reviewWords.value, (word, k0, i0) => {
          return {
            a: common_vendor.t(word.english),
            b: common_vendor.t(word.chinese),
            c: word.id,
            d: common_vendor.o(($event) => jumpToWord(word.id), word.id)
          };
        })
      } : {
        W: common_vendor.p({
          type: "checkmarkempty",
          size: "34",
          color: "#28a745"
        })
      }, {
        X: common_vendor.p({
          title: "待复习 / 错题本",
          type: "line",
          padding: true
        }),
        Y: common_vendor.f(paginatedWords.value, (word, k0, i0) => {
          return {
            a: "2dd63b0c-17-" + i0 + "," + ("2dd63b0c-16-" + i0),
            b: common_vendor.p({
              type: word.bookmarked ? "star" : "sound",
              size: "18",
              color: word.bookmarked ? "#f7b500" : "#36cfc9"
            }),
            c: word.id,
            d: common_vendor.o(($event) => jumpToWord(word.id), word.id),
            e: "2dd63b0c-16-" + i0 + ",2dd63b0c-15",
            f: common_vendor.p({
              title: word.english,
              note: word.chinese,
              rightText: masteryMap[word.mastery],
              clickable: true
            })
          };
        }),
        Z: currentPage.value === 1 ? 1 : "",
        aa: common_vendor.o(($event) => changePage("prev")),
        ab: common_vendor.t(currentPage.value),
        ac: common_vendor.t(totalPages.value),
        ad: currentPage.value === totalPages.value ? 1 : "",
        ae: common_vendor.o(($event) => changePage("next")),
        af: common_vendor.p({
          title: "单词列表",
          type: "line",
          padding: true
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2dd63b0c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/word-practice/word-practice.js.map
