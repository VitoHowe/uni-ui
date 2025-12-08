"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_constants = require("../../utils/constants.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _component_uni_progress = common_vendor.resolveComponent("uni-progress");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_easycom_uni_icons2 + _component_uni_progress + _easycom_uni_list_item2 + _easycom_uni_list2 + _easycom_uni_popup2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_list_item + _easycom_uni_list + _easycom_uni_popup)();
}
const _sfc_main = {
  __name: "word-practice",
  setup(__props) {
    const state = common_vendor.reactive({
      wordBooks: [],
      selectedBook: null,
      words: [],
      summary: {
        total: 0,
        mastered: 0,
        review: 0,
        favorites: 0,
        wrongs: 0,
        last_word_entry_id: null,
        last_word_order_index: null
      },
      practiceFilter: "all",
      paging: {
        page: 1,
        limit: 50,
        total: 0,
        loading: false,
        finished: false
      }
    });
    const drawerState = common_vendor.reactive({
      visible: false,
      list: [],
      page: 1,
      limit: 50,
      total: 0,
      loading: false,
      finished: false
    });
    const currentIndex = common_vendor.ref(0);
    const pronunciationState = common_vendor.reactive({
      loading: false,
      error: ""
    });
    let audioContext = null;
    const drawerRef = common_vendor.ref(null);
    const practiceModes = [
      { label: "全部", value: "all" },
      { label: "收藏", value: "favorite" },
      { label: "错题", value: "wrong" }
    ];
    const practiceList = common_vendor.computed(() => {
      if (state.practiceFilter === "favorite") {
        return state.words.filter((item) => item.is_favorite);
      }
      if (state.practiceFilter === "wrong") {
        return state.words.filter((item) => item.wrong_count > 0);
      }
      return state.words;
    });
    const currentWord = common_vendor.computed(() => {
      if (!practiceList.value.length)
        return null;
      const idx = Math.min(currentIndex.value, practiceList.value.length - 1);
      return practiceList.value[idx];
    });
    const favoriteWords = common_vendor.computed(() => state.words.filter((item) => item.is_favorite));
    const wrongWords = common_vendor.computed(() => state.words.filter((item) => item.wrong_count > 0));
    const learningRate = common_vendor.computed(() => {
      if (!state.summary.total)
        return 0;
      return Math.round(state.summary.mastered / state.summary.total * 100);
    });
    const summaryStats = common_vendor.computed(() => [
      { label: "词书总量", value: state.summary.total },
      { label: "已掌握", value: state.summary.mastered },
      { label: "待复习", value: state.summary.review },
      { label: "收藏", value: state.summary.favorites }
    ]);
    const practicePosition = common_vendor.computed(() => {
      if (!currentWord.value || !practiceList.value.length)
        return "-- / --";
      return `${currentIndex.value + 1} / ${practiceList.value.length}`;
    });
    const masteryLabel = (status) => {
      if (status === "mastered")
        return "已掌握";
      if (status === "review")
        return "待复习";
      return "未学习";
    };
    const openBookPicker = () => {
      common_vendor.index.showActionSheet({
        itemList: state.wordBooks.map((b) => b.name),
        success: (res) => {
          const book = state.wordBooks[res.tapIndex];
          if (book)
            selectBook(book);
        }
      });
    };
    const fetchBooks = async () => {
      try {
        const res = await utils_request.request.get(utils_constants.API_ENDPOINTS.WORD.BOOKS, { limit: 50 }, { showLoading: false });
        const books = (res == null ? void 0 : res.books) || (res == null ? void 0 : res.data) || res || [];
        state.wordBooks = books;
        if (!state.selectedBook && books.length) {
          selectBook(books[0]);
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:329", "获取单词书失败", error);
        common_vendor.index.showToast({ title: "获取单词书失败", icon: "none" });
      }
    };
    const selectBook = async (book) => {
      state.selectedBook = book;
      currentIndex.value = 0;
      await loadBookData();
    };
    const openListDrawer = async () => {
      var _a;
      (_a = drawerRef.value) == null ? void 0 : _a.open();
      drawerState.visible = true;
      if (!drawerState.list.length) {
        await loadDrawerPage(1, false);
      }
    };
    const closeListDrawer = () => {
      var _a;
      (_a = drawerRef.value) == null ? void 0 : _a.close();
    };
    const onDrawerChange = (e) => {
      drawerState.visible = !!e.show;
    };
    const loadDrawerPage = async (page = 1, append = false) => {
      if (!state.selectedBook)
        return;
      if (drawerState.loading)
        return;
      drawerState.loading = true;
      try {
        const res = await utils_request.request.get(
          `${utils_constants.API_ENDPOINTS.WORD.BOOK_WORDS}/${state.selectedBook.id}/words`,
          { page, limit: drawerState.limit },
          { showLoading: false }
        );
        const list = ((res == null ? void 0 : res.list) || (res == null ? void 0 : res.words) || res || []).map(normalizeWord);
        if (append) {
          drawerState.list = drawerState.list.concat(list);
        } else {
          drawerState.list = list;
        }
        drawerState.page = page;
        drawerState.total = (res == null ? void 0 : res.total) || drawerState.list.length;
        drawerState.finished = drawerState.list.length >= drawerState.total;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:377", "抽屉列表加载失败", error);
        common_vendor.index.showToast({ title: "列表加载失败", icon: "none" });
      } finally {
        drawerState.loading = false;
      }
    };
    const loadMoreDrawer = async () => {
      if (drawerState.finished || drawerState.loading)
        return;
      await loadDrawerPage(drawerState.page + 1, true);
    };
    const normalizeWord = (item) => ({
      ...item,
      is_favorite: !!item.is_favorite,
      wrong_count: Number(item.wrong_count || 0),
      status: item.status || "pending"
    });
    const fetchPracticeWords = async (page = 1, append = false) => {
      if (!state.selectedBook)
        return;
      if (state.paging.loading)
        return;
      state.paging.loading = true;
      try {
        const res = await utils_request.request.get(
          `${utils_constants.API_ENDPOINTS.WORD.BOOK_WORDS}/${state.selectedBook.id}/words`,
          { page, limit: state.paging.limit },
          { showLoading: false }
        );
        const list = ((res == null ? void 0 : res.list) || (res == null ? void 0 : res.words) || res || []).map(normalizeWord);
        if (append) {
          state.words = state.words.concat(list);
        } else {
          state.words = list;
        }
        state.paging.page = page;
        state.paging.total = (res == null ? void 0 : res.total) || state.summary.total || state.words.length;
        state.paging.finished = state.words.length >= state.paging.total;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:416", "获取单词失败", error);
        common_vendor.index.showToast({ title: "单词加载失败", icon: "none" });
      } finally {
        state.paging.loading = false;
      }
    };
    const loadBookData = async () => {
      if (!state.selectedBook)
        return;
      state.paging.page = 1;
      state.paging.total = 0;
      state.paging.finished = false;
      state.words = [];
      drawerState.list = [];
      drawerState.page = 1;
      drawerState.total = 0;
      drawerState.finished = false;
      try {
        const bookId = state.selectedBook.id;
        const [summaryRes, stateRes] = await Promise.all([
          utils_request.request.get(`${utils_constants.API_ENDPOINTS.WORD.PROGRESS}/${bookId}/progress`, {}, { showLoading: false }),
          utils_request.request.get(`${utils_constants.API_ENDPOINTS.WORD.STATE}/${bookId}/state`, {}, { showLoading: false })
        ]);
        state.summary = {
          total: (summaryRes == null ? void 0 : summaryRes.total) || 0,
          mastered: (summaryRes == null ? void 0 : summaryRes.mastered) || 0,
          review: (summaryRes == null ? void 0 : summaryRes.review) || 0,
          favorites: (summaryRes == null ? void 0 : summaryRes.favorites) || 0,
          wrongs: (summaryRes == null ? void 0 : summaryRes.wrongs) || 0,
          last_word_entry_id: (summaryRes == null ? void 0 : summaryRes.last_word_entry_id) || null,
          last_word_order_index: (summaryRes == null ? void 0 : summaryRes.last_word_order_index) || null
        };
        const initialPage = state.summary.last_word_order_index && state.paging.limit ? Math.ceil(state.summary.last_word_order_index / state.paging.limit) : 1;
        await fetchPracticeWords(initialPage, false);
        if (stateRes == null ? void 0 : stateRes.last_word_entry_id) {
          const idx = state.words.findIndex((w) => w.id === stateRes.last_word_entry_id);
          currentIndex.value = idx >= 0 ? idx : 0;
        } else {
          currentIndex.value = 0;
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:465", "加载词书数据失败", error);
        common_vendor.index.showToast({ title: "加载词书失败", icon: "none" });
      }
    };
    const changePracticeFilter = (mode) => {
      state.practiceFilter = mode;
      currentIndex.value = 0;
    };
    const jumpRandom = () => {
      if (!practiceList.value.length)
        return;
      const randomIndex = Math.floor(Math.random() * practiceList.value.length);
      currentIndex.value = randomIndex;
      savePracticeState();
    };
    const jumpToWord = (wordId) => {
      const idx = practiceList.value.findIndex((w) => w.id === wordId);
      if (idx !== -1) {
        currentIndex.value = idx;
        savePracticeState();
        common_vendor.index.showToast({ title: "已切换到该单词", icon: "none" });
        closeListDrawer();
      }
    };
    const updateProgressLocal = (wordId, updater) => {
      const target = state.words.find((w) => w.id === wordId);
      if (target) {
        updater(target);
      }
    };
    const updateWordProgress = async (word, payload) => {
      if (!state.selectedBook)
        return;
      await utils_request.request.post(
        `${utils_constants.API_ENDPOINTS.WORD.PROGRESS}/${state.selectedBook.id}/progress`,
        { word_entry_id: word.id, ...payload },
        { showLoading: false }
      );
    };
    const markWord = async (status) => {
      if (!currentWord.value)
        return;
      try {
        await updateWordProgress(currentWord.value, { status });
        updateProgressLocal(currentWord.value.id, (item) => {
          item.status = status;
        });
        refreshSummaryCounters();
        switchWord("next");
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:518", "更新状态失败", error);
        common_vendor.index.showToast({ title: "更新状态失败", icon: "none" });
      }
    };
    const markWrong = async () => {
      if (!currentWord.value)
        return;
      try {
        await updateWordProgress(currentWord.value, { wrong_delta: 1, status: "review" });
        updateProgressLocal(currentWord.value.id, (item) => {
          item.wrong_count = Number(item.wrong_count || 0) + 1;
          item.status = "review";
        });
        refreshSummaryCounters();
        common_vendor.index.showToast({ title: "已加入错题本", icon: "none" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:534", "标记错题失败", error);
        common_vendor.index.showToast({ title: "标记失败", icon: "none" });
      }
    };
    const toggleFavorite = async (word) => {
      try {
        const next = !word.is_favorite;
        await updateWordProgress(word, { is_favorite: next });
        updateProgressLocal(word.id, (item) => {
          item.is_favorite = next;
        });
        refreshSummaryCounters();
        common_vendor.index.showToast({ title: next ? "已收藏" : "已取消收藏", icon: "none" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:549", "收藏失败", error);
        common_vendor.index.showToast({ title: "收藏失败", icon: "none" });
      }
    };
    const refreshSummaryCounters = () => {
      state.summary.mastered = state.words.filter((w) => w.status === "mastered").length;
      state.summary.review = state.words.filter((w) => w.status === "review").length;
      state.summary.favorites = state.words.filter((w) => w.is_favorite).length;
      state.summary.wrongs = state.words.filter((w) => w.wrong_count > 0).length;
    };
    const switchWord = async (direction) => {
      if (!practiceList.value.length)
        return;
      if (direction === "next") {
        if (currentIndex.value + 1 >= practiceList.value.length && !state.paging.finished) {
          await fetchPracticeWords(state.paging.page + 1, true);
        }
        currentIndex.value = Math.min(currentIndex.value + 1, practiceList.value.length - 1);
      } else {
        currentIndex.value = (currentIndex.value - 1 + practiceList.value.length) % practiceList.value.length;
      }
      savePracticeState();
    };
    const savePracticeState = async () => {
      if (!state.selectedBook)
        return;
      const word = currentWord.value;
      try {
        await utils_request.request.post(
          `${utils_constants.API_ENDPOINTS.WORD.STATE}/${state.selectedBook.id}/state`,
          {
            last_word_entry_id: (word == null ? void 0 : word.id) || null,
            last_word_order_index: (word == null ? void 0 : word.order_index) || null
          },
          { showLoading: false }
        );
      } catch (error) {
        common_vendor.index.__f__("warn", "at pages/word-practice/word-practice.vue:588", "保存学习位置失败", error);
      }
    };
    const setupAudioContext = () => {
      if (audioContext || !common_vendor.index.createInnerAudioContext)
        return;
      audioContext = common_vendor.index.createInnerAudioContext();
      audioContext.obeyMuteSwitch = false;
      audioContext.onError((err) => {
        pronunciationState.error = "发音播放失败，请稍后重试";
        common_vendor.index.__f__("error", "at pages/word-practice/word-practice.vue:598", "音频错误", err);
      });
    };
    const playPronunciation = async () => {
      if (!currentWord.value)
        return;
      pronunciationState.error = "";
      pronunciationState.loading = true;
      setupAudioContext();
      if (!audioContext) {
        pronunciationState.error = "当前环境不支持音频播放";
        pronunciationState.loading = false;
        return;
      }
      const text = encodeURIComponent(currentWord.value.word);
      const audioUrls = [
        `https://tts.baidu.com/text2audio?lan=en&ie=UTF-8&text=${text}`,
        `https://dict.youdao.com/dictvoice?type=2&audio=${text}`,
        `https://tts.iciba.com/tts.php?text=${text}`
      ];
      const tryPlay = (index) => {
        if (index >= audioUrls.length) {
          pronunciationState.error = "发音接口异常，请稍后重试";
          pronunciationState.loading = false;
          return;
        }
        audioContext.src = audioUrls[index];
        audioContext.play();
        audioContext.onError(() => {
          tryPlay(index + 1);
        });
        audioContext.onStop(() => {
          pronunciationState.loading = false;
        });
      };
      tryPlay(0);
    };
    common_vendor.onMounted(() => {
      fetchBooks();
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
        a: common_vendor.t(_ctx.selectedBook ? _ctx.selectedBook.name : "请选择单词书"),
        b: common_vendor.p({
          type: "arrowdown",
          size: "16",
          color: "#0f62fe"
        }),
        c: common_vendor.o(openBookPicker),
        d: common_vendor.p({
          type: "list",
          size: "16",
          color: "#0f62fe"
        }),
        e: common_vendor.o(openListDrawer),
        f: common_vendor.f(summaryStats.value, (stat, k0, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: common_vendor.t(stat.label),
            c: stat.label
          };
        }),
        g: common_vendor.p({
          percent: learningRate.value,
          color: "#0f62fe",
          active: true,
          ["stroke-width"]: "8"
        }),
        h: common_vendor.t(learningRate.value),
        i: state.wordBooks.length
      }, state.wordBooks.length ? {
        j: common_vendor.f(state.wordBooks, (book, k0, i0) => {
          return {
            a: common_vendor.t(book.name),
            b: common_vendor.t(book.total_words || book.total || 0),
            c: book.id,
            d: _ctx.selectedBook && _ctx.selectedBook.id === book.id ? 1 : "",
            e: common_vendor.o(($event) => selectBook(book), book.id)
          };
        })
      } : {
        k: common_vendor.p({
          type: "info",
          size: "24",
          color: "#8c8c8c"
        })
      }, {
        l: common_vendor.f(practiceModes, (mode, k0, i0) => {
          return {
            a: common_vendor.t(mode.label),
            b: mode.value,
            c: state.practiceFilter === mode.value ? 1 : "",
            d: common_vendor.o(($event) => changePracticeFilter(mode.value), mode.value)
          };
        }),
        m: common_vendor.p({
          type: "loop",
          size: "18",
          color: "#fff"
        }),
        n: common_vendor.o(jumpRandom),
        o: common_vendor.p({
          type: "list",
          size: "18",
          color: "#0f62fe"
        }),
        p: common_vendor.o(openListDrawer),
        q: currentWord.value
      }, currentWord.value ? common_vendor.e({
        r: common_vendor.t(currentWord.value.word),
        s: currentWord.value.phonetic
      }, currentWord.value.phonetic ? {
        t: common_vendor.t(currentWord.value.phonetic)
      } : {}, {
        v: common_vendor.t(currentWord.value.translation),
        w: common_vendor.t(currentWord.value.order_index),
        x: common_vendor.p({
          type: "sound",
          size: "18",
          color: "#fff"
        }),
        y: common_vendor.o(playPronunciation),
        z: common_vendor.p({
          type: "star",
          size: "18",
          color: currentWord.value.is_favorite ? "#fff" : "#fff"
        }),
        A: common_vendor.t(currentWord.value.is_favorite ? "已收藏" : "收藏"),
        B: currentWord.value.is_favorite ? 1 : "",
        C: common_vendor.o(($event) => toggleFavorite(currentWord.value)),
        D: common_vendor.p({
          type: "checkmarkempty",
          size: "18",
          color: "#fff"
        }),
        E: common_vendor.o(($event) => markWord("mastered")),
        F: common_vendor.p({
          type: "refresh",
          size: "18",
          color: "#fff"
        }),
        G: common_vendor.o(($event) => markWord("review")),
        H: common_vendor.p({
          type: "closeempty",
          size: "18",
          color: "#fff"
        }),
        I: common_vendor.o(markWrong),
        J: common_vendor.t(practicePosition.value),
        K: common_vendor.t(masteryLabel(currentWord.value.status)),
        L: pronunciationState.error
      }, pronunciationState.error ? {
        M: common_vendor.t(pronunciationState.error)
      } : {}, {
        N: common_vendor.o(($event) => switchWord("prev")),
        O: common_vendor.o(($event) => switchWord("next"))
      }) : {
        P: common_vendor.p({
          type: "info",
          size: "28",
          color: "#8c8c8c"
        })
      }, {
        Q: common_vendor.p({
          type: "closeempty",
          size: "18",
          color: "#4b5563"
        }),
        R: common_vendor.o(closeListDrawer),
        S: common_vendor.f(drawerState.list, (word, k0, i0) => {
          return {
            a: "2dd63b0c-16-" + i0 + "," + ("2dd63b0c-15-" + i0),
            b: common_vendor.p({
              type: word.is_favorite ? "star" : "sound",
              size: "18",
              color: "#fff"
            }),
            c: word.is_favorite ? 1 : "",
            d: word.id,
            e: common_vendor.o(($event) => jumpToWord(word.id), word.id),
            f: "2dd63b0c-15-" + i0 + ",2dd63b0c-14",
            g: common_vendor.p({
              title: word.word,
              note: word.translation,
              rightText: masteryLabel(word.status),
              clickable: true
            })
          };
        }),
        T: drawerState.loading
      }, drawerState.loading ? {} : drawerState.finished ? {} : {}, {
        U: drawerState.finished,
        V: common_vendor.o(loadMoreDrawer),
        W: common_vendor.sr(drawerRef, "2dd63b0c-12", {
          "k": "drawerRef"
        }),
        X: common_vendor.o(onDrawerChange),
        Y: common_vendor.p({
          type: "bottom",
          ["mask-click"]: true
        }),
        Z: favoriteWords.value.length
      }, favoriteWords.value.length ? {
        aa: common_vendor.f(favoriteWords.value, (word, k0, i0) => {
          return {
            a: common_vendor.t(word.word),
            b: common_vendor.t(word.translation),
            c: word.id,
            d: common_vendor.o(($event) => jumpToWord(word.id), word.id)
          };
        })
      } : {
        ab: common_vendor.p({
          type: "star",
          size: "24",
          color: "#f7b500"
        })
      }, {
        ac: wrongWords.value.length
      }, wrongWords.value.length ? {
        ad: common_vendor.f(wrongWords.value, (word, k0, i0) => {
          return {
            a: common_vendor.t(word.word),
            b: common_vendor.t(word.translation),
            c: word.id,
            d: common_vendor.o(($event) => jumpToWord(word.id), word.id)
          };
        })
      } : {
        ae: common_vendor.p({
          type: "closeempty",
          size: "24",
          color: "#ff6b6b"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2dd63b0c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/word-practice/word-practice.js.map
