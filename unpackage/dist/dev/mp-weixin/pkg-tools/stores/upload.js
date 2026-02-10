"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_constants = require("../../utils/constants.js");
const useUploadStore = common_vendor.defineStore("upload", {
  state: () => ({
    // 当前文件类型 (0: 知识点, 1: 题库)
    currentFileType: 0,
    // 文件列表
    filesList: [],
    // 上传状态
    uploadStatus: {
      uploading: false,
      progress: {
        show: false,
        current: 0,
        total: 0,
        percent: 0
      }
    },
    // 上传历史记录
    uploadHistory: [
      {
        id: 1,
        fileName: "项目管理基础知识.docx",
        fileType: "知识点",
        uploadTime: "2024-01-15 14:30",
        status: "成功",
        fileSize: "2.5MB",
        recordCount: 156
      },
      {
        id: 2,
        fileName: "模拟考试题库.xlsx",
        fileType: "题库",
        uploadTime: "2024-01-14 16:45",
        status: "失败",
        fileSize: "1.8MB",
        errorMessage: "文件格式不正确"
      }
    ],
    // 配置信息
    config: {
      // 文件类型选项
      fileTypeOptions: ["知识点", "题库"],
      // 允许的文件扩展名
      allowedExtensions: {
        0: ["doc", "docx", "pdf", "txt", "md"],
        // 知识点
        1: ["xlsx", "xls", "csv", "json"]
        // 题库
      },
      // 文件大小限制 (MB)
      maxFileSize: 10,
      // 最大文件数量
      maxFileCount: 5,
      // 文件类型描述
      typeDescriptions: {
        0: "上传知识点文档，系统将自动解析并分类存储学习内容",
        1: "上传题库文件，系统将解析题目、选项和答案信息"
      }
    }
  }),
  getters: {
    // 获取当前文件类型文本
    currentFileTypeText: (state) => {
      return state.config.fileTypeOptions[state.currentFileType];
    },
    // 获取当前允许的文件扩展名
    currentAllowedExtensions: (state) => {
      return state.config.allowedExtensions[state.currentFileType];
    },
    // 获取当前文件类型描述
    currentTypeDescription: (state) => {
      return state.config.typeDescriptions[state.currentFileType];
    },
    // 获取上传进度百分比
    uploadProgressPercent: (state) => {
      const { current, total } = state.uploadStatus.progress;
      return total > 0 ? Math.round(current / total * 100) : 0;
    },
    // 获取成功上传的记录数量
    successUploadCount: (state) => {
      return state.uploadHistory.filter((record) => record.status === "成功").length;
    },
    // 获取失败上传的记录数量
    failedUploadCount: (state) => {
      return state.uploadHistory.filter((record) => record.status === "失败").length;
    }
  },
  actions: {
    // 设置文件类型
    setFileType(typeIndex) {
      this.currentFileType = typeIndex;
      this.clearFiles();
    },
    // 添加文件到列表
    addFiles(files) {
      const totalCount = this.filesList.length + files.length;
      if (totalCount > this.config.maxFileCount) {
        const message = `最多只能选择${this.config.maxFileCount}个文件`;
        common_vendor.index.showToast({ title: message, icon: "none" });
        return false;
      }
      const validFiles = [];
      for (const file of files) {
        if (this.validateFile(file)) {
          validFiles.push({
            ...file,
            id: Date.now() + Math.random(),
            uploadStatus: "pending"
          });
        }
      }
      this.filesList.push(...validFiles);
      return validFiles.length > 0;
    },
    // 验证单个文件
    validateFile(file) {
      const extension = this.getFileExtension(file.name);
      if (!this.currentAllowedExtensions.includes(extension)) {
        common_vendor.index.showToast({
          title: `不支持${extension}格式文件`,
          icon: "none"
        });
        return false;
      }
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > this.config.maxFileSize) {
        common_vendor.index.showToast({
          title: `文件大小不能超过${this.config.maxFileSize}MB`,
          icon: "none"
        });
        return false;
      }
      return true;
    },
    // 获取文件扩展名
    getFileExtension(fileName) {
      return fileName.split(".").pop().toLowerCase();
    },
    // 清空文件列表
    clearFiles() {
      this.filesList = [];
    },
    // 移除单个文件
    removeFile(fileId) {
      const index = this.filesList.findIndex((file) => file.id === fileId);
      if (index > -1) {
        this.filesList.splice(index, 1);
      }
    },
    // 开始上传
    async startUpload() {
      if (this.filesList.length === 0) {
        common_vendor.index.showToast({ title: "请先选择文件", icon: "none" });
        return false;
      }
      if (this.uploadStatus.uploading) {
        common_vendor.index.showToast({ title: "正在上传中...", icon: "none" });
        return false;
      }
      this.uploadStatus.uploading = true;
      this.uploadStatus.progress = {
        show: true,
        current: 0,
        total: this.filesList.length,
        percent: 0
      };
      try {
        await this.processUpload();
        common_vendor.index.showToast({ title: "上传完成", icon: "success" });
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-tools/stores/upload.js:205", "上传过程出错:", error);
        common_vendor.index.showToast({ title: "上传过程出错", icon: "error" });
      } finally {
        this.uploadStatus.uploading = false;
        this.uploadStatus.progress.show = false;
      }
    },
    // 处理上传过程
    async processUpload() {
      for (let i = 0; i < this.filesList.length; i++) {
        const file = this.filesList[i];
        this.uploadStatus.progress.current = i + 1;
        this.uploadStatus.progress.percent = Math.round((i + 1) / this.filesList.length * 100);
        try {
          const result = await this.uploadSingleFile(file);
          this.addToHistory({
            fileName: file.name,
            fileType: this.currentFileTypeText,
            uploadTime: (/* @__PURE__ */ new Date()).toLocaleString("zh-CN"),
            status: "成功",
            fileSize: this.formatFileSize(file.size),
            recordCount: result.recordCount || 0
          });
        } catch (error) {
          this.addToHistory({
            fileName: file.name,
            fileType: this.currentFileTypeText,
            uploadTime: (/* @__PURE__ */ new Date()).toLocaleString("zh-CN"),
            status: "失败",
            fileSize: this.formatFileSize(file.size),
            errorMessage: error.message || "上传失败"
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      this.clearFiles();
    },
    // 上传单个文件 (调用真实API)
    async uploadSingleFile(file) {
      try {
        common_vendor.index.__f__("log", "at pkg-tools/stores/upload.js:252", "📤 开始上传文件:", file.name);
        common_vendor.index.__f__("log", "at pkg-tools/stores/upload.js:253", "🔗 上传API端点:", utils_constants.API_ENDPOINTS.FILES.UPLOAD);
        const formData = {
          name: file.name,
          description: `${this.currentFileTypeText}文件`,
          type: this.currentFileType
        };
        common_vendor.index.__f__("log", "at pkg-tools/stores/upload.js:262", "📋 表单数据:", formData);
        const result = await utils_request.upload(
          utils_constants.API_ENDPOINTS.FILES.UPLOAD,
          file.path || file.url,
          formData
        );
        common_vendor.index.__f__("log", "at pkg-tools/stores/upload.js:271", "✅ 文件上传成功:", result);
        return {
          success: true,
          recordCount: result.parsed_questions || 0,
          fileId: result.id
        };
      } catch (error) {
        common_vendor.index.__f__("error", "at pkg-tools/stores/upload.js:279", "❌ 文件上传失败:", error);
        throw new Error(error.message || "文件上传失败");
      }
    },
    // 添加到上传历史
    addToHistory(record) {
      const newRecord = {
        ...record,
        id: Date.now() + Math.random()
      };
      this.uploadHistory.unshift(newRecord);
      if (this.uploadHistory.length > 50) {
        this.uploadHistory.pop();
      }
    },
    // 清空上传历史
    clearHistory() {
      this.uploadHistory = [];
    },
    // 删除单条历史记录
    deleteHistoryRecord(recordId) {
      const index = this.uploadHistory.findIndex((record) => record.id === recordId);
      if (index > -1) {
        this.uploadHistory.splice(index, 1);
      }
    },
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0)
        return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    },
    // 获取状态图标
    getStatusIcon(status) {
      const icons = {
        "成功": "checkmarkempty",
        "失败": "closeempty",
        "处理中": "spinner-cycle"
      };
      return icons[status] || "help";
    },
    // 获取状态颜色
    getStatusColor(status) {
      const colors = {
        "成功": "#28a745",
        "失败": "#dc3545",
        "处理中": "#007AFF"
      };
      return colors[status] || "#666";
    }
  }
});
exports.useUploadStore = useUploadStore;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pkg-tools/stores/upload.js.map
