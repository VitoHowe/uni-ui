<template>
  <view class="word-practice-page">
    <view class="hero-card">
      <view class="hero-header">
        <view>
          <text class="hero-title">单词练习中心</text>
          <text class="hero-subtitle">覆盖 {{ wordPracticeList.length }} 条行业词条 · 聚焦中高项备考</text>
        </view>
        <text class="hero-progress">{{ learningRate }}%</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat" v-for="stat in heroStats" :key="stat.label">
          <text class="stat-value">{{ stat.value }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <view class="search-section">
      <view class="search-bar">
        <uni-icons type="search" size="18" color="#65728a" />
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="输入英文或中文快速查找"
          confirm-type="search"
          @confirm="onSearchConfirm"
        />
        <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">
          <uni-icons type="closeempty" size="16" color="#65728a" />
        </view>
      </view>
      <view class="filter-row">
        <text class="filter-info">共 {{ filteredWords.length }} 条 · 第 {{ currentPage }}/{{ totalPages }}</text>
        <view class="filter-actions">
          <text class="filter-btn" @click="jumpRandom">随机一词</text>
          <text class="filter-btn" v-if="searchKeyword" @click="resetFilters">重置</text>
        </view>
      </view>
    </view>

    <view class="quick-section">
      <uni-section title="功能入口" type="line" padding>
        <view class="action-grid">
          <view class="action-item" v-for="action in quickActions" :key="action.type" @click="handleQuickAction(action)">
            <view class="action-icon" :style="{ backgroundColor: action.bg }">
              <uni-icons :type="action.icon" size="20" color="#fff" />
            </view>
            <view class="action-info">
              <text class="action-name">{{ action.name }}</text>
              <text class="action-desc">{{ action.desc }}</text>
            </view>
            <text class="action-count">{{ action.count }}</text>
          </view>
        </view>
      </uni-section>
    </view>

    <view class="word-detail">
      <uni-section title="当前单词" type="line" padding>
        <view v-if="currentWord" class="word-card">
          <view class="word-head">
            <view>
              <text class="word-text">{{ currentWord.english }}</text>
              <text class="word-chinese">{{ currentWord.chinese }}</text>
            </view>
            <view class="word-tag">{{ currentWord.english.charAt(0).toUpperCase() }}</view>
          </view>
          <view class="word-actions">
            <view class="action-pill" @click="playPronunciation">
              <uni-icons type="sound" size="18" color="#fff" />
              <text>发音</text>
            </view>
            <view class="action-pill" @click="toggleBookmark(currentWord)">
              <uni-icons type="star" size="18" :color="currentWord.bookmarked ? '#f7b500' : '#fff'" />
              <text>{{ currentWord.bookmarked ? '已收藏' : '收藏' }}</text>
            </view>
            <view class="action-pill" @click="markWord('mastered')">
              <uni-icons type="checkmarkempty" size="18" color="#fff" />
              <text>掌握</text>
            </view>
            <view class="action-pill" @click="markWord('review')">
              <uni-icons type="refresh" size="18" color="#fff" />
              <text>复习</text>
            </view>
          </view>
          <view class="word-meta">
            <text>索引：{{ currentWordIndex + 1 }}/{{ wordPracticeList.length }}</text>
            <text>状态：{{ masteryMap[currentWord.mastery] }}</text>
          </view>
          <view v-if="pronunciationState.error" class="audio-error">
            {{ pronunciationState.error }}
          </view>
          <view class="word-navigation">
            <view class="nav-btn ghost" @click="switchWord('prev')">上一词</view>
            <view class="nav-btn primary" @click="switchWord('next')">下一词</view>
          </view>
          <view class="next-preview">即将学习：{{ nextWordPreview }}</view>
        </view>
        <view v-else class="word-empty">
          <uni-icons type="info" size="32" color="#999" />
          <text>暂无单词，稍后再试</text>
        </view>
      </uni-section>
    </view>

    <view class="favorites-section">
      <uni-section title="收藏夹" type="line" padding>
        <view v-if="favoriteWords.length" class="favorite-chips">
          <view class="favorite-chip" v-for="word in favoriteWords" :key="word.id" @click="jumpToWord(word.id)">
            <text class="chip-word">{{ word.english }}</text>
            <text class="chip-note">{{ word.chinese }}</text>
          </view>
        </view>
        <view v-else class="empty-state">
          <uni-icons type="star" size="34" color="#f7b500" />
          <text>暂无收藏，点击上方收藏按钮快速添加</text>
        </view>
      </uni-section>
    </view>

    <view class="review-section">
      <uni-section title="待复习 / 错题本" type="line" padding>
        <view v-if="reviewWords.length" class="review-list">
          <view class="review-item" v-for="word in reviewWords" :key="word.id" @click="jumpToWord(word.id)">
            <view>
              <text class="review-word">{{ word.english }}</text>
              <text class="review-definition">{{ word.chinese }}</text>
            </view>
            <text class="review-badge">待复习</text>
          </view>
        </view>
        <view v-else class="empty-state">
          <uni-icons type="checkmarkempty" size="34" color="#28a745" />
          <text>暂无复习任务，继续保持！</text>
        </view>
      </uni-section>
    </view>

    <view class="word-list-section">
      <uni-section title="单词列表" type="line" padding>
        <uni-list>
          <uni-list-item
            v-for="word in paginatedWords"
            :key="word.id"
            :title="word.english"
            :note="word.chinese"
            :rightText="masteryMap[word.mastery]"
            clickable
            @click="jumpToWord(word.id)"
          >
            <template v-slot:header>
              <view class="list-icon">
                <uni-icons :type="word.bookmarked ? 'star' : 'sound'" size="18" :color="word.bookmarked ? '#f7b500' : '#36cfc9'" />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
        <view class="pagination">
          <view class="page-btn" :class="{ disabled: currentPage === 1 }" @click="changePage('prev')">上一页</view>
          <view class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</view>
          <view class="page-btn" :class="{ disabled: currentPage === totalPages }" @click="changePage('next')">下一页</view>
        </view>
      </uni-section>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { wordBank, wordIds } from "@/utils/wordBank.js"

const WORD_PROGRESS_KEY = 'WORD_PRACTICE_PROGRESS'
const PAGE_SIZE = 30

const allowedWordIds = new Set(wordIds)

const readProgress = () => {
  try {
    const snapshot = uni.getStorageSync(WORD_PROGRESS_KEY) || {}
    const normalize = (list) => Array.isArray(list) ? list.filter((id) => allowedWordIds.has(id)) : []
    return {
      favorites: normalize(snapshot.favorites),
      mastered: normalize(snapshot.mastered),
      review: normalize(snapshot.review)
    }
  } catch (error) {
    console.warn('读取单词进度失败', error)
    return { favorites: [], mastered: [], review: [] }
  }
}

const persistProgress = (state) => {
  uni.setStorageSync(WORD_PROGRESS_KEY, {
    favorites: state.favorites,
    mastered: state.mastered,
    review: state.review
  })
}

const progressState = reactive(readProgress())

const wordPracticeList = ref(
  wordBank.map((item) => ({
    ...item,
    bookmarked: progressState.favorites.includes(item.id),
    mastery: progressState.mastered.includes(item.id)
      ? 'mastered'
      : progressState.review.includes(item.id)
        ? 'review'
        : 'pending'
  }))
)

const currentWordIndex = ref(0)
const searchKeyword = ref('')
const currentPage = ref(1)
const pronunciationState = reactive({
  loading: false,
  error: ''
})
let audioContext = null

const masteryMap = {
  mastered: '已掌握',
  review: '待复习',
  pending: '待学习'
}

const currentWord = computed(() => wordPracticeList.value[currentWordIndex.value] || null)
const favoriteWords = computed(() => wordPracticeList.value.filter((item) => item.bookmarked))
const reviewWords = computed(() => wordPracticeList.value.filter((item) => item.mastery === 'review'))
const learningRate = computed(() => {
  if (!wordPracticeList.value.length) return 0
  return Math.round((progressState.mastered.length / wordPracticeList.value.length) * 100)
})
const heroStats = computed(() => [
  { label: '词库总量', value: wordPracticeList.value.length },
  { label: '已掌握', value: progressState.mastered.length },
  { label: '收藏夹', value: progressState.favorites.length }
])

const filteredWords = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return wordPracticeList.value
  return wordPracticeList.value.filter((item) => {
    return item.english.toLowerCase().includes(keyword) || item.chinese.includes(keyword)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredWords.value.length / PAGE_SIZE)))
const paginatedWords = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredWords.value.slice(start, start + PAGE_SIZE)
})

const nextWordPreview = computed(() => {
  if (!wordPracticeList.value.length) return '--'
  const nextIndex = (currentWordIndex.value + 1) % wordPracticeList.value.length
  return wordPracticeList.value[nextIndex].english
})

const quickActions = computed(() => [
  {
    type: 'random',
    name: '随机抽词',
    desc: '灵感练习',
    count: '',
    icon: 'loop',
    bg: '#7a86ff'
  },
  {
    type: 'favorites',
    name: '收藏夹',
    desc: '重点词汇',
    count: favoriteWords.value.length,
    icon: 'star',
    bg: '#ffb347'
  },
  {
    type: 'review',
    name: '待复习',
    desc: '错题本',
    count: reviewWords.value.length,
    icon: 'closeempty',
    bg: '#ff6b6b'
  },
  {
    type: 'list',
    name: '全部词汇',
    desc: '跳至列表',
    count: filteredWords.value.length,
    icon: 'list',
    bg: '#5ad8a6'
  }
])

const updateProgressArrays = (wordId, type) => {
  const removeFrom = (arr) => arr.filter((id) => id !== wordId)
  if (type === 'mastered') {
    progressState.mastered = Array.from(new Set([...removeFrom(progressState.mastered), wordId]))
    progressState.review = removeFrom(progressState.review)
  } else if (type === 'review') {
    progressState.review = Array.from(new Set([...removeFrom(progressState.review), wordId]))
    progressState.mastered = removeFrom(progressState.mastered)
  }
  persistProgress(progressState)
}

const toggleBookmark = (word) => {
  word.bookmarked = !word.bookmarked
  if (word.bookmarked) {
    if (!progressState.favorites.includes(word.id)) {
      progressState.favorites.push(word.id)
    }
    uni.showToast({ title: '已加入收藏', icon: 'none' })
  } else {
    progressState.favorites = progressState.favorites.filter((id) => id !== word.id)
    uni.showToast({ title: '已取消收藏', icon: 'none' })
  }
  persistProgress(progressState)
}

const markWord = (status) => {
  if (!currentWord.value) return
  currentWord.value.mastery = status
  updateProgressArrays(currentWord.value.id, status)
  const toastText = status === 'mastered' ? '标记为已掌握' : '已加入待复习'
  uni.showToast({ title: toastText, icon: 'none' })
  switchWord('next')
}

const switchWord = (direction) => {
  if (!wordPracticeList.value.length) return
  if (direction === 'next') {
    currentWordIndex.value = (currentWordIndex.value + 1) % wordPracticeList.value.length
  } else {
    currentWordIndex.value =
      (currentWordIndex.value - 1 + wordPracticeList.value.length) % wordPracticeList.value.length
  }
  pronunciationState.error = ''
}

const changePage = (direction) => {
  if (direction === 'prev' && currentPage.value > 1) {
    currentPage.value -= 1
  }
  if (direction === 'next' && currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const resetFilters = () => {
  searchKeyword.value = ''
  currentPage.value = 1
}

const onSearchConfirm = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchKeyword.value = ''
}

watch(searchKeyword, () => {
  currentPage.value = 1
})

const handleQuickAction = (action) => {
  if (action.type === 'list') {
    uni.pageScrollTo({
      selector: '.word-list-section',
      duration: 300
    })
    return
  }
  if (action.type === 'random') {
    jumpRandom()
    return
  }
  if (action.type === 'favorites') {
    if (!favoriteWords.value.length) {
      uni.showToast({ title: '暂无收藏', icon: 'none' })
      return
    }
    jumpToWord(favoriteWords.value[0].id)
    uni.showToast({ title: '已定位到收藏单词', icon: 'none' })
    return
  }
  if (action.type === 'review') {
    if (!reviewWords.value.length) {
      uni.showToast({ title: '暂无待复习', icon: 'none' })
      return
    }
    jumpToWord(reviewWords.value[0].id)
    uni.showToast({ title: '已定位到待复习单词', icon: 'none' })
  }
}

const jumpRandom = () => {
  if (!filteredWords.value.length) return
  const randomWord = filteredWords.value[Math.floor(Math.random() * filteredWords.value.length)]
  jumpToWord(randomWord.id)
}

const jumpToWord = (wordId) => {
  const index = wordPracticeList.value.findIndex((item) => item.id === wordId)
  if (index !== -1) {
    jumpToPageForWord(wordId)
    currentWordIndex.value = index
    pronunciationState.error = ''
  }
}

const setupAudioContext = () => {
  if (audioContext || !uni.createInnerAudioContext) return
  audioContext = uni.createInnerAudioContext()
  audioContext.obeyMuteSwitch = false
  audioContext.onStop(() => {
    pronunciationState.error = ''
  })
  audioContext.onError((err) => {
    console.error('音频播放失败', err)
    pronunciationState.error = '音频播放失败，请检查网络'
  })
}

const playPronunciation = async () => {
  if (!currentWord.value) return
  if (!uni.createInnerAudioContext) {
    uni.showToast({ title: '当前环境不支持音频', icon: 'none' })
    return
  }
  pronunciationState.error = ''
  pronunciationState.loading = true
  try {
    setupAudioContext()
    if (!audioContext) {
      pronunciationState.error = '发音组件初始化失败'
      return
    }
    const audioUrl = `https://dict.youdao.com/dictvoice?type=2&audio=${encodeURIComponent(currentWord.value.english)}`
    audioContext.src = audioUrl
    audioContext.play()
  } catch (error) {
    console.error('播放发音失败', error)
    pronunciationState.error = '发音接口异常，请稍后再试'
  } finally {
    pronunciationState.loading = false
  }
}

const jumpToPageForWord = (wordId) => {
  const index = filteredWords.value.findIndex((item) => item.id === wordId)
  if (index === -1) return
  currentPage.value = Math.floor(index / PAGE_SIZE) + 1
}

watch(filteredWords, () => {
  if ((currentPage.value - 1) * PAGE_SIZE >= filteredWords.value.length) {
    currentPage.value = 1
  }
})

onMounted(() => {
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
  background: #f5f7fb;
  padding-bottom: 60rpx;
}

.hero-card {
  margin: 20rpx;
  background: linear-gradient(135deg, #1d4ed8, #5b21b6);
  border-radius: 24rpx;
  padding: 40rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(29, 78, 216, 0.35);
}

.hero-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
}

.hero-title {
  font-size: 40rpx;
  font-weight: 700;
}

.hero-subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  opacity: 0.85;
}

.hero-progress {
  font-size: 48rpx;
  font-weight: 700;
}

.hero-stats {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}

.hero-stat {
  flex: 1;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 18rpx;
  padding: 20rpx;
  text-align: center;
}

.stat-value {
  font-size: 34rpx;
  font-weight: 600;
}

.stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.search-section {
  margin: 0 20rpx 10rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}

.search-bar {
  display: flex;
  align-items: center;
  background: #f0f4ff;
  border-radius: 999rpx;
  padding: 0 20rpx;
}

.search-input {
  flex: 1;
  height: 70rpx;
  font-size: 28rpx;
  padding: 0 10rpx;
}

.clear-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-row {
  margin-top: 10rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: #666;
}

.filter-actions {
  display: flex;
  gap: 20rpx;
}

.filter-btn {
  color: #0f62fe;
}

.action-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.action-item {
  background: #fff;
  border-radius: 18rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.action-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-info {
  flex: 1;
}

.action-name {
  font-size: 30rpx;
  font-weight: 600;
}

.action-desc {
  display: block;
  font-size: 24rpx;
  color: #8c8c8c;
}

.action-count {
  font-size: 30rpx;
  font-weight: 600;
  color: #111;
}

.word-detail,
.favorites-section,
.review-section,
.word-list-section {
  margin: 20rpx;
}

.word-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.word-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-text {
  font-size: 46rpx;
  font-weight: 700;
  color: #1f2933;
}

.word-chinese {
  display: block;
  font-size: 30rpx;
  color: #4b5563;
  margin-top: 8rpx;
}

.word-tag {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  background: #eef2ff;
  color: #4c51bf;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 600;
}

.word-actions {
  margin: 24rpx 0;
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.action-pill {
  flex: 1;
  min-width: 220rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #0f62fe, #5b8dff);
  color: #fff;
  padding: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  font-size: 26rpx;
}

.word-meta {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #666;
}

.audio-error {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #ff4d4f;
}

.word-navigation {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}

.nav-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #007aff, #00b4d8);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

.nav-btn.ghost {
  border: 2rpx solid #d6e4ff;
  color: #0f62fe;
}

.next-preview {
  margin-top: 16rpx;
  font-size: 24rpx;
  text-align: right;
  color: #666;
}

.word-empty {
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #999;
  font-size: 28rpx;
}

.favorite-chips {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.favorite-chip {
  background: #fff;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.chip-word {
  font-size: 30rpx;
  font-weight: 600;
  color: #0f172a;
}

.chip-note {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.review-item {
  background: #fff5f5;
  border-radius: 16rpx;
  padding: 18rpx 22rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-word {
  font-size: 30rpx;
  font-weight: 600;
  color: #b41c1c;
}

.review-definition {
  display: block;
  font-size: 24rpx;
  color: #8c6d6d;
}

.review-badge {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 24rpx;
}

.empty-state {
  min-height: 160rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  color: #8c8c8c;
}

.list-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f0f9ff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.pagination {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.page-btn {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 14rpx;
  background: #eef2ff;
  color: #1d4ed8;
  font-size: 26rpx;
}

.page-btn.disabled {
  opacity: 0.5;
}

.page-info {
  font-size: 24rpx;
  color: #666;
}
</style>
