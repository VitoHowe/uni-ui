"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_wordPractice = require("../../stores/wordPractice.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (WordPracticeHeader + WordPracticePanel + _easycom_uni_icons + WordListTable + WordBookSelector)();
}
const WordPracticeHeader = () => "../../components/word-practice/WordPracticeHeader.js";
const WordPracticePanel = () => "../../components/word-practice/WordPracticePanel.js";
const WordListTable = () => "../../components/word-practice/WordListTable.js";
const WordBookSelector = () => "../../components/word-practice/WordBookSelector.js";
const PAGE_SIZE = 30;
const DICT_VOICE_URL = "https://dict.youdao.com/dictvoice?type=2&audio=";
const _sfc_main = {
  __name: "word-detail",
  setup(__props) {
    const store = stores_wordPractice.useWordPracticeStore();
    const searchKeyword = common_vendor.ref("");
    const currentPage = common_vendor.ref(1);
    const selectorVisible = common_vendor.ref(false);
    const initializing = common_vendor.ref(false);
    const pronunciationState = common_vendor.reactive({ loading: false, error: "" });
    let audioContext = null;
    const resetAudioContext = () => {
      if (!audioContext)
        return;
      audioContext.stop();
      audioContext.destroy();
      audioContext = null;
    };
    const filteredWords = common_vendor.computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase();
      if (!keyword)
        return store.currentWords;
      return store.currentWords.filter((word) => {
        var _a, _b;
        return ((_a = word.english) == null ? void 0 : _a.toLowerCase().includes(keyword)) || ((_b = word.chinese) == null ? void 0 : _b.includes(keyword));
      });
    });
    const totalPages = common_vendor.computed(() => Math.max(1, Math.ceil(filteredWords.value.length / PAGE_SIZE)));
    const paginatedWords = common_vendor.computed(() => {
      const start = (currentPage.value - 1) * PAGE_SIZE;
      return filteredWords.value.slice(start, start + PAGE_SIZE);
    });
    const heroStats = common_vendor.computed(() => [
      { label: "词汇总数", value: store.currentWords.length },
      { label: "已掌握", value: store.mastered.length },
      { label: "收藏", value: store.favorites.length }
    ]);
    const isFavorite = common_vendor.computed(() => store.currentWord && store.favorites.includes(store.currentWord.id));
    const masteryLabel = common_vendor.computed(() => {
      var _a;
      const wordId = (_a = store.currentWord) == null ? void 0 : _a.id;
      if (!wordId)
        return "未学习";
      if (store.mastered.includes(wordId))
        return "已掌握";
      if (store.mistakes.includes(wordId))
        return "待复习";
      return "未学习";
    });
    const nextPreview = common_vendor.computed(() => {
      var _a;
      if (!store.currentWords.length)
        return "--";
      const nextIndex = (store.currentWordIndex + 1) % store.currentWords.length;
      return ((_a = store.currentWords[nextIndex]) == null ? void 0 : _a.english) || "--";
    });
    const quickActions = common_vendor.computed(() => [
      {
        type: "random",
        name: "随机练习",
        desc: "打破顺序",
        count: "",
        icon: "loop",
        bg: "linear-gradient(135deg, #4f46e5, #7c3aed)"
      },
      {
        type: "favorites",
        name: "收藏夹",
        desc: "高频复习",
        count: store.favorites.length,
        icon: "star",
        bg: "linear-gradient(135deg, #f59e0b, #f97316)"
      },
      {
        type: "mistakes",
        name: "错词集",
        desc: "重新巩固",
        count: store.mistakes.length,
        icon: "closeempty",
        bg: "linear-gradient(135deg, #fb7185, #f43f5e)"
      }
    ]);
    const toDisplayWord = (word) => {
      var _a;
      if (!word)
        return null;
      return {
        ...word,
        bookName: word.bookName || ((_a = store.currentBook) == null ? void 0 : _a.name) || "未知词书"
      };
    };
    const favoriteWords = common_vendor.computed(() => {
      const map = new Map(store.currentWords.map((item) => [item.id, toDisplayWord(item)]));
      return store.favorites.map((id) => map.get(id)).filter(Boolean);
    });
    const mistakeWords = common_vendor.computed(() => {
      const map = new Map(store.currentWords.map((item) => [item.id, toDisplayWord(item)]));
      return store.mistakes.map((id) => map.get(id)).filter(Boolean);
    });
    const onSearchConfirm = () => {
      currentPage.value = 1;
    };
    const clearSearch = () => {
      searchKeyword.value = "";
    };
    common_vendor.watch(searchKeyword, () => {
      currentPage.value = 1;
    });
    const changePage = (direction) => {
      if (direction === "prev" && currentPage.value > 1) {
        currentPage.value -= 1;
      }
      if (direction === "next" && currentPage.value < totalPages.value) {
        currentPage.value += 1;
      }
    };
    const jumpRandom = () => {
      if (!filteredWords.value.length)
        return;
      const randomWord = filteredWords.value[Math.floor(Math.random() * filteredWords.value.length)];
      handleWordSelect(randomWord);
    };
    const handleQuickAction = (action) => {
      switch (action.type) {
        case "random":
          jumpRandom();
          break;
        case "favorites":
          favoriteWords.value.length ? handleWordSelect(favoriteWords.value[0]) : common_vendor.index.showToast({ title: "暂无收藏", icon: "none" });
          break;
        case "mistakes":
          mistakeWords.value.length ? handleWordSelect(mistakeWords.value[0]) : common_vendor.index.showToast({ title: "暂无错词", icon: "none" });
          break;
      }
    };
    const handleWordSelect = (word) => {
      if (!word)
        return;
      store.jumpToWord(word.id);
      jumpToPageForWord(word.id);
    };
    const jumpToPageForWord = (wordId) => {
      const index = filteredWords.value.findIndex((item) => item.id === wordId);
      if (index === -1)
        return;
      currentPage.value = Math.floor(index / PAGE_SIZE) + 1;
    };
    const markCurrentWord = (status) => {
      if (!store.currentWord)
        return;
      if (status === "mastered") {
        store.markMastered(store.currentWord.id);
        common_vendor.index.showToast({ title: "已标记为掌握", icon: "none" });
      } else {
        store.markMistake(store.currentWord.id);
        common_vendor.index.showToast({ title: "已加入错词", icon: "none" });
      }
      store.setCurrentWordIndex(store.currentWordIndex + 1);
    };
    const toggleFavorite = () => {
      if (!store.currentWord)
        return;
      const existed = store.favorites.includes(store.currentWord.id);
      store.toggleFavorite(store.currentWord.id);
      common_vendor.index.showToast({ title: existed ? "已移出收藏" : "已加入收藏", icon: "none" });
    };
    const handleSelectBook = async (book) => {
      if (!book)
        return;
      await store.selectBook(book.id);
      selectorVisible.value = false;
      searchKeyword.value = "";
    };
    const sanitizePronunciationText = (text) => {
      if (!text)
        return "";
      return text.replace(/\([^)]*\)/g, " ").replace(/[^a-zA-Z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
    };
    const playPronunciation = () => {
      if (!store.currentWord)
        return;
      if (!common_vendor.index.createInnerAudioContext) {
        common_vendor.index.showToast({ title: "当前环境不支持发音", icon: "none" });
        return;
      }
      pronunciationState.loading = true;
      pronunciationState.error = "";
      try {
        setupAudioContext();
        if (!audioContext) {
          pronunciationState.error = "发音组件初始化失败";
          return;
        }
        const candidate = store.currentWord.english || store.currentWord.word || "";
        const sanitized = sanitizePronunciationText(candidate);
        const finalQuery = sanitized || candidate;
        audioContext.stop();
        audioContext.src = `${DICT_VOICE_URL}${encodeURIComponent(finalQuery)}`;
        audioContext.play();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-detail.vue:309", "播放发音出错", error);
        pronunciationState.error = "发音服务异常，请稍后再试";
        resetAudioContext();
      } finally {
        pronunciationState.loading = false;
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
      audioContext.onError((error) => {
        common_vendor.index.__f__("error", "at pages/word-practice/word-detail.vue:325", "发音播放失败", error);
        pronunciationState.error = "无法获取发音，请稍后重试";
        pronunciationState.loading = false;
        resetAudioContext();
      });
    };
    const destroyAudioContext = () => {
      resetAudioContext();
    };
    const initDetailPage = async (bookId) => {
      if (initializing.value)
        return;
      initializing.value = true;
      try {
        if (!store.books.length) {
          await store.loadBooks();
        }
        if (bookId) {
          await store.selectBook(bookId);
        } else if (!store.selectedBookId && store.books.length) {
          await store.selectBook(store.books[0].id);
        }
        if (store.selectedBookId && !store.currentWords.length) {
          await store.loadWords(store.selectedBookId);
        }
      } finally {
        initializing.value = false;
      }
    };
    common_vendor.watch(filteredWords, () => {
      if ((currentPage.value - 1) * PAGE_SIZE >= filteredWords.value.length) {
        currentPage.value = 1;
      }
    });
    common_vendor.watch(
      () => store.selectedBookId,
      () => {
        currentPage.value = 1;
        searchKeyword.value = "";
      }
    );
    common_vendor.onLoad((options) => {
      const bookId = options == null ? void 0 : options.bookId;
      initDetailPage(bookId);
    });
    common_vendor.onMounted(() => {
      setupAudioContext();
    });
    common_vendor.onUnmounted(() => {
      destroyAudioContext();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(($event) => selectorVisible.value = true),
        b: common_vendor.p({
          book: common_vendor.unref(store).currentBook,
          ["learning-rate"]: common_vendor.unref(store).learningRate,
          stats: heroStats.value,
          loading: common_vendor.unref(store).wordsLoading || common_vendor.unref(store).booksLoading
        }),
        c: common_vendor.o(playPronunciation),
        d: common_vendor.o(toggleFavorite),
        e: common_vendor.o(($event) => markCurrentWord("mastered")),
        f: common_vendor.o(($event) => markCurrentWord("mistake")),
        g: common_vendor.o(($event) => common_vendor.unref(store).setCurrentWordIndex(common_vendor.unref(store).currentWordIndex + 1)),
        h: common_vendor.o(($event) => common_vendor.unref(store).setCurrentWordIndex(common_vendor.unref(store).currentWordIndex - 1)),
        i: common_vendor.p({
          word: common_vendor.unref(store).currentWord,
          index: common_vendor.unref(store).currentWordIndex,
          total: common_vendor.unref(store).currentWords.length,
          ["mastery-label"]: masteryLabel.value,
          ["is-favorite"]: isFavorite.value,
          ["next-preview"]: nextPreview.value,
          ["pronunciation-state"]: pronunciationState
        }),
        j: common_vendor.p({
          type: "search",
          size: "18",
          color: "#94a3b8"
        }),
        k: common_vendor.o(onSearchConfirm),
        l: searchKeyword.value,
        m: common_vendor.o(($event) => searchKeyword.value = $event.detail.value),
        n: searchKeyword.value
      }, searchKeyword.value ? {
        o: common_vendor.p({
          type: "closeempty",
          size: "16",
          color: "#94a3b8"
        }),
        p: common_vendor.o(clearSearch)
      } : {}, {
        q: common_vendor.t(filteredWords.value.length),
        r: common_vendor.t(currentPage.value),
        s: common_vendor.t(totalPages.value),
        t: common_vendor.o(jumpRandom),
        v: common_vendor.f(quickActions.value, (action, k0, i0) => {
          return {
            a: "22e2a63f-4-" + i0,
            b: common_vendor.p({
              type: action.icon,
              size: "18",
              color: "#fff"
            }),
            c: common_vendor.t(action.name),
            d: common_vendor.t(action.desc),
            e: common_vendor.t(action.count),
            f: action.type,
            g: action.bg,
            h: common_vendor.o(($event) => handleQuickAction(action), action.type)
          };
        }),
        w: common_vendor.o(changePage),
        x: common_vendor.o(handleWordSelect),
        y: common_vendor.p({
          words: paginatedWords.value,
          ["current-page"]: currentPage.value,
          ["total-pages"]: totalPages.value
        }),
        z: common_vendor.o(($event) => selectorVisible.value = false),
        A: common_vendor.o(handleSelectBook),
        B: common_vendor.p({
          visible: selectorVisible.value,
          books: common_vendor.unref(store).books,
          ["selected-book-id"]: common_vendor.unref(store).selectedBookId,
          loading: common_vendor.unref(store).booksLoading
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-22e2a63f"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/word-practice/word-detail.js.map
