"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  (_easycom_uni_icons2 + _easycom_uni_section2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
if (!Math) {
  (_easycom_uni_icons + _easycom_uni_section)();
}
const _sfc_main = {
  __name: "WordListTable",
  props: {
    words: {
      type: Array,
      default: () => []
    },
    currentPage: {
      type: Number,
      default: 1
    },
    totalPages: {
      type: Number,
      default: 1
    }
  },
  emits: ["change-page", "select"],
  setup(__props) {
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: __props.words.length
      }, __props.words.length ? {
        b: common_vendor.f(__props.words, (word, k0, i0) => {
          return {
            a: common_vendor.t(word.english),
            b: common_vendor.t(word.chinese),
            c: common_vendor.t(word.bookName),
            d: word.id,
            e: common_vendor.o(($event) => _ctx.$emit("select", word), word.id)
          };
        })
      } : {
        c: common_vendor.p({
          type: "list",
          size: "32",
          color: "#9ca3af"
        })
      }, {
        d: __props.totalPages > 1
      }, __props.totalPages > 1 ? {
        e: __props.currentPage === 1,
        f: common_vendor.o(($event) => _ctx.$emit("change-page", "prev")),
        g: common_vendor.t(__props.currentPage),
        h: common_vendor.t(__props.totalPages),
        i: __props.currentPage === __props.totalPages,
        j: common_vendor.o(($event) => _ctx.$emit("change-page", "next"))
      } : {}, {
        k: common_vendor.p({
          title: "全部词汇",
          type: "line",
          padding: true
        })
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-3a32a5fd"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/word-practice/WordListTable.js.map
