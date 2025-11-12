"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_wordPractice = require("../../stores/wordPractice.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (_easycom_uni_icons + WordBookSelector)();
}
const WordBookSelector = () => "../../components/word-practice/WordBookSelector.js";
const _sfc_main = {
  __name: "word-practice",
  setup(__props) {
    const store = stores_wordPractice.useWordPracticeStore();
    const selectorVisible = common_vendor.ref(false);
    const progressSnapshot = common_vendor.computed(() => store.currentProgress);
    const heroStats = common_vendor.computed(() => [
      { label: "词书", value: store.books.length },
      { label: "收藏", value: progressSnapshot.value.favorites.length },
      { label: "错词", value: progressSnapshot.value.mistakes.length }
    ]);
    const currentBookName = common_vendor.computed(() => {
      var _a;
      return ((_a = store.currentBook) == null ? void 0 : _a.name) || "未选择";
    });
    const favoriteCount = common_vendor.computed(() => progressSnapshot.value.favorites.length);
    const mistakeCount = common_vendor.computed(() => progressSnapshot.value.mistakes.length);
    const ensureInitialData = async () => {
      if (!store.books.length) {
        await store.loadBooks();
      }
      if (!store.selectedBookId && store.books.length) {
        await store.selectBook(store.books[0].id, { preloadWords: false });
      }
    };
    common_vendor.onMounted(() => {
      ensureInitialData();
    });
    const openSelector = () => {
      selectorVisible.value = true;
    };
    const handleSelectBook = async (book) => {
      if (!book)
        return;
      await store.selectBook(book.id, { preloadWords: false });
      selectorVisible.value = false;
    };
    const previewBook = async (book) => {
      await store.selectBook(book.id, { preloadWords: false });
      selectorVisible.value = false;
      common_vendor.index.showToast({ title: `已切换至 ${book.name}`, icon: "none" });
    };
    const goPractice = (bookId) => {
      const target = bookId || store.selectedBookId;
      if (!target) {
        common_vendor.index.showToast({ title: "请先选择词书", icon: "none" });
        return;
      }
      common_vendor.index.navigateTo({ url: `/pages/word-practice/word-detail?bookId=${target}` });
    };
    const formatWords = (count = 0) => count.toLocaleString();
    const formatDate = (value) => {
      if (!value)
        return "刚刚";
      return new Date(value).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(openSelector),
        b: common_vendor.f(heroStats.value, (stat, k0, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: common_vendor.t(stat.label),
            c: stat.label
          };
        }),
        c: common_vendor.t(common_vendor.unref(store).books.length),
        d: common_vendor.unref(store).booksLoading
      }, common_vendor.unref(store).booksLoading ? {} : !common_vendor.unref(store).books.length ? {
        f: common_vendor.p({
          type: "info",
          size: "32",
          color: "#94a3b8"
        })
      } : {
        g: common_vendor.f(common_vendor.unref(store).books, (book, k0, i0) => {
          return {
            a: common_vendor.t(book.name),
            b: common_vendor.t(formatWords(book.totalWords)),
            c: common_vendor.t(book.description || "暂无简介，立即开启学习。"),
            d: common_vendor.t(book.language || "unk"),
            e: common_vendor.t(formatDate(book.createdAt)),
            f: common_vendor.o(($event) => previewBook(book), book.id),
            g: common_vendor.o(($event) => goPractice(book.id), book.id),
            h: book.id
          };
        })
      }, {
        e: !common_vendor.unref(store).books.length,
        h: common_vendor.t(currentBookName.value),
        i: common_vendor.t(favoriteCount.value),
        j: common_vendor.t(favoriteCount.value),
        k: common_vendor.t(favoriteCount.value ? "已收藏词条，进入练习可查看详情" : "还没有收藏，进入词书即可收藏"),
        l: common_vendor.o(($event) => goPractice(common_vendor.unref(store).selectedBookId)),
        m: common_vendor.t(mistakeCount.value),
        n: common_vendor.t(mistakeCount.value),
        o: common_vendor.t(mistakeCount.value ? "存在待复习词汇，进入词书即可开始复盘" : "暂时没有错词，保持学习节奏"),
        p: common_vendor.o(($event) => goPractice(common_vendor.unref(store).selectedBookId)),
        q: common_vendor.o(($event) => selectorVisible.value = false),
        r: common_vendor.o(handleSelectBook),
        s: common_vendor.p({
          visible: selectorVisible.value,
          books: common_vendor.unref(store).books,
          ["selected-book-id"]: common_vendor.unref(store).selectedBookId,
          loading: common_vendor.unref(store).booksLoading
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-2dd63b0c"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/word-practice/word-practice.js.map
