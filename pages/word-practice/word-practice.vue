<template>
  <view class="word-hub">
    <view class="hero-card">
      <view class="hero-top">
        <view>
          <text class="hero-badge">Vocabulary Hub</text>
          <text class="hero-title">智能记忆控制台</text>
          <text class="hero-desc">集中管理词书、收藏与错词，保持高效复习节奏。</text>
        </view>
        <button class="hero-switch" @click="openSelector">切换默认词书</button>
      </view>
      <view class="hero-stats">
        <view class="hero-stat" v-for="stat in heroStats" :key="stat.label">
          <text class="stat-value">{{ stat.value }}</text>
          <text class="stat-label">{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-head">
        <view>
          <text class="section-title">单词本</text>
          <text class="section-sub">共 {{ store.books.length }} 本 · 选择任意一本进入练习</text>
        </view>
      </view>
      <view v-if="store.booksLoading" class="section-loading">加载中...</view>
      <view v-else-if="!store.books.length" class="section-empty">
        <uni-icons type="info" size="32" color="#94a3b8" />
        <text>暂无单词书，请先上传或从后台同步。</text>
      </view>
      <view v-else class="book-grid">
        <view class="book-card" v-for="book in store.books" :key="book.id">
          <view class="book-card__header">
            <text class="book-name">{{ book.name }}</text>
            <text class="book-meta">{{ formatWords(book.totalWords) }} 词</text>
          </view>
          <text class="book-desc">{{ book.description || '暂无简介，立即开启学习。' }}</text>
          <view class="book-tags">
            <text class="tag">{{ book.language || 'unk' }}</text>
            <text class="tag ghost">创建于 {{ formatDate(book.createdAt) }}</text>
          </view>
          <view class="book-actions">
            <button class="ghost-btn" @click="previewBook(book)">设为当前</button>
            <button class="primary-btn" @click="goPractice(book.id)">进入练习</button>
          </view>
        </view>
      </view>
    </view>

    <view class="section glass">
      <view class="section-head">
        <view>
          <text class="section-title">收藏夹</text>
          <text class="section-sub">当前词书 · {{ currentBookName }}</text>
        </view>
        <text class="section-pill">{{ favoriteCount }} 词</text>
      </view>
      <view class="highlight">
        <text class="highlight-count">{{ favoriteCount }}</text>
        <text class="highlight-note">
          {{ favoriteCount ? '已收藏词条，进入练习可查看详情' : '还没有收藏，进入词书即可收藏' }}
        </text>
      </view>
      <button class="section-btn" @click="goPractice(store.selectedBookId)">前往练习</button>
    </view>

    <view class="section glass">
      <view class="section-head">
        <view>
          <text class="section-title">错词复习</text>
          <text class="section-sub">自动记录需要复盘的词汇</text>
        </view>
        <text class="section-pill warm">{{ mistakeCount }} 词</text>
      </view>
      <view class="highlight warm">
        <text class="highlight-count">{{ mistakeCount }}</text>
        <text class="highlight-note">
          {{ mistakeCount ? '存在待复习词汇，进入词书即可开始复盘' : '暂时没有错词，保持学习节奏' }}
        </text>
      </view>
      <button class="section-btn warm" @click="goPractice(store.selectedBookId)">开始复习</button>
    </view>

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
import { computed, ref, onMounted } from 'vue'
import { useWordPracticeStore } from '@/stores/wordPractice.js'
import WordBookSelector from '@/components/word-practice/WordBookSelector.vue'

const store = useWordPracticeStore()
const selectorVisible = ref(false)

const progressSnapshot = computed(() => store.currentProgress)

const heroStats = computed(() => [
  { label: '词书', value: store.books.length },
  { label: '收藏', value: progressSnapshot.value.favorites.length },
  { label: '错词', value: progressSnapshot.value.mistakes.length }
])

const currentBookName = computed(() => store.currentBook?.name || '未选择')
const favoriteCount = computed(() => progressSnapshot.value.favorites.length)
const mistakeCount = computed(() => progressSnapshot.value.mistakes.length)

const ensureInitialData = async () => {
  if (!store.books.length) {
    await store.loadBooks()
  }
  if (!store.selectedBookId && store.books.length) {
    await store.selectBook(store.books[0].id, { preloadWords: false })
  }
}

onMounted(() => {
  ensureInitialData()
})

const openSelector = () => {
  selectorVisible.value = true
}

const handleSelectBook = async (book) => {
  if (!book) return
  await store.selectBook(book.id, { preloadWords: false })
  selectorVisible.value = false
}

const previewBook = async (book) => {
  await store.selectBook(book.id, { preloadWords: false })
  selectorVisible.value = false
  uni.showToast({ title: `已切换至 ${book.name}`, icon: 'none' })
}

const goPractice = (bookId) => {
  const target = bookId || store.selectedBookId
  if (!target) {
    uni.showToast({ title: '请先选择词书', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/word-practice/word-detail?bookId=${target}` })
}

const formatWords = (count = 0) => count.toLocaleString()
const formatDate = (value) => {
  if (!value) return '刚刚'
  return new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.word-hub {
  min-height: 100vh;
  padding: 30rpx 24rpx 80rpx;
  background: linear-gradient(180deg, #f9fbff 0%, #f1f4ff 40%, #fdf9ff 100%);
}

.hero-card {
  border-radius: 36rpx;
  padding: 42rpx 32rpx;
  background: radial-gradient(circle at top right, rgba(149, 114, 252, 0.6), rgba(79, 70, 229, 0.95));
  color: #fff;
  box-shadow: 0 30rpx 60rpx rgba(79, 70, 229, 0.35);
  margin-bottom: 32rpx;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.hero-badge {
  font-size: 24rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  opacity: 0.75;
}

.hero-title {
  display: block;
  margin-top: 12rpx;
  font-size: 48rpx;
  font-weight: 700;
}

.hero-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  opacity: 0.9;
}

.hero-switch {
  height: fit-content;
  border: none;
  border-radius: 999rpx;
  padding: 14rpx 24rpx;
  font-size: 26rpx;
  color: #1d4ed8;
  background: #fff;
}

.hero-stats {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.hero-stat {
  flex: 1;
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.22);
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 600;
}

.stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
}

.section {
  margin-bottom: 30rpx;
  padding: 26rpx 24rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.08);
}

.section.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20rpx);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #0f172a;
}

.section-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.section-pill {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  color: #4338ca;
  font-size: 24rpx;
}

.section-pill.warm {
  background: #fff5f5;
  color: #b91c1c;
}

.section-loading,
.section-empty {
  min-height: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #9ca3af;
}

.book-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.book-card {
  border-radius: 24rpx;
  padding: 24rpx;
  background: linear-gradient(135deg, #ffffff, #f4f6ff);
  border: 1px solid #eef2ff;
}

.book-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.book-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
}

.book-meta {
  font-size: 24rpx;
  color: #6b7280;
}

.book-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #4b5563;
}

.book-tags {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}

.tag {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 24rpx;
}

.tag.ghost {
  background: #f1f5f9;
  color: #475569;
}

.book-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.ghost-btn,
.primary-btn,
.section-btn {
  flex: 1;
  border-radius: 16rpx;
  padding: 18rpx 0;
  font-size: 28rpx;
  border: none;
}

.ghost-btn {
  background: #eef2ff;
  color: #1d4ed8;
}

.primary-btn,
.section-btn {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
}

.section-btn.warm {
  background: linear-gradient(135deg, #f97316, #fb7185);
}

.highlight {
  border-radius: 22rpx;
  padding: 20rpx;
  background: #f7f8ff;
  margin-bottom: 18rpx;
}

.highlight.warm {
  background: #fff4f4;
}

.highlight-count {
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}

.highlight-note {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}
</style>
