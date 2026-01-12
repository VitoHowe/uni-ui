<template>
  <view class="word-detail-page">
    <WordPracticeHeader
      :book="store.currentBook"
      :learning-rate="store.learningRate"
      :stats="heroStats"
      :loading="store.wordsLoading || store.booksLoading"
      @open-selector="selectorVisible = true"
    />

    <WordPracticePanel
      :word="store.currentWord"
      :index="store.currentWordIndex"
      :total="store.currentWords.length"
      :mastery-label="masteryLabel"
      :is-favorite="isFavorite"
      :next-preview="nextPreview"
      :pronunciation-state="pronunciationState"
      @play="playPronunciation"
      @toggle-favorite="toggleFavorite"
      @mark-mastered="markCurrentWord('mastered')"
      @mark-mistake="markCurrentWord('mistake')"
      @next="store.setCurrentWordIndex(store.currentWordIndex + 1)"
      @prev="store.setCurrentWordIndex(store.currentWordIndex - 1)"
    />

    <view class="search-card">
      <view class="search-bar">
        <uni-icons type="search" size="18" color="#94a3b8" />
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="输入英文或中文关键字"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <view class="search-clear" v-if="searchKeyword" @click="clearSearch">
          <uni-icons type="closeempty" size="16" color="#94a3b8" />
        </view>
      </view>
      <view class="search-meta">
        <text>共 {{ filteredWords.length }} 词 · 第 {{ currentPage }}/{{ totalPages }}</text>
        <text class="search-link" @click="jumpRandom">随机一词</text>
      </view>
      <view class="action-row">
        <view
          class="action-pill"
          v-for="action in quickActions"
          :key="action.type"
          :style="{ background: action.bg }"
          @click="handleQuickAction(action)"
        >
          <view class="pill-icon">
            <uni-icons :type="action.icon" size="18" color="#fff" />
          </view>
          <view class="pill-info">
            <text class="pill-title">{{ action.name }}</text>
            <text class="pill-desc">{{ action.desc }}</text>
          </view>
          <text class="pill-count">{{ action.count }}</text>
        </view>
      </view>
    </view>

    <WordListTable
      class="word-list-section"
      :words="paginatedWords"
      :current-page="currentPage"
      :total-pages="totalPages"
      @change-page="changePage"
      @select="handleWordSelect"
    />

    <WordBookSelector
      :visible="selectorVisible"
      :books="store.books"
      :selected-book-id="store.selectedBookId"
      :loading="store.booksLoading"
      @close="selectorVisible = false"
      @select="handleSelectBook"
    />
  </view>
</template>

<script setup>
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import WordPracticeHeader from '@/components/word-practice/WordPracticeHeader.vue'
import WordPracticePanel from '@/components/word-practice/WordPracticePanel.vue'
import WordListTable from '@/components/word-practice/WordListTable.vue'
import WordBookSelector from '@/components/word-practice/WordBookSelector.vue'
import { useWordPracticeStore } from '@/stores/wordPractice.js'

const PAGE_SIZE = 30
const DICT_VOICE_URL = 'https://dict.youdao.com/dictvoice?type=2&audio='

const store = useWordPracticeStore()
const searchKeyword = ref('')
const currentPage = ref(1)
const selectorVisible = ref(false)
const initializing = ref(false)
const pronunciationState = reactive({ loading: false, error: '' })

let audioContext = null

const resetAudioContext = () => {
  if (!audioContext) return
  audioContext.stop()
  audioContext.destroy()
  audioContext = null
}

const filteredWords = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return store.currentWords
  return store.currentWords.filter((word) => {
    return word.english?.toLowerCase().includes(keyword) || word.chinese?.includes(keyword)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredWords.value.length / PAGE_SIZE)))
const paginatedWords = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredWords.value.slice(start, start + PAGE_SIZE)
})

const heroStats = computed(() => [
  { label: '词汇总数', value: store.currentWords.length },
  { label: '已掌握', value: store.mastered.length },
  { label: '收藏', value: store.favorites.length }
])

const isFavorite = computed(() => store.currentWord && store.favorites.includes(store.currentWord.id))

const masteryLabel = computed(() => {
  const wordId = store.currentWord?.id
  if (!wordId) return '未学习'
  if (store.mastered.includes(wordId)) return '已掌握'
  if (store.mistakes.includes(wordId)) return '待复习'
  return '未学习'
})

const nextPreview = computed(() => {
  if (!store.currentWords.length) return '--'
  const nextIndex = (store.currentWordIndex + 1) % store.currentWords.length
  return store.currentWords[nextIndex]?.english || '--'
})

const quickActions = computed(() => [
  {
    type: 'random',
    name: '随机练习',
    desc: '打破顺序',
    count: '',
    icon: 'loop',
    bg: 'linear-gradient(135deg, #4f46e5, #7c3aed)'
  },
  {
    type: 'favorites',
    name: '收藏夹',
    desc: '高频复习',
    count: store.favorites.length,
    icon: 'star',
    bg: 'linear-gradient(135deg, #f59e0b, #f97316)'
  },
  {
    type: 'mistakes',
    name: '错词集',
    desc: '重新巩固',
    count: store.mistakes.length,
    icon: 'closeempty',
    bg: 'linear-gradient(135deg, #fb7185, #f43f5e)'
  }
])

const toDisplayWord = (word) => {
  if (!word) return null
  return {
    ...word,
    bookName: word.bookName || store.currentBook?.name || '未知词书'
  }
}

const favoriteWords = computed(() => {
  const map = new Map(store.currentWords.map((item) => [item.id, toDisplayWord(item)]))
  return store.favorites.map((id) => map.get(id)).filter(Boolean)
})

const mistakeWords = computed(() => {
  const map = new Map(store.currentWords.map((item) => [item.id, toDisplayWord(item)]))
  return store.mistakes.map((id) => map.get(id)).filter(Boolean)
})

const onSearchConfirm = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchKeyword.value = ''
}

watch(searchKeyword, () => {
  currentPage.value = 1
})

const changePage = (direction) => {
  if (direction === 'prev' && currentPage.value > 1) {
    currentPage.value -= 1
  }
  if (direction === 'next' && currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const jumpRandom = () => {
  if (!filteredWords.value.length) return
  const randomWord = filteredWords.value[Math.floor(Math.random() * filteredWords.value.length)]
  handleWordSelect(randomWord)
}

const handleQuickAction = (action) => {
  switch (action.type) {
    case 'random':
      jumpRandom()
      break
    case 'favorites':
      favoriteWords.value.length
        ? handleWordSelect(favoriteWords.value[0])
        : uni.showToast({ title: '暂无收藏', icon: 'none' })
      break
    case 'mistakes':
      mistakeWords.value.length
        ? handleWordSelect(mistakeWords.value[0])
        : uni.showToast({ title: '暂无错词', icon: 'none' })
      break
    default:
      break
  }
}

const handleWordSelect = (word) => {
  if (!word) return
  store.jumpToWord(word.id)
  jumpToPageForWord(word.id)
}

const jumpToPageForWord = (wordId) => {
  const index = filteredWords.value.findIndex((item) => item.id === wordId)
  if (index === -1) return
  currentPage.value = Math.floor(index / PAGE_SIZE) + 1
}

const markCurrentWord = (status) => {
  if (!store.currentWord) return
  if (status === 'mastered') {
    store.markMastered(store.currentWord.id)
    uni.showToast({ title: '已标记为掌握', icon: 'none' })
  } else {
    store.markMistake(store.currentWord.id)
    uni.showToast({ title: '已加入错词', icon: 'none' })
  }
  store.setCurrentWordIndex(store.currentWordIndex + 1)
}

const toggleFavorite = () => {
  if (!store.currentWord) return
  const existed = store.favorites.includes(store.currentWord.id)
  store.toggleFavorite(store.currentWord.id)
  uni.showToast({ title: existed ? '已移出收藏' : '已加入收藏', icon: 'none' })
}

const handleSelectBook = async (book) => {
  if (!book) return
  await store.selectBook(book.id)
  selectorVisible.value = false
  searchKeyword.value = ''
}

const sanitizePronunciationText = (text) => {
  if (!text) return ''
  return text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const playPronunciation = () => {
  if (!store.currentWord) return
  if (!uni.createInnerAudioContext) {
    uni.showToast({ title: '当前环境不支持发音', icon: 'none' })
    return
  }
  pronunciationState.loading = true
  pronunciationState.error = ''
  try {
    setupAudioContext()
    if (!audioContext) {
      pronunciationState.error = '发音组件初始化失败'
      return
    }
    const candidate = store.currentWord.english || store.currentWord.word || ''
    const sanitized = sanitizePronunciationText(candidate)
    const finalQuery = sanitized || candidate
    audioContext.stop()
    audioContext.src = `${DICT_VOICE_URL}${encodeURIComponent(finalQuery)}`
    audioContext.play()
  } catch (error) {
    console.error('播放发音出错', error)
    pronunciationState.error = '发音服务异常，请稍后再试'
    resetAudioContext()
  } finally {
    pronunciationState.loading = false
  }
}

const setupAudioContext = () => {
  if (audioContext || !uni.createInnerAudioContext) return
  audioContext = uni.createInnerAudioContext()
  audioContext.obeyMuteSwitch = false
  audioContext.onStop(() => {
    pronunciationState.error = ''
  })
  audioContext.onError((error) => {
    console.error('发音播放失败', error)
    pronunciationState.error = '无法获取发音，请稍后重试'
    pronunciationState.loading = false
    resetAudioContext()
  })
}

const destroyAudioContext = () => {
  resetAudioContext()
}

const initDetailPage = async (bookId) => {
  if (initializing.value) return
  initializing.value = true
  try {
    if (!store.books.length) {
      await store.loadBooks()
    }
    if (bookId) {
      await store.selectBook(bookId)
    } else if (!store.selectedBookId && store.books.length) {
      await store.selectBook(store.books[0].id)
    }
    if (store.selectedBookId && !store.currentWords.length) {
      await store.loadWords(store.selectedBookId)
    }
  } finally {
    initializing.value = false
  }
}

watch(filteredWords, () => {
  if ((currentPage.value - 1) * PAGE_SIZE >= filteredWords.value.length) {
    currentPage.value = 1
  }
})

watch(
  () => store.selectedBookId,
  () => {
    currentPage.value = 1
    searchKeyword.value = ''
  }
)

onLoad((options) => {
  const bookId = options?.bookId
  initDetailPage(bookId)
})

onMounted(() => {
  setupAudioContext()
})

onUnmounted(() => {
  destroyAudioContext()
})
</script>

<style scoped lang="scss">
.word-detail-page {
  min-height: 100vh;
  padding: 30rpx 24rpx 80rpx;
  background: linear-gradient(180deg, #f9fbff 0%, #f1f4ff 40%, #fdf9ff 100%);
}

.search-card {
  margin: 18rpx 0 24rpx;
  padding: 26rpx 24rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #eef2ff;
  box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.08);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #f6f7fb;
  border-radius: 999rpx;
  padding: 14rpx 20rpx;
  border: 1px solid rgba(99, 102, 241, 0.12);
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #0f172a;
}

.search-clear {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-meta {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-link {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  color: #4338ca;
  font-size: 24rpx;
}

.action-row {
  margin-top: 18rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.action-pill {
  display: flex;
  align-items: center;
  border-radius: 22rpx;
  padding: 18rpx;
  color: #fff;
  box-shadow: 0 12rpx 24rpx rgba(15, 23, 42, 0.12);
  position: relative;
  overflow: hidden;
}

.action-pill:nth-child(3) {
  grid-column: span 2;
}

.pill-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14rpx;
}

.pill-info {
  flex: 1;
}

.pill-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
}

.pill-desc {
  font-size: 24rpx;
  opacity: 0.85;
}

.pill-count {
  font-size: 32rpx;
  font-weight: 700;
}

.word-list-section {
  margin-top: 26rpx;
}
</style>
