<template>
  <view v-if="visible" class="selector-overlay" @click.self="$emit('close')">
    <view class="selector-panel">
      <view class="selector-handle"></view>
      <view class="selector-header">
        <view>
          <text class="selector-eyebrow">Word Library</text>
          <text class="selector-title">选择单词本</text>
          <text class="selector-sub">覆盖云端同步的词书，支持多源学习</text>
        </view>
        <button class="selector-close" @click="$emit('close')">
          <uni-icons type="closeempty" size="20" color="#111827" />
        </button>
      </view>
      <scroll-view scroll-y class="selector-list">
        <view
          class="book-option"
          v-for="book in books"
          :key="book.id"
          @click="$emit('select', book)"
        >
          <view class="book-top">
            <text class="book-name">{{ book.name }}</text>
            <text class="book-lang">{{ book.language || '不限' }}</text>
          </view>
          <text class="book-desc">{{ book.description || '暂无简介，立即开启学习。' }}</text>
          <view class="book-meta">
            <text>{{ book.totalWords || 0 }} 词</text>
            <text>{{ formatDate(book.createdAt) }}</text>
          </view>
          <view class="book-actions">
            <text class="badge" v-if="isActiveBook(book.id)">当前词书</text>
            <button class="primary" v-else>设为当前</button>
          </view>
        </view>
        <view v-if="!books.length && !loading" class="selector-empty">
          <uni-icons type="info" size="32" color="#9ca3af" />
          <text>暂无单词本，请确认后端数据</text>
        </view>
        <view v-if="loading" class="selector-loading">加载中...</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  books: {
    type: Array,
    default: () => []
  },
  selectedBookId: {
    type: [String, Number],
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'select'])

const normalizeBookId = (value) => {
  if (value === null || value === undefined) return null
  return String(value)
}

const isActiveBook = (bookId) => normalizeBookId(bookId) === normalizeBookId(props.selectedBookId)

const formatDate = (value) => {
  if (!value) return '刚刚'
  return new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style lang="scss" scoped>
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: flex-end;
  z-index: 9999;
}

.selector-panel {
  width: 100%;
  max-height: 82vh;
  background: linear-gradient(180deg, #ffffff 0%, #f7f8ff 100%);
  border-radius: 40rpx 40rpx 0 0;
  padding: 30rpx 32rpx 40rpx;
  box-shadow: 0 -30rpx 60rpx rgba(15, 23, 42, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.selector-handle {
  width: 120rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(15, 23, 42, 0.1);
  align-self: center;
  margin-bottom: 18rpx;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.selector-eyebrow {
  font-size: 22rpx;
  letter-spacing: 3rpx;
  text-transform: uppercase;
  color: #94a3b8;
}

.selector-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
  display: block;
  margin-top: 6rpx;
}

.selector-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.selector-close {
  border: none;
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-list {
  flex: 1;
  margin-top: 12rpx;
}

.book-option {
  padding: 24rpx 26rpx;
  border-radius: 24rpx;
  background: #fff;
  border: 1px solid #eef2ff;
  margin-bottom: 20rpx;
  box-shadow: 0 12rpx 24rpx rgba(15, 23, 42, 0.06);
}

.book-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.book-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
}

.book-lang {
  font-size: 24rpx;
  color: #4338ca;
}

.book-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #4b5563;
}

.book-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.book-actions {
  margin-top: 20rpx;
  display: flex;
  justify-content: flex-end;
  gap: 12rpx;
  align-items: center;
}

.badge {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  color: #4338ca;
  font-size: 24rpx;
}

.primary {
  border: none;
  border-radius: 16rpx;
  padding: 14rpx 28rpx;
  font-size: 26rpx;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
}

.selector-empty,
.selector-loading {
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #9ca3af;
}

@keyframes slideUp {
  from {
    transform: translateY(30rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
