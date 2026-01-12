<template>
  <view class="word-list">
    <uni-section title="全部词汇" type="line" padding>
      <view v-if="words.length" class="word-table">
        <view class="word-table__head">
          <text>英文</text>
          <text>中文</text>
          <text>来源</text>
        </view>
        <view
          class="word-table__row"
          v-for="word in words"
          :key="word.id"
          @click="$emit('select', word)"
        >
          <text class="word-table__cell">{{ word.english }}</text>
          <text class="word-table__cell">{{ word.chinese }}</text>
          <text class="word-table__cell word-table__cell--muted">{{ word.bookName }}</text>
        </view>
      </view>
      <view v-else class="word-empty">
        <uni-icons type="list" size="32" color="#9ca3af" />
        <text>暂无词汇，请调整筛选条件</text>
      </view>
      <view class="word-pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="currentPage === 1" @click="$emit('change-page', 'prev')">
          上一页
        </button>
        <text class="page-info">{{ currentPage }}/{{ totalPages }}</text>
        <button
          class="page-btn"
          :disabled="currentPage === totalPages"
          @click="$emit('change-page', 'next')"
        >
          下一页
        </button>
      </view>
    </uni-section>
  </view>
</template>

<script setup>
defineProps({
  words: {
    type: Array,
    default: () => []
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  }
})

defineEmits(['change-page', 'select'])
</script>

<style lang="scss" scoped>
.word-list {
  margin: 20rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  border: 1px solid #eef2ff;
  box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.word-table {
  padding: 0 12rpx 8rpx;
}

.word-table__head {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  padding: 18rpx 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #6b7280;
  background: #f8fafc;
  border-radius: 16rpx;
  margin: 0 0 12rpx;
}

.word-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  padding: 18rpx 12rpx;
  align-items: center;
  border-radius: 16rpx;
  background: #fff;
  border: 1px solid #f1f5f9;
  margin-bottom: 12rpx;
  box-shadow: 0 6rpx 14rpx rgba(15, 23, 42, 0.05);
}

.word-table__cell {
  font-size: 28rpx;
  color: #0f172a;
}

.word-table__cell--muted {
  color: #9ca3af;
}

.word-empty {
  min-height: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  color: #9ca3af;
}

.word-pagination {
  margin: 16rpx 12rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 12rpx;
}

.page-btn {
  flex: 1;
  border: none;
  border-radius: 14rpx;
  background: #eef2ff;
  color: #4338ca;
  padding: 14rpx 0;
  font-size: 26rpx;
}

.page-btn:disabled {
  opacity: 0.5;
}

.page-info {
  font-size: 24rpx;
  color: #6b7280;
}
</style>
