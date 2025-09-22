"use strict";
const common_vendor = require("../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const activeColor = "#007AFF";
const inactiveColor = "#999999";
const _sfc_main = {
  __name: "CustomTabBar",
  props: {
    current: {
      type: Number,
      default: 0
    }
  },
  emits: ["change"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const currentIndex = common_vendor.ref(props.current);
    const tabList = [
      {
        pagePath: "/pages/index/index",
        iconType: "home",
        text: "首页"
      },
      {
        pagePath: "/pages/study/study",
        iconType: "medal",
        text: "学习"
      },
      {
        pagePath: "/pages/question/question",
        iconType: "help",
        text: "题库"
      },
      {
        pagePath: "/pages/profile/profile",
        iconType: "person",
        text: "我的"
      }
    ];
    const switchTab = (tab, index) => {
      if (currentIndex.value === index)
        return;
      currentIndex.value = index;
      emit("change", index);
      common_vendor.index.switchTab({
        url: tab.pagePath,
        fail: () => {
          common_vendor.index.redirectTo({
            url: tab.pagePath
          });
        }
      });
    };
    common_vendor.onMounted(() => {
      currentIndex.value = props.current;
    });
    __expose({
      setCurrentIndex: (index) => {
        currentIndex.value = index;
      }
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.f(tabList, (tab, index, i0) => {
          return {
            a: "6def6a3b-0-" + i0,
            b: common_vendor.p({
              type: tab.iconType,
              size: 24,
              color: currentIndex.value === index ? activeColor : inactiveColor
            }),
            c: common_vendor.t(tab.text),
            d: currentIndex.value === index ? activeColor : inactiveColor,
            e: index,
            f: currentIndex.value === index ? 1 : "",
            g: common_vendor.o(($event) => switchTab(tab, index), index)
          };
        })
      };
    };
  }
};
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6def6a3b"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-weixin/components/CustomTabBar.js.map
