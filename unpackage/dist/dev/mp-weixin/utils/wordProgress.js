"use strict";
const common_vendor = require("../common/vendor.js");
const STORAGE_PREFIX = "WORD_PRACTICE_PROGRESS::";
const normalizeList = (list) => {
  if (!Array.isArray(list))
    return [];
  const deduped = Array.from(new Set(list.filter(Boolean)));
  return deduped;
};
const nextTimestamp = () => (/* @__PURE__ */ new Date()).toISOString();
const createEmptyProgress = () => ({
  favorites: [],
  mistakes: [],
  mastered: [],
  lastCursor: 0,
  updatedAt: nextTimestamp()
});
const getStorageKey = (bookId) => `${STORAGE_PREFIX}${bookId}`;
const readBookProgress = (bookId) => {
  if (!bookId)
    return createEmptyProgress();
  try {
    const snapshot = common_vendor.index.getStorageSync(getStorageKey(bookId)) || {};
    return {
      favorites: normalizeList(snapshot.favorites),
      mistakes: normalizeList(snapshot.mistakes),
      mastered: normalizeList(snapshot.mastered),
      lastCursor: Number.isInteger(snapshot.lastCursor) ? snapshot.lastCursor : 0,
      updatedAt: snapshot.updatedAt || nextTimestamp()
    };
  } catch (error) {
    common_vendor.index.__f__("warn", "at utils/wordProgress.js:33", "读取单词进度失败", error);
    return createEmptyProgress();
  }
};
const persistBookProgress = (bookId, progress) => {
  if (!bookId)
    return;
  const payload = {
    favorites: normalizeList(progress.favorites),
    mistakes: normalizeList(progress.mistakes),
    mastered: normalizeList(progress.mastered),
    lastCursor: progress.lastCursor ?? 0,
    updatedAt: nextTimestamp()
  };
  common_vendor.index.setStorageSync(getStorageKey(bookId), payload);
  return payload;
};
const updateWordStatus = (progress, wordId, bucket) => {
  const next = {
    favorites: normalizeList(progress.favorites),
    mistakes: normalizeList(progress.mistakes),
    mastered: normalizeList(progress.mastered),
    lastCursor: progress.lastCursor ?? 0,
    updatedAt: progress.updatedAt
  };
  const removeFromAll = (id) => {
    next.favorites = next.favorites.filter((word) => word !== id);
    next.mistakes = next.mistakes.filter((word) => word !== id);
    next.mastered = next.mastered.filter((word) => word !== id);
  };
  removeFromAll(wordId);
  if (bucket === "favorite") {
    next.favorites.push(wordId);
  }
  if (bucket === "mistake") {
    next.mistakes.push(wordId);
  }
  if (bucket === "mastered") {
    next.mastered.push(wordId);
  }
  return {
    ...next,
    favorites: normalizeList(next.favorites),
    mistakes: normalizeList(next.mistakes),
    mastered: normalizeList(next.mastered)
  };
};
const updateCursor = (progress, cursor) => ({
  ...progress,
  lastCursor: cursor
});
exports.createEmptyProgress = createEmptyProgress;
exports.persistBookProgress = persistBookProgress;
exports.readBookProgress = readBookProgress;
exports.updateCursor = updateCursor;
exports.updateWordStatus = updateWordStatus;
//# sourceMappingURL=../../.sourcemap/mp-weixin/utils/wordProgress.js.map
