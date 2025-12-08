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
  background: #fff;
  border-radius: 24rpx;
}

.word-table__head {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  padding: 22rpx 0;
  font-size: 26rpx;
  color: #6b7280;
  border-bottom: 1rpx solid #e5e7eb;
}

.word-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr;
  padding: 20rpx 0;
  align-items: center;
  border-bottom: 1rpx solid #f3f4f6;
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
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.page-btn {
  flex: 1;
  border: none;
  border-radius: 14rpx;
  background: #eef2ff;
  color: #1d4ed8;
  padding: 16rpx 0;
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
