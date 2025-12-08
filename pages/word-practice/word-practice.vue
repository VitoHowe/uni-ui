<template>
  <view class="word-practice-page">
    <view class="hero-card">
      <view class="hero-head">
        <view>
          <text class="hero-title">单词练习中心</text>
          <text class="hero-subtitle">
            {{ selectedBook ? selectedBook.name : '请选择单词书' }}
          </text>
        </view>
        <view class="hero-actions">
          <view class="hero-chip" @click="openBookPicker">
            <uni-icons type="arrowdown" size="16" color="#0f62fe" />
            <text>切换单词书</text>
          </view>
          <view class="hero-chip ghost" @click="openListDrawer">
            <uni-icons type="list" size="16" color="#0f62fe" />
            <text>查看列表</text>
          </view>
        </view>
      </view>
      <view class="hero-stats">
        <view class="stat" v-for="stat in summaryStats" :key="stat.label">
          <text class="stat-value">{{ stat.value }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>
      <view class="progress-line">
        <uni-progress :percent="learningRate" color="#0f62fe" active stroke-width="8" />
        <text class="progress-text">进度 {{ learningRate }}%</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-head">
        <text class="section-title">单词书分类</text>
        <view class="section-tip">挑选想练的词书，支持上传后台导入的词书</view>
      </view>
      <scroll-view scroll-x class="book-scroll" v-if="state.wordBooks.length">
        <view
          class="book-card"
          v-for="book in state.wordBooks"
          :key="book.id"
          :class="{ active: selectedBook && selectedBook.id === book.id }"
          @click="selectBook(book)"
        >
          <text class="book-name">{{ book.name }}</text>
          <text class="book-meta">{{ book.total_words || book.total || 0 }} 词</text>
        </view>
      </scroll-view>
      <view v-else class="empty-block">
        <uni-icons type="info" size="24" color="#8c8c8c" />
        <text>暂无词书，请先在后台上传词书</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-head">
        <text class="section-title">练习模式</text>
        <view class="pill-group">
          <view
            class="pill"
            v-for="mode in practiceModes"
            :key="mode.value"
            :class="{ active: state.practiceFilter === mode.value }"
            @click="changePracticeFilter(mode.value)"
          >
            {{ mode.label }}
          </view>
        </view>
      </view>
      <view class="mode-actions">
        <view class="mode-btn primary" @click="jumpRandom">
          <uni-icons type="loop" size="18" color="#fff" />
          <text>随机一词</text>
        </view>
        <view class="mode-btn ghost" @click="openListDrawer">
          <uni-icons type="list" size="18" color="#0f62fe" />
          <text>查看单词列表</text>
        </view>
      </view>
    </view>

    <view class="section-card word-card" v-if="currentWord">
      <view class="word-head">
        <view>
          <text class="word-text">{{ currentWord.word }}</text>
          <text class="word-phonetic" v-if="currentWord.phonetic">/{{ currentWord.phonetic }}/</text>
          <text class="word-translation">{{ currentWord.translation }}</text>
        </view>
        <view class="word-tag">#{{ currentWord.order_index }}</view>
      </view>

      <view class="word-actions">
        <view class="action-chip" @click="playPronunciation">
          <uni-icons type="sound" size="18" color="#fff" />
          <text>发音</text>
        </view>
        <view
          class="action-chip"
          :class="{ warn: currentWord.is_favorite }"
          @click="toggleFavorite(currentWord)"
        >
          <uni-icons type="star" size="18" :color="currentWord.is_favorite ? '#fff' : '#fff'" />
          <text>{{ currentWord.is_favorite ? '已收藏' : '收藏' }}</text>
        </view>
        <view class="action-chip" @click="markWord('mastered')">
          <uni-icons type="checkmarkempty" size="18" color="#fff" />
          <text>掌握</text>
        </view>
        <view class="action-chip" @click="markWord('review')">
          <uni-icons type="refresh" size="18" color="#fff" />
          <text>复习</text>
        </view>
        <view class="action-chip danger" @click="markWrong">
          <uni-icons type="closeempty" size="18" color="#fff" />
          <text>标记错题</text>
        </view>
      </view>

      <view class="meta-row">
        <text>进度：{{ practicePosition }}</text>
        <text>状态：{{ masteryLabel(currentWord.status) }}</text>
      </view>
      <view class="meta-row" v-if="pronunciationState.error">
        <text class="error-text">{{ pronunciationState.error }}</text>
      </view>

      <view class="navigation">
        <view class="nav-btn ghost" @click="switchWord('prev')">上一词</view>
        <view class="nav-btn primary" @click="switchWord('next')">下一词</view>
      </view>
    </view>
    <view v-else class="empty-block">
      <uni-icons type="info" size="28" color="#8c8c8c" />
      <text>暂无可练单词，请切换单词书或添加数据</text>
    </view>

    <uni-popup ref="drawerRef" type="bottom" :mask-click="true" @change="onDrawerChange">
      <view class="drawer-panel">
        <view class="drawer-header">
          <text class="drawer-title">单词列表</text>
          <view class="drawer-close" @click="closeListDrawer">
            <uni-icons type="closeempty" size="18" color="#4b5563" />
          </view>
        </view>
        <view class="drawer-subtitle">点击可跳转当前练习 · 分页加载避免卡顿</view>
        <scroll-view
          scroll-y
          class="drawer-scroll"
          :lower-threshold="60"
          @scrolltolower="loadMoreDrawer"
        >
          <uni-list>
            <uni-list-item
              v-for="word in drawerState.list"
              :key="word.id"
              :title="word.word"
              :note="word.translation"
              :rightText="masteryLabel(word.status)"
              clickable
              @click="jumpToWord(word.id)"
            >
              <template v-slot:header>
                <view class="list-icon" :class="{ fav: word.is_favorite }">
                  <uni-icons :type="word.is_favorite ? 'star' : 'sound'" size="18" color="#fff" />
                </view>
              </template>
            </uni-list-item>
          </uni-list>
          <view class="drawer-footer">
            <view v-if="drawerState.loading" class="drawer-tip">加载中...</view>
            <view v-else-if="drawerState.finished" class="drawer-tip">已加载全部</view>
            <view v-else class="drawer-tip">上拉加载更多</view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>

    <view class="section-card">
      <view class="section-head">
        <text class="section-title">收藏夹</text>
        <text class="section-tip">优先复习已收藏单词</text>
      </view>
      <view v-if="favoriteWords.length" class="chip-list">
        <view class="chip" v-for="word in favoriteWords" :key="word.id" @click="jumpToWord(word.id)">
          <text class="chip-title">{{ word.word }}</text>
          <text class="chip-desc">{{ word.translation }}</text>
        </view>
      </view>
      <view v-else class="empty-block">
        <uni-icons type="star" size="24" color="#f7b500" />
        <text>暂无收藏，练习时点击收藏按钮即可加入</text>
      </view>
    </view>

    <view class="section-card">
      <view class="section-head">
        <text class="section-title">错题本</text>
        <text class="section-tip">标记错题可优先复习</text>
      </view>
      <view v-if="wrongWords.length" class="chip-list">
        <view class="chip danger" v-for="word in wrongWords" :key="word.id" @click="jumpToWord(word.id)">
          <text class="chip-title">{{ word.word }}</text>
          <text class="chip-desc">{{ word.translation }}</text>
        </view>
      </view>
      <view v-else class="empty-block">
        <uni-icons type="closeempty" size="24" color="#ff6b6b" />
        <text>暂无错题，练习中点击“标记错题”即可记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import request from '@/utils/request.js'
import { API_ENDPOINTS } from '@/utils/constants.js'

const state = reactive({
  wordBooks: [],
  selectedBook: null,
  words: [],
  summary: {
    total: 0,
    mastered: 0,
    review: 0,
    favorites: 0,
    wrongs: 0,
    last_word_entry_id: null,
    last_word_order_index: null
  },
  practiceFilter: 'all',
  paging: {
    page: 1,
    limit: 50,
    total: 0,
    loading: false,
    finished: false
  }
})

const drawerState = reactive({
  visible: false,
  list: [],
  page: 1,
  limit: 50,
  total: 0,
  loading: false,
  finished: false
})

const currentIndex = ref(0)
const pronunciationState = reactive({
  loading: false,
  error: ''
})
let audioContext = null
const drawerRef = ref(null)

const practiceModes = [
  { label: '全部', value: 'all' },
  { label: '收藏', value: 'favorite' },
  { label: '错题', value: 'wrong' }
]

const practiceList = computed(() => {
  if (state.practiceFilter === 'favorite') {
    return state.words.filter((item) => item.is_favorite)
  }
  if (state.practiceFilter === 'wrong') {
    return state.words.filter((item) => item.wrong_count > 0)
  }
  return state.words
})

const currentWord = computed(() => {
  if (!practiceList.value.length) return null
  const idx = Math.min(currentIndex.value, practiceList.value.length - 1)
  return practiceList.value[idx]
})

const favoriteWords = computed(() => state.words.filter((item) => item.is_favorite))
const wrongWords = computed(() => state.words.filter((item) => item.wrong_count > 0))

const learningRate = computed(() => {
  if (!state.summary.total) return 0
  return Math.round((state.summary.mastered / state.summary.total) * 100)
})

const summaryStats = computed(() => [
  { label: '词书总量', value: state.summary.total },
  { label: '已掌握', value: state.summary.mastered },
  { label: '待复习', value: state.summary.review },
  { label: '收藏', value: state.summary.favorites }
])

const practicePosition = computed(() => {
  if (!currentWord.value || !practiceList.value.length) return '-- / --'
  return `${currentIndex.value + 1} / ${practiceList.value.length}`
})

const masteryLabel = (status) => {
  if (status === 'mastered') return '已掌握'
  if (status === 'review') return '待复习'
  return '未学习'
}

const openBookPicker = () => {
  uni.showActionSheet({
    itemList: state.wordBooks.map((b) => b.name),
    success: (res) => {
      const book = state.wordBooks[res.tapIndex]
      if (book) selectBook(book)
    }
  })
}

const fetchBooks = async () => {
  try {
    const res = await request.get(API_ENDPOINTS.WORD.BOOKS, { limit: 50 }, { showLoading: false })
    const books = res?.books || res?.data || res || []
    state.wordBooks = books
    if (!state.selectedBook && books.length) {
      selectBook(books[0])
    }
  } catch (error) {
    console.error('获取单词书失败', error)
    uni.showToast({ title: '获取单词书失败', icon: 'none' })
  }
}

const selectBook = async (book) => {
  state.selectedBook = book
  currentIndex.value = 0
  await loadBookData()
}

// 抽屉列表分页
const openListDrawer = async () => {
  drawerRef.value?.open()
  drawerState.visible = true
  if (!drawerState.list.length) {
    await loadDrawerPage(1, false)
  }
}

const closeListDrawer = () => {
  drawerRef.value?.close()
}

const onDrawerChange = (e) => {
  drawerState.visible = !!e.show
}

const loadDrawerPage = async (page = 1, append = false) => {
  if (!state.selectedBook) return
  if (drawerState.loading) return
  drawerState.loading = true
  try {
    const res = await request.get(
      `${API_ENDPOINTS.WORD.BOOK_WORDS}/${state.selectedBook.id}/words`,
      { page, limit: drawerState.limit },
      { showLoading: false }
    )
    const list = (res?.list || res?.words || res || []).map(normalizeWord)
    if (append) {
      drawerState.list = drawerState.list.concat(list)
    } else {
      drawerState.list = list
    }
    drawerState.page = page
    drawerState.total = res?.total || drawerState.list.length
    drawerState.finished = drawerState.list.length >= drawerState.total
  } catch (error) {
    console.error('抽屉列表加载失败', error)
    uni.showToast({ title: '列表加载失败', icon: 'none' })
  } finally {
    drawerState.loading = false
  }
}

const loadMoreDrawer = async () => {
  if (drawerState.finished || drawerState.loading) return
  await loadDrawerPage(drawerState.page + 1, true)
}

const normalizeWord = (item) => ({
  ...item,
  is_favorite: !!item.is_favorite,
  wrong_count: Number(item.wrong_count || 0),
  status: item.status || 'pending'
})

const fetchPracticeWords = async (page = 1, append = false) => {
  if (!state.selectedBook) return
  if (state.paging.loading) return
  state.paging.loading = true
  try {
    const res = await request.get(
      `${API_ENDPOINTS.WORD.BOOK_WORDS}/${state.selectedBook.id}/words`,
      { page, limit: state.paging.limit },
      { showLoading: false }
    )
    const list = (res?.list || res?.words || res || []).map(normalizeWord)
    if (append) {
      state.words = state.words.concat(list)
    } else {
      state.words = list
    }
    state.paging.page = page
    state.paging.total = res?.total || state.summary.total || state.words.length
    state.paging.finished = state.words.length >= state.paging.total
  } catch (error) {
    console.error('获取单词失败', error)
    uni.showToast({ title: '单词加载失败', icon: 'none' })
  } finally {
    state.paging.loading = false
  }
}

const loadBookData = async () => {
  if (!state.selectedBook) return
  // 重置分页
  state.paging.page = 1
  state.paging.total = 0
  state.paging.finished = false
  state.words = []
  drawerState.list = []
  drawerState.page = 1
  drawerState.total = 0
  drawerState.finished = false
  try {
    const bookId = state.selectedBook.id
    const [summaryRes, stateRes] = await Promise.all([
      request.get(`${API_ENDPOINTS.WORD.PROGRESS}/${bookId}/progress`, {}, { showLoading: false }),
      request.get(`${API_ENDPOINTS.WORD.STATE}/${bookId}/state`, {}, { showLoading: false })
    ])

    state.summary = {
      total: summaryRes?.total || 0,
      mastered: summaryRes?.mastered || 0,
      review: summaryRes?.review || 0,
      favorites: summaryRes?.favorites || 0,
      wrongs: summaryRes?.wrongs || 0,
      last_word_entry_id: summaryRes?.last_word_entry_id || null,
      last_word_order_index: summaryRes?.last_word_order_index || null
    }

    // 根据上次位置确定初始页
    const initialPage =
      state.summary.last_word_order_index && state.paging.limit
        ? Math.ceil(state.summary.last_word_order_index / state.paging.limit)
        : 1
    await fetchPracticeWords(initialPage, false)

    if (stateRes?.last_word_entry_id) {
      const idx = state.words.findIndex((w) => w.id === stateRes.last_word_entry_id)
      currentIndex.value = idx >= 0 ? idx : 0
    } else {
      currentIndex.value = 0
    }
  } catch (error) {
    console.error('加载词书数据失败', error)
    uni.showToast({ title: '加载词书失败', icon: 'none' })
  }
}

const changePracticeFilter = (mode) => {
  state.practiceFilter = mode
  currentIndex.value = 0
}

const jumpRandom = () => {
  if (!practiceList.value.length) return
  const randomIndex = Math.floor(Math.random() * practiceList.value.length)
  currentIndex.value = randomIndex
  savePracticeState()
}

const jumpToWord = (wordId) => {
  const idx = practiceList.value.findIndex((w) => w.id === wordId)
  if (idx !== -1) {
    currentIndex.value = idx
    savePracticeState()
    uni.showToast({ title: '已切换到该单词', icon: 'none' })
    closeListDrawer()
  }
}

const updateProgressLocal = (wordId, updater) => {
  const target = state.words.find((w) => w.id === wordId)
  if (target) {
    updater(target)
  }
}

const updateWordProgress = async (word, payload) => {
  if (!state.selectedBook) return
  await request.post(
    `${API_ENDPOINTS.WORD.PROGRESS}/${state.selectedBook.id}/progress`,
    { word_entry_id: word.id, ...payload },
    { showLoading: false }
  )
}

const markWord = async (status) => {
  if (!currentWord.value) return
  try {
    await updateWordProgress(currentWord.value, { status })
    updateProgressLocal(currentWord.value.id, (item) => {
      item.status = status
    })
    refreshSummaryCounters()
    switchWord('next')
  } catch (error) {
    console.error('更新状态失败', error)
    uni.showToast({ title: '更新状态失败', icon: 'none' })
  }
}

const markWrong = async () => {
  if (!currentWord.value) return
  try {
    await updateWordProgress(currentWord.value, { wrong_delta: 1, status: 'review' })
    updateProgressLocal(currentWord.value.id, (item) => {
      item.wrong_count = Number(item.wrong_count || 0) + 1
      item.status = 'review'
    })
    refreshSummaryCounters()
    uni.showToast({ title: '已加入错题本', icon: 'none' })
  } catch (error) {
    console.error('标记错题失败', error)
    uni.showToast({ title: '标记失败', icon: 'none' })
  }
}

const toggleFavorite = async (word) => {
  try {
    const next = !word.is_favorite
    await updateWordProgress(word, { is_favorite: next })
    updateProgressLocal(word.id, (item) => {
      item.is_favorite = next
    })
    refreshSummaryCounters()
    uni.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' })
  } catch (error) {
    console.error('收藏失败', error)
    uni.showToast({ title: '收藏失败', icon: 'none' })
  }
}

const refreshSummaryCounters = () => {
  state.summary.mastered = state.words.filter((w) => w.status === 'mastered').length
  state.summary.review = state.words.filter((w) => w.status === 'review').length
  state.summary.favorites = state.words.filter((w) => w.is_favorite).length
  state.summary.wrongs = state.words.filter((w) => w.wrong_count > 0).length
}

const switchWord = async (direction) => {
  if (!practiceList.value.length) return
  if (direction === 'next') {
    if (currentIndex.value + 1 >= practiceList.value.length && !state.paging.finished) {
      await fetchPracticeWords(state.paging.page + 1, true)
    }
    currentIndex.value = Math.min(currentIndex.value + 1, practiceList.value.length - 1)
  } else {
    currentIndex.value =
      (currentIndex.value - 1 + practiceList.value.length) % practiceList.value.length
  }
  savePracticeState()
}

const savePracticeState = async () => {
  if (!state.selectedBook) return
  const word = currentWord.value
  try {
    await request.post(
      `${API_ENDPOINTS.WORD.STATE}/${state.selectedBook.id}/state`,
      {
        last_word_entry_id: word?.id || null,
        last_word_order_index: word?.order_index || null
      },
      { showLoading: false }
    )
  } catch (error) {
    console.warn('保存学习位置失败', error)
  }
}

const setupAudioContext = () => {
  if (audioContext || !uni.createInnerAudioContext) return
  audioContext = uni.createInnerAudioContext()
  audioContext.obeyMuteSwitch = false
  audioContext.onError((err) => {
    pronunciationState.error = '发音播放失败，请稍后重试'
    console.error('音频错误', err)
  })
}

const playPronunciation = async () => {
  if (!currentWord.value) return
  pronunciationState.error = ''
  pronunciationState.loading = true
  setupAudioContext()
  if (!audioContext) {
    pronunciationState.error = '当前环境不支持音频播放'
    pronunciationState.loading = false
    return
  }
  const text = encodeURIComponent(currentWord.value.word)
  const audioUrls = [
    `https://tts.baidu.com/text2audio?lan=en&ie=UTF-8&text=${text}`,
    `https://dict.youdao.com/dictvoice?type=2&audio=${text}`,
    `https://tts.iciba.com/tts.php?text=${text}`
  ]

  const tryPlay = (index) => {
    if (index >= audioUrls.length) {
      pronunciationState.error = '发音接口异常，请稍后重试'
      pronunciationState.loading = false
      return
    }
    audioContext.src = audioUrls[index]
    audioContext.play()
    audioContext.onError(() => {
      tryPlay(index + 1)
    })
    audioContext.onStop(() => {
      pronunciationState.loading = false
    })
  }

  tryPlay(0)
}

onMounted(() => {
  fetchBooks()
  setupAudioContext()
})

onUnmounted(() => {
  if (audioContext) {
    audioContext.stop()
    audioContext.destroy()
    audioContext = null
  }
})
</script>

<style lang="scss" scoped>
.word-practice-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f8ff 0%, #f9fafb 100%);
  padding: 12rpx 20rpx 80rpx;
  box-sizing: border-box;
}

.hero-card {
  background: linear-gradient(135deg, #0f62fe, #6b8bff);
  border-radius: 20rpx;
  padding: 26rpx 22rpx 30rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(15, 98, 254, 0.35);
  margin: 8rpx 0 16rpx;
}

.hero-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
}

.hero-title {
  font-size: 40rpx;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 12rpx;
}

.hero-chip {
  background: #fff;
  color: #0f62fe;
  border-radius: 999rpx;
  padding: 12rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  box-shadow: 0 8rpx 18rpx rgba(255, 255, 255, 0.2);
}

.hero-chip.ghost {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  box-shadow: none;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-top: 20rpx;
}

.stat {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 16rpx;
  padding: 16rpx;
  text-align: center;
}

.stat-value {
  font-size: 34rpx;
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.progress-line {
  margin-top: 20rpx;
}

.progress-text {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  opacity: 0.85;
}

.section-card {
  background: #fff;
  border-radius: 18rpx;
  padding: 20rpx;
  margin: 10rpx 0 14rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111;
}

.section-tip {
  font-size: 24rpx;
  color: #8c8c8c;
}

.book-scroll {
  margin-top: 16rpx;
  white-space: nowrap;
}

.book-card {
  display: inline-flex;
  flex-direction: column;
  gap: 6rpx;
  background: #f6f8ff;
  border-radius: 14rpx;
  padding: 18rpx 20rpx;
  margin-right: 12rpx;
  min-width: 220rpx;
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.04);
}

.book-card.active {
  background: linear-gradient(135deg, #0f62fe, #5b8dff);
  color: #fff;
}

.book-name {
  font-size: 28rpx;
  font-weight: 600;
}

.book-meta {
  font-size: 24rpx;
  opacity: 0.8;
}

.pill-group {
  display: flex;
  gap: 12rpx;
}

.pill {
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #f1f4ff;
  color: #0f62fe;
  font-size: 26rpx;
}

.pill.active {
  background: #0f62fe;
  color: #fff;
}

.mode-actions {
  margin-top: 16rpx;
  display: flex;
  gap: 12rpx;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 14rpx;
  padding: 18rpx 0;
  font-size: 28rpx;
  font-weight: 600;
}

.mode-btn.primary {
  background: linear-gradient(135deg, #0f62fe, #00b4d8);
  color: #fff;
}

.mode-btn.ghost {
  border: 2rpx solid #d6e4ff;
  color: #0f62fe;
}

.word-card {
  background: #fff;
  border-radius: 18rpx;
}

.word-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-text {
  font-size: 46rpx;
  font-weight: 700;
  color: #111;
}

.word-phonetic {
  display: block;
  font-size: 26rpx;
  color: #4b5563;
}

.word-translation {
  display: block;
  font-size: 28rpx;
  color: #4b5563;
  margin-top: 6rpx;
}

.word-tag {
  min-width: 100rpx;
  text-align: center;
  background: #eef2ff;
  color: #4c51bf;
  border-radius: 16rpx;
  padding: 12rpx 0;
  font-weight: 600;
}

.word-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 18rpx 0;
}

.action-chip {
  flex: 1;
  min-width: 200rpx;
  background: linear-gradient(135deg, #0f62fe, #5b8dff);
  color: #fff;
  border-radius: 12rpx;
  padding: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 26rpx;
}

.action-chip.warn {
  background: linear-gradient(135deg, #ffb347, #ff9f7b);
}

.action-chip.danger {
  background: linear-gradient(135deg, #ff6b6b, #f94d63);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
}

.error-text {
  color: #ff4d4f;
}

.navigation {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.nav-btn {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 14rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #0f62fe, #00b4d8);
  color: #fff;
}

.nav-btn.ghost {
  border: 2rpx solid #d6e4ff;
  color: #0f62fe;
}

.list-card {
  padding: 0 0 12rpx 0;
}

.list-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  background: #0f62fe;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
}

.list-icon.fav {
  background: #ffb347;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
}

.chip {
  flex: 1 1 calc(50% - 12rpx);
  min-width: 300rpx;
  background: #f8f9fa;
  border-radius: 14rpx;
  padding: 14rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.chip.danger {
  background: #fff5f5;
}

.chip-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #111;
}

.chip-desc {
  display: block;
  font-size: 24rpx;
  color: #666;
}

.empty-block {
  min-height: 140rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  color: #8c8c8c;
  font-size: 26rpx;
}

.drawer-panel {
  background: #fff;
  border-top-left-radius: 20rpx;
  border-top-right-radius: 20rpx;
  padding: 20rpx;
  height: 70vh;
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drawer-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111;
}

.drawer-close {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-subtitle {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 6rpx;
  margin-bottom: 12rpx;
}

.drawer-scroll {
  height: calc(70vh - 120rpx);
}

.drawer-footer {
  text-align: center;
  padding: 12rpx 0 6rpx;
  color: #8c8c8c;
  font-size: 24rpx;
}
</style>
