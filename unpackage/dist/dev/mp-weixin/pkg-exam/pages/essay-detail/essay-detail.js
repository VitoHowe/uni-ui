"use strict";
const common_vendor = require("../../../common/vendor.js");
const utils_request = require("../../../utils/request.js");
const utils_constants = require("../../../utils/constants.js");
const pkgExam_utils_essayParser = require("../../utils/essayParser.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
const DEFAULT_DIAGRAM_SCALE = 1.3;
const MIN_DIAGRAM_SCALE = 0.6;
const MAX_DIAGRAM_SCALE = 2.4;
const DIAGRAM_SCALE_STEP = 0.01;
const _sfc_main = {
  __name: "essay-detail",
  setup(__props) {
    const essayId = common_vendor.ref(0);
    const essayDetail = common_vendor.ref(null);
    const markdownRaw = common_vendor.ref("");
    const renderedContent = common_vendor.ref("");
    const previewImageUrls = common_vendor.ref([]);
    const errorMessage = common_vendor.ref("");
    const loading = common_vendor.ref(false);
    const diagramScale = common_vendor.ref(DEFAULT_DIAGRAM_SCALE);
    const parseMarkdownResponse = (value) => {
      if (typeof value === "string")
        return value;
      if (value === null || value === void 0)
        return "";
      if (typeof value === "object") {
        if (typeof value.content === "string")
          return value.content;
        if (typeof value.data === "string")
          return value.data;
        try {
          return JSON.stringify(value);
        } catch (error) {
          return String(value);
        }
      }
      return String(value);
    };
    const resolveContentUrl = (contentUrl) => {
      if (!contentUrl)
        return "";
      if (/^https?:\/\//i.test(contentUrl))
        return contentUrl;
      const origin = utils_constants.API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
      return `${origin}${contentUrl.startsWith("/") ? "" : "/"}${contentUrl}`;
    };
    const resolveAssetUrl = (url) => {
      const text = String(url || "").trim();
      if (!text)
        return "";
      if (/^https?:\/\//i.test(text))
        return text;
      if (/^\/\//.test(text))
        return `https:${text}`;
      if (/^data:/i.test(text))
        return text;
      const origin = utils_constants.API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
      return `${origin}${text.startsWith("/") ? "" : "/"}${text}`;
    };
    const requestMarkdown = (url) => {
      return new Promise((resolve, reject) => {
        common_vendor.index.request({
          url,
          method: "GET",
          responseType: "text",
          success: (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parseMarkdownResponse(res.data));
              return;
            }
            reject(new Error(`论文内容加载失败（${res.statusCode}）`));
          },
          fail: (error) => {
            reject(new Error(error.errMsg || "论文内容加载失败"));
          }
        });
      });
    };
    const renderMarkdown = () => {
      if (!markdownRaw.value) {
        renderedContent.value = "";
        return;
      }
      const allowHorizontalScroll = diagramScale.value > DEFAULT_DIAGRAM_SCALE;
      renderedContent.value = pkgExam_utils_essayParser.parseEssayMarkdown(markdownRaw.value, {
        preFontScale: diagramScale.value,
        tableFontScale: diagramScale.value,
        allowHorizontalScroll
      });
    };
    const loadEssay = async () => {
      if (!essayId.value) {
        errorMessage.value = "缺少 essayId 参数";
        return;
      }
      loading.value = true;
      errorMessage.value = "";
      try {
        const detail = await utils_request.get(utils_constants.API_ENDPOINTS.ESSAYS.DETAIL(essayId.value), {}, { showLoading: false });
        essayDetail.value = detail;
        const fullContentUrl = resolveContentUrl(detail.content_url);
        if (!fullContentUrl) {
          throw new Error("论文内容地址无效");
        }
        const markdownText = await requestMarkdown(fullContentUrl);
        markdownRaw.value = markdownText;
        const origin = utils_constants.API_CONFIG.BASE_URL.replace(/\/api\/?$/, "");
        previewImageUrls.value = pkgExam_utils_essayParser.extractEssayImageUrls(markdownText, origin);
        renderMarkdown();
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-exam/pages/essay-detail/essay-detail.vue:157", "加载论文失败:", error);
        errorMessage.value = error.message || "加载论文失败";
        markdownRaw.value = "";
        renderedContent.value = "";
        previewImageUrls.value = [];
      } finally {
        loading.value = false;
      }
    };
    const previewImage = (current = "") => {
      if (!previewImageUrls.value.length)
        return;
      const currentUrl = current && previewImageUrls.value.includes(current) ? current : previewImageUrls.value[0];
      common_vendor.index.previewImage({
        urls: previewImageUrls.value,
        current: currentUrl
      });
    };
    const handleRichTextItemClick = (event) => {
      var _a;
      const node = ((_a = event == null ? void 0 : event.detail) == null ? void 0 : _a.node) || (event == null ? void 0 : event.detail) || {};
      const nodeName = String((node == null ? void 0 : node.name) || "").toLowerCase();
      if (nodeName !== "img")
        return;
      const attrs = (node == null ? void 0 : node.attrs) || {};
      const src = attrs.src || attrs["data-src"] || "";
      const resolvedSrc = resolveAssetUrl(src);
      if (resolvedSrc) {
        previewImage(resolvedSrc);
      }
    };
    const adjustDiagramScale = (step) => {
      const nextScale = Number((diagramScale.value + step).toFixed(2));
      diagramScale.value = Math.max(MIN_DIAGRAM_SCALE, Math.min(MAX_DIAGRAM_SCALE, nextScale));
      renderMarkdown();
    };
    const resetDiagramScale = () => {
      diagramScale.value = DEFAULT_DIAGRAM_SCALE;
      renderMarkdown();
    };
    const formatDate = (value) => {
      if (!value)
        return "-";
      const text = String(value);
      if (text.length >= 16) {
        return text.slice(0, 16).replace("T", " ");
      }
      return text.replace("T", " ");
    };
    common_vendor.onLoad((options) => {
      essayId.value = Number(options.essayId || 0);
      if (options.essayTitle) {
        common_vendor.index.setNavigationBarTitle({
          title: decodeURIComponent(options.essayTitle)
        });
      }
      loadEssay();
    });
    common_vendor.onPullDownRefresh(async () => {
      await loadEssay();
      common_vendor.index.stopPullDownRefresh();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: essayDetail.value
      }, essayDetail.value ? {
        b: common_vendor.t(essayDetail.value.title),
        c: common_vendor.t(essayDetail.value.org_name || "-"),
        d: common_vendor.t(essayDetail.value.subject_chapter_name || "-"),
        e: common_vendor.t(formatDate(essayDetail.value.updated_at))
      } : {}, {
        f: loading.value
      }, loading.value ? {
        g: common_vendor.p({
          type: "spinner-cycle",
          size: "34",
          color: "#0f766e"
        })
      } : errorMessage.value ? {
        i: common_vendor.t(errorMessage.value),
        j: common_vendor.o(loadEssay)
      } : !renderedContent.value ? {} : common_vendor.e({
        l: previewImageUrls.value.length > 0
      }, previewImageUrls.value.length > 0 ? {
        m: common_vendor.t(previewImageUrls.value.length),
        n: common_vendor.o(($event) => previewImage())
      } : {}, {
        o: common_vendor.t(Math.round(diagramScale.value * 100)),
        p: diagramScale.value > DEFAULT_DIAGRAM_SCALE
      }, diagramScale.value > DEFAULT_DIAGRAM_SCALE ? {} : {}, {
        q: common_vendor.o(($event) => adjustDiagramScale(-DIAGRAM_SCALE_STEP)),
        r: common_vendor.o(($event) => adjustDiagramScale(DIAGRAM_SCALE_STEP)),
        s: common_vendor.o(resetDiagramScale),
        t: renderedContent.value,
        v: common_vendor.o(handleRichTextItemClick)
      }), {
        h: errorMessage.value,
        k: !renderedContent.value
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b45f49e7"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/pkg-exam/pages/essay-detail/essay-detail.js.map
