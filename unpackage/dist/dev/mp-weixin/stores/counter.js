"use strict";
const common_vendor = require("../common/vendor.js");
const useCounterStore = common_vendor.defineStore("counter", {
  state: () => {
    return { count: 0 };
  },
  // 也可以这样定义
  // state: () => ({ count: 0 })
  actions: {
    increment() {
      this.count++;
    }
  }
});
exports.useCounterStore = useCounterStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/stores/counter.js.map
