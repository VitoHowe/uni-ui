import { get } from '@/utils/request.js'
import { API_ENDPOINTS } from '@/utils/constants.js'

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
})

const normalizeWord = (bookId, bookName, word) => {
  const fallbackEnglish = word.word || word.extra?.english || ''
  const fallbackChinese = word.translation || word.extra?.chinese || ''
  return {
    id: word.id ?? `${bookId}-${word.order_index}`,
    bookId,
    bookName,
    english: fallbackEnglish,
    chinese: fallbackChinese,
    phonetic: word.phonetic || '',
    definition: word.definition || '',
    example: word.example_sentence || '',
    partOfSpeech: word.part_of_speech || '',
    tags: word.tags || [],
    order: word.order_index ?? 0,
    raw: word
  }
}

export const fetchWordBooks = async (params = {}) => {
  const data = await get(API_ENDPOINTS.WORD_BOOKS.LIST, params)
  const books = (data?.books || []).map(normalizeBook)
  return {
    books,
    total: data?.total ?? books.length,
    pagination: data?.pagination || {
      page: params.page || 1,
      limit: params.limit || books.length || 10,
      total: data?.total ?? books.length,
      totalPages: data?.pagination?.totalPages || 1
    }
  }
}

export const fetchWordBookWords = async (bookId) => {
  if (!bookId) {
    throw new Error('bookId is required to load words')
  }
  const data = await get(API_ENDPOINTS.WORD_BOOKS.WORDS(bookId))
  const bookName = data?.book?.name || ''
  const words = (data?.words || []).map((item) => normalizeWord(bookId, bookName, item))
  return {
    book: normalizeBook(data?.book || { id: bookId, name: bookName }),
    words,
    total: data?.total ?? words.length
  }
}

export const findWordInBooks = (books, bookId) => {
  return books.find((item) => item.id === bookId) || null
}
