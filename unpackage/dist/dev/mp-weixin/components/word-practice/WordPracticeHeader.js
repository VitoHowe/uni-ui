"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "WordPracticeHeader",
  props: {
    book: {
      type: Object,
      default: null
    },
    learningRate: {
      type: Number,
      default: 0
    },
    stats: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ["open-selector"],
  setup(__props) {
    return (_ctx, _cache) => {
      var _a, _b;
      return {
        a: common_vendor.t(__props.book ? "当前词书" : "尚未选择词书"),
        b: common_vendor.t(((_a = __props.book) == null ? void 0 : _a.name) || "选择词书开始练习"),
        c: common_vendor.t(((_b = __props.book) == null ? void 0 : _b.description) || "覆盖后端同步的单词书资源，支持多源学习。"),
        d: common_vendor.t(__props.loading ? "--" : `${__props.learningRate}%`),
        e: common_vendor.o(($event) => _ctx.$emit("open-selector")),
        f: common_vendor.f(__props.stats, (stat, k0, i0) => {
          return {
            a: common_vendor.t(stat.value),
            b: common_vendor.t(stat.label),
            c: stat.label
          };
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8010eff1"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/components/word-practice/WordPracticeHeader.js.map
