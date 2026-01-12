import { defineStore } from 'pinia'
import { fetchWordBooks, fetchWordBookWords } from '@/services/wordBooks.js'
import {
  createEmptyProgress,
  readBookProgress,
  persistBookProgress,
  updateWordStatus,
  updateCursor
} from '@/utils/wordProgress.js'

const LAST_BOOK_KEY = 'WORD_PRACTICE_LAST_BOOK'
const normalizeBookId = (value) => {
  if (value === null || value === undefined) return null
  return String(value)
}
const isSameBookId = (a, b) => normalizeBookId(a) === normalizeBookId(b)

export const useWordPracticeStore = defineStore('wordPractice', {
  state: () => ({
    books: [],
    booksTotal: 0,
    booksPagination: null,
    booksLoading: false,
    booksError: '',
    wordsLoading: false,
    wordsError: '',
    wordsByBook: {},
    selectedBookId: uni.getStorageSync(LAST_BOOK_KEY) || null,
    currentWordIndex: 0,
    progressByBook: {}
  }),
  getters: {
    currentBook: (state) =>
      state.books.find((book) => isSameBookId(book.id, state.selectedBookId)) || null,
    currentWords: (state) => state.wordsByBook[state.selectedBookId] || [],
    currentWord(state) {
      const words = this.currentWords
      if (!words.length) return null
      const safeIndex = Math.min(Math.max(state.currentWordIndex, 0), words.length - 1)
      return words[safeIndex] || null
    },
    currentProgress(state) {
      return state.progressByBook[state.selectedBookId] || createEmptyProgress()
    },
    favorites() {
      return this.currentProgress.favorites
    },
    mistakes() {
      return this.currentProgress.mistakes
    },
    mastered() {
      return this.currentProgress.mastered
    },
    learningRate() {
      const total = this.currentWords.length || 1
      return Math.round((this.mastered.length / total) * 100)
    }
  },
  actions: {
    async loadBooks(params = {}) {
      this.booksLoading = true
      this.booksError = ''
      try {
        const { books, total, pagination } = await fetchWordBooks(params)
        this.books = books
        this.booksTotal = total
        this.booksPagination = pagination
        const matchedBook = this.selectedBookId
          ? books.find((book) => isSameBookId(book.id, this.selectedBookId))
          : null
        if (matchedBook) {
          this.selectedBookId = matchedBook.id
          this.bootstrapProgress(matchedBook.id)
        } else if (books.length) {
          await this.selectBook(books[0].id, { preloadWords: false })
        }
      } catch (error) {
        console.error('获取单词书列表失败', error)
        this.booksError = error.message || '获取单词书失败'
      } finally {
        this.booksLoading = false
      }
    },
    async selectBook(bookId, options = {}) {
      const { preloadWords = true } = options
      if (!bookId) return
      const resolvedBook = this.books.find((book) => isSameBookId(book.id, bookId))
      const nextBookId = resolvedBook ? resolvedBook.id : bookId
      const changed = !isSameBookId(this.selectedBookId, nextBookId)
      this.selectedBookId = nextBookId
      uni.setStorageSync(LAST_BOOK_KEY, nextBookId)
      this.bootstrapProgress(nextBookId)
      if (preloadWords && (changed || !this.wordsByBook[nextBookId])) {
        await this.loadWords(nextBookId)
      } else if (preloadWords) {
        const progress = this.progressByBook[nextBookId]
        this.currentWordIndex = progress?.lastCursor || 0
      } else {
        const progress = this.progressByBook[nextBookId]
        this.currentWordIndex = progress?.lastCursor || 0
      }
    },
    async loadWords(bookId) {
      const targetId = bookId || this.selectedBookId
      if (!targetId) return
      this.wordsLoading = true
      this.wordsError = ''
      try {
        const { words } = await fetchWordBookWords(targetId)
        this.wordsByBook = {
          ...this.wordsByBook,
          [targetId]: words
        }
        this.bootstrapProgress(targetId)
        const progress = this.progressByBook[targetId]
        this.currentWordIndex = Math.min(progress.lastCursor || 0, Math.max(words.length - 1, 0))
      } catch (error) {
        console.error('加载单词列表失败', error)
        this.wordsError = error.message || '加载单词失败'
      } finally {
        this.wordsLoading = false
      }
    },
    bootstrapProgress(bookId) {
      if (!bookId || this.progressByBook[bookId]) return
      this.progressByBook = {
        ...this.progressByBook,
        [bookId]: readBookProgress(bookId)
      }
    },
    persistProgress(bookId) {
      const targetId = bookId || this.selectedBookId
      const snapshot = this.progressByBook[targetId]
      if (!targetId || !snapshot) return
      persistBookProgress(targetId, snapshot)
    },
    setCurrentWordIndex(nextIndex) {
      const words = this.currentWords
      if (!words.length) return
      const safeIndex = (nextIndex + words.length) % words.length
      this.currentWordIndex = safeIndex
      const snapshot = updateCursor(this.currentProgress, safeIndex)
      this.progressByBook = {
        ...this.progressByBook,
        [this.selectedBookId]: snapshot
      }
      this.persistProgress(this.selectedBookId)
    },
    jumpToWord(wordId) {
      const index = this.currentWords.findIndex((word) => word.id === wordId)
      if (index !== -1) {
        this.setCurrentWordIndex(index)
      }
    },
    toggleFavorite(wordId) {
      if (!this.currentWord) return
      const snapshot = this.currentProgress
      const isFavorite = snapshot.favorites.includes(wordId)
      const bucket = isFavorite ? null : 'favorite'
      this.applyWordStatus(wordId, bucket)
    },
    markMastered(wordId) {
      this.applyWordStatus(wordId, 'mastered')
    },
    markMistake(wordId) {
      this.applyWordStatus(wordId, 'mistake')
    },
    applyWordStatus(wordId, bucket) {
      if (!this.selectedBookId || !wordId) return
      let progress = this.currentProgress
      if (bucket) {
        progress = updateWordStatus(progress, wordId, bucket)
      } else {
        progress = updateWordStatus(progress, wordId)
      }
      this.progressByBook = {
        ...this.progressByBook,
        [this.selectedBookId]: progress
      }
      this.persistProgress(this.selectedBookId)
    }
  }
})
