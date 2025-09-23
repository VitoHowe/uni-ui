"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_upload = require("../../stores/upload.js");
const stores_auth = require("../../stores/auth.js");
const utils_auth = require("../../utils/auth.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_segmented_control2 = common_vendor.resolveComponent("uni-segmented-control");
  const _easycom_uni_section2 = common_vendor.resolveComponent("uni-section");
  const _easycom_uni_file_picker2 = common_vendor.resolveComponent("uni-file-picker");
  const _component_uni_progress = common_vendor.resolveComponent("uni-progress");
  const _easycom_uni_list_item2 = common_vendor.resolveComponent("uni-list-item");
  const _easycom_uni_list2 = common_vendor.resolveComponent("uni-list");
  (_easycom_uni_icons2 + _easycom_uni_segmented_control2 + _easycom_uni_section2 + _easycom_uni_file_picker2 + _component_uni_progress + _easycom_uni_list_item2 + _easycom_uni_list2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_segmented_control = () => "../../uni_modules/uni-segmented-control/components/uni-segmented-control/uni-segmented-control.js";
const _easycom_uni_section = () => "../../uni_modules/uni-section/components/uni-section/uni-section.js";
const _easycom_uni_file_picker = () => "../../uni_modules/uni-file-picker/components/uni-file-picker/uni-file-picker.js";
const _easycom_uni_list_item = () => "../../uni_modules/uni-list/components/uni-list-item/uni-list-item.js";
const _easycom_uni_list = () => "../../uni_modules/uni-list/components/uni-list/uni-list.js";
if (!Math) {
  (_easycom_uni_icons + AuthGuard + _easycom_uni_segmented_control + _easycom_uni_section + _easycom_uni_file_picker + _easycom_uni_list_item + _easycom_uni_list + CustomTabBar)();
}
const CustomTabBar = () => "../../components/CustomTabBar.js";
const AuthGuard = () => "../../components/AuthGuard.js";
const fileMediaType = "all";
const _sfc_main = {
  __name: "upload",
  setup(__props) {
    const uploadStore = stores_upload.useUploadStore();
    const authStore = stores_auth.useAuthStore();
    const fileTypeOptions = common_vendor.computed(() => uploadStore.config.fileTypeOptions);
    const currentFileType = common_vendor.computed(() => uploadStore.currentFileType);
    const maxFileCount = common_vendor.computed(() => uploadStore.config.maxFileCount);
    const filesList = common_vendor.computed(() => uploadStore.filesList);
    const uploading = common_vendor.computed(() => uploadStore.uploadStatus.uploading);
    const uploadProgress = common_vendor.computed(() => uploadStore.uploadStatus.progress);
    const uploadHistory = common_vendor.computed(() => uploadStore.uploadHistory);
    const allowedExtensions = common_vendor.computed(() => uploadStore.currentAllowedExtensions);
    const getTypeDescription = () => {
      return uploadStore.currentTypeDescription;
    };
    const getFileTypeText = () => {
      return uploadStore.currentFileTypeText;
    };
    const onTypeChange = (e) => {
      if (filesList.value.length > 0) {
        common_vendor.index.showModal({
          title: "切换文件类型",
          content: "切换文件类型将清空当前已选文件，是否继续？",
          success: (res) => {
            if (res.confirm) {
              uploadStore.setFileType(e.currentIndex);
            }
          }
        });
      } else {
        uploadStore.setFileType(e.currentIndex);
      }
    };
    const onFileSelect = (e) => {
      common_vendor.index.__f__("log", "at pages/upload/upload.vue:218", "选择文件:", e);
      const success = uploadStore.addFiles(e.tempFiles);
      if (success) {
        common_vendor.index.showToast({
          title: `已选择 ${e.tempFiles.length} 个文件`,
          icon: "success"
        });
      }
    };
    const onUploadProgress = (e) => {
      common_vendor.index.__f__("log", "at pages/upload/upload.vue:230", "上传进度:", e);
    };
    const onUploadSuccess = (e) => {
      common_vendor.index.__f__("log", "at pages/upload/upload.vue:236", "上传成功:", e);
    };
    const onUploadFail = (e) => {
      common_vendor.index.__f__("log", "at pages/upload/upload.vue:243", "上传失败:", e);
    };
    const clearFiles = () => {
      if (filesList.value.length === 0)
        return;
      common_vendor.index.showModal({
        title: "确认清空",
        content: "确定要清空所有已选文件吗？",
        success: (res) => {
          if (res.confirm) {
            uploadStore.clearFiles();
            common_vendor.index.showToast({
              title: "已清空文件列表",
              icon: "success"
            });
          }
        }
      });
    };
    const viewUploadDetail = (record) => {
      common_vendor.index.showModal({
        title: record.fileName,
        content: `文件类型：${record.fileType}
上传时间：${record.uploadTime}
文件大小：${record.fileSize}
状态：${record.status}${record.errorMessage ? "\n错误信息：" + record.errorMessage : ""}${record.recordCount ? "\n解析记录数：" + record.recordCount : ""}`,
        confirmText: "确定"
      });
    };
    const getStatusIcon = (status) => {
      return uploadStore.getStatusIcon(status);
    };
    const getStatusColor = (status) => {
      return uploadStore.getStatusColor(status);
    };
    const getStatusClass = (status) => {
      const statusMap = {
        "成功": "success",
        "失败": "failed",
        "处理中": "processing"
      };
      return statusMap[status] || "unknown";
    };
    const checkUploadPermission = () => {
      const permissionResult = utils_auth.PermissionChecker.checkFeatureAvailable("file_upload");
      if (!permissionResult.available) {
        common_vendor.index.showModal({
          title: "需要登录",
          content: permissionResult.message,
          confirmText: "立即登录",
          cancelText: "稍后再说",
          success: (res) => {
            if (res.confirm) {
              utils_auth.RouteGuard.saveReturnPath("/pages/upload/upload");
              common_vendor.index.navigateTo({
                url: "/pages/login/login"
              });
            }
          }
        });
        return false;
      }
      return true;
    };
    const handleStartUpload = async () => {
      if (!checkUploadPermission()) {
        return;
      }
      try {
        await uploadStore.startUpload();
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/upload/upload.vue:337", "上传失败:", error);
        common_vendor.index.showToast({
          title: error.message || "上传失败",
          icon: "error"
        });
      }
    };
    const onTabChange = (index) => {
      common_vendor.index.__f__("log", "at pages/upload/upload.vue:347", "切换到tab:", index);
    };
    common_vendor.onMounted(() => {
      common_vendor.index.__f__("log", "at pages/upload/upload.vue:352", "文件上传页面加载");
      if (!authStore.isAuthenticated) {
        common_vendor.index.showToast({
          title: "建议登录后使用完整上传功能",
          icon: "none",
          duration: 3e3
        });
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: !common_vendor.unref(authStore).isAuthenticated
      }, !common_vendor.unref(authStore).isAuthenticated ? {
        b: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        c: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        d: common_vendor.p({
          type: "checkmarkempty",
          size: "16",
          color: "#28a745"
        }),
        e: common_vendor.p({
          title: "文件上传",
          message: "登录后可上传PDF文件，系统将自动解析题库和知识点内容",
          ["show-preview"]: true,
          ["current-path"]: "/pages/upload/upload"
        })
      } : common_vendor.e({
        f: common_vendor.o(onTypeChange),
        g: common_vendor.p({
          values: fileTypeOptions.value,
          current: currentFileType.value,
          styleType: "text",
          activeColor: "#007AFF"
        }),
        h: common_vendor.t(getTypeDescription()),
        i: common_vendor.p({
          title: "选择文件类型",
          type: "line",
          padding: true
        }),
        j: common_vendor.p({
          type: "cloud-upload",
          size: "32",
          color: "#007AFF"
        }),
        k: common_vendor.t(getFileTypeText()),
        l: common_vendor.t(allowedExtensions.value.join(", ")),
        m: common_vendor.sr("filePickerRef", "aa5cff34-7,aa5cff34-6"),
        n: common_vendor.o(onFileSelect),
        o: common_vendor.o(onUploadProgress),
        p: common_vendor.o(onUploadSuccess),
        q: common_vendor.o(onUploadFail),
        r: common_vendor.o(($event) => filesList.value = $event),
        s: common_vendor.p({
          ["file-mediatype"]: fileMediaType,
          ["file-extname"]: allowedExtensions.value,
          limit: maxFileCount.value,
          ["auto-upload"]: false,
          mode: "list",
          title: `已选择文件 (${filesList.value.length}/${maxFileCount.value})`,
          modelValue: filesList.value
        }),
        t: common_vendor.p({
          title: "选择文件",
          type: "line",
          padding: true
        }),
        v: filesList.value.length > 0
      }, filesList.value.length > 0 ? common_vendor.e({
        w: uploading.value
      }, uploading.value ? {
        x: common_vendor.p({
          type: "spinner-cycle",
          size: "16",
          color: "#fff"
        })
      } : {}, {
        y: common_vendor.t(uploading.value ? "上传中..." : "开始上传"),
        z: uploading.value,
        A: common_vendor.o(handleStartUpload),
        B: uploading.value,
        C: common_vendor.o(clearFiles)
      }) : {}, {
        D: uploadProgress.value.show
      }, uploadProgress.value.show ? {
        E: common_vendor.t(getFileTypeText()),
        F: common_vendor.t(uploadProgress.value.current),
        G: common_vendor.t(uploadProgress.value.total),
        H: common_vendor.p({
          percent: uploadProgress.value.percent,
          ["show-info"]: true,
          color: "#007AFF",
          ["stroke-width"]: "8"
        }),
        I: common_vendor.p({
          title: "上传进度",
          type: "line",
          padding: true
        })
      } : {}, {
        J: uploadHistory.value.length > 0
      }, uploadHistory.value.length > 0 ? {
        K: common_vendor.f(uploadHistory.value, (record, index, i0) => {
          return {
            a: "aa5cff34-15-" + i0 + "," + ("aa5cff34-14-" + i0),
            b: common_vendor.p({
              type: getStatusIcon(record.status),
              size: "18",
              color: getStatusColor(record.status)
            }),
            c: common_vendor.n(`status-${getStatusClass(record.status)}`),
            d: index,
            e: common_vendor.o(($event) => viewUploadDetail(record), index),
            f: "aa5cff34-14-" + i0 + ",aa5cff34-13",
            g: common_vendor.p({
              title: record.fileName,
              note: `${record.fileType} | ${record.uploadTime}`,
              rightText: record.status,
              clickable: true
            })
          };
        })
      } : {
        L: common_vendor.p({
          type: "inbox",
          size: "48",
          color: "#ccc"
        })
      }, {
        M: common_vendor.p({
          title: "上传记录",
          type: "line",
          padding: true
        }),
        N: common_vendor.o(onTabChange),
        O: common_vendor.p({
          current: 4
        })
      }));
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-aa5cff34"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/upload/upload.js.map
