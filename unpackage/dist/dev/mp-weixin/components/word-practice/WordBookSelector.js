"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const _sfc_main = {
  __name: "WordBookSelector",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    books: {
      type: Array,
      default: () => []
    },
    selectedBookId: {
      type: [String, Number],
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ["close", "select"],
  setup(__props) {
    const props = __props;
    const normalizeBookId = (value) => {
      if (value === null || value === void 0)
        return null;
      return String(value);
    };
    const isActiveBook = (bookId) => normalizeBookId(bookId) === normalizeBookId(props.selectedBookId);
    const formatDate = (value) => {
      if (!value)
        return "刚刚";
      return new Date(value).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.visible
      }, __props.visible ? common_vendor.e({
        b: common_vendor.p({
          type: "closeempty",
          size: "20",
          color: "#111827"
        }),
        c: common_vendor.o(($event) => _ctx.$emit("close")),
        d: common_vendor.f(__props.books, (book, k0, i0) => {
          return common_vendor.e({
            a: common_vendor.t(book.name),
            b: common_vendor.t(book.language || "不限"),
            c: common_vendor.t(book.description || "暂无简介，立即开启学习。"),
            d: common_vendor.t(book.totalWords || 0),
            e: common_vendor.t(formatDate(book.createdAt)),
            f: isActiveBook(book.id)
          }, isActiveBook(book.id) ? {} : {}, {
            g: book.id,
            h: common_vendor.o(($event) => _ctx.$emit("select", book), book.id)
          });
        }),
        e: !__props.books.length && !__props.loading
      }, !__props.books.length && !__props.loading ? {
        f: common_vendor.p({
          type: "info",
          size: "32",
          color: "#9ca3af"
        })
      } : {}, {
        g: __props.loading
      }, __props.loading ? {} : {}, {
        h: common_vendor.o(($event) => _ctx.$emit("close"))
      }) : {});
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-989bf161"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/word-practice/WordBookSelector.js.map
