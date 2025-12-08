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
  __name: "WordPracticePanel",
  props: {
    word: {
      type: Object,
      default: null
    },
    index: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    masteryLabel: {
      type: String,
      default: "未学习"
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    nextPreview: {
      type: String,
      default: "--"
    },
    pronunciationState: {
      type: Object,
      default: () => ({ loading: false, error: "" })
    }
  },
  emits: ["play", "toggle-favorite", "mark-mastered", "mark-mistake", "next", "prev"],
  setup(__props) {
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: __props.word
      }, __props.word ? common_vendor.e({
        b: common_vendor.t(__props.word.english),
        c: common_vendor.t(__props.word.chinese),
        d: common_vendor.t(__props.word.bookName || "未标注"),
        e: common_vendor.t((_b = (_a = __props.word.english) == null ? void 0 : _a.charAt(0)) == null ? void 0 : _b.toUpperCase()),
        f: common_vendor.p({
          type: "sound",
          size: "18",
          color: "#fff"
        }),
        g: common_vendor.o(($event) => _ctx.$emit("play")),
        h: __props.pronunciationState.loading,
        i: common_vendor.p({
          type: "star",
          size: "18",
          color: __props.isFavorite ? "#facc15" : "#fff"
        }),
        j: common_vendor.t(__props.isFavorite ? "已收藏" : "收藏"),
        k: common_vendor.o(($event) => _ctx.$emit("toggle-favorite")),
        l: common_vendor.p({
          type: "checkmarkempty",
          size: "18",
          color: "#fff"
        }),
        m: common_vendor.o(($event) => _ctx.$emit("mark-mastered")),
        n: common_vendor.p({
          type: "refresh",
          size: "18",
          color: "#fff"
        }),
        o: common_vendor.o(($event) => _ctx.$emit("mark-mistake")),
        p: common_vendor.t(__props.index + 1),
        q: common_vendor.t(__props.total),
        r: common_vendor.t(__props.masteryLabel),
        s: common_vendor.o(($event) => _ctx.$emit("prev")),
        t: common_vendor.o(($event) => _ctx.$emit("next")),
        v: common_vendor.t(__props.nextPreview),
        w: __props.pronunciationState.error
      }, __props.pronunciationState.error ? {
        x: common_vendor.t(__props.pronunciationState.error)
      } : {}) : {
        y: common_vendor.p({
          type: "info",
          size: "32",
          color: "#999"
        })
      });
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0c50053c"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/word-practice/WordPracticePanel.js.map
