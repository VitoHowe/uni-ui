"use strict";
const common_vendor = require("../common/vendor.js");
const utils_constants = require("./constants.js");
const normalizeSubject = (subject) => {
  if (!subject)
    return null;
  return {
    id: Number(subject.id),
    name: subject.name || "",
    code: subject.code || null
  };
};
const SubjectStorage = {
  get() {
    return common_vendor.index.getStorageSync(utils_constants.STORAGE_KEYS.SELECTED_SUBJECT) || null;
  },
  set(subject) {
    if (!subject) {
      common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.SELECTED_SUBJECT);
      return;
    }
    common_vendor.index.setStorageSync(utils_constants.STORAGE_KEYS.SELECTED_SUBJECT, subject);
  },
  clear() {
    common_vendor.index.removeStorageSync(utils_constants.STORAGE_KEYS.SELECTED_SUBJECT);
  }
};
exports.SubjectStorage = SubjectStorage;
exports.normalizeSubject = normalizeSubject;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/subject.js.map
