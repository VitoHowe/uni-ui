"use strict";
const utils_request = require("../utils/request.js");
const utils_constants = require("../utils/constants.js");
const normalizeBook = (book) => ({
  id: book.id,
  name: book.name,
  description: book.description,
  language: book.language,
  totalWords: book.total_words,
  creatorId: book.created_by,
  createdAt: book.created_at,
  updatedAt: book.updated_at,
  source: {
    filename: book.source_filename,
    storedPath: book.stored_path,
    size: book.source_size
  }
});
const normalizeWord = (bookId, bookName, word) => {
  var _a, _b;
  const fallbackEnglish = word.word || ((_a = word.extra) == null ? void 0 : _a.english) || "";
  const fallbackChinese = word.translation || ((_b = word.extra) == null ? void 0 : _b.chinese) || "";
  return {
    id: word.id ?? `${bookId}-${word.order_index}`,
    bookId,
    bookName,
    english: fallbackEnglish,
    chinese: fallbackChinese,
    phonetic: word.phonetic || "",
    definition: word.definition || "",
    example: word.example_sentence || "",
    partOfSpeech: word.part_of_speech || "",
    tags: word.tags || [],
    order: word.order_index ?? 0,
    raw: word
  };
};
const fetchWordBooks = async (params = {}) => {
  var _a;
  const data = await utils_request.get(utils_constants.API_ENDPOINTS.WORD_BOOKS.LIST, params);
  const books = ((data == null ? void 0 : data.books) || []).map(normalizeBook);
  return {
    books,
    total: (data == null ? void 0 : data.total) ?? books.length,
    pagination: (data == null ? void 0 : data.pagination) || {
      page: params.page || 1,
      limit: params.limit || books.length || 10,
      total: (data == null ? void 0 : data.total) ?? books.length,
      totalPages: ((_a = data == null ? void 0 : data.pagination) == null ? void 0 : _a.totalPages) || 1
    }
  };
};
const fetchWordBookWords = async (bookId) => {
  var _a;
  if (!bookId) {
    throw new Error("bookId is required to load words");
  }
  const data = await utils_request.get(utils_constants.API_ENDPOINTS.WORD_BOOKS.WORDS(bookId));
  const bookName = ((_a = data == null ? void 0 : data.book) == null ? void 0 : _a.name) || "";
  const words = ((data == null ? void 0 : data.words) || []).map((item) => normalizeWord(bookId, bookName, item));
  return {
    book: normalizeBook((data == null ? void 0 : data.book) || { id: bookId, name: bookName }),
    words,
    total: (data == null ? void 0 : data.total) ?? words.length
  };
};
exports.fetchWordBookWords = fetchWordBookWords;
exports.fetchWordBooks = fetchWordBooks;
//# sourceMappingURL=../../.sourcemap/mp-weixin/services/wordBooks.js.map
