<template>
  <view class="status-panel">
    <uni-section :title="title" type="line" padding>
      <view v-if="words.length" class="status-list">
        <view class="status-item" v-for="word in words" :key="word.id" @click="$emit('select', word)">
          <view class="status-item__info">
            <text class="status-item__word">{{ word.english }}</text>
            <text class="status-item__note">{{ word.chinese }}</text>
            <text class="status-item__source">来源 · {{ word.bookName }}</text>
          </view>
          <view class="status-item__badge">
            <text>{{ badgeLabel }}</text>
          </view>
        </view>
      </view>
      <view v-else class="status-empty">
        <uni-icons :type="emptyIcon" size="36" color="#9ca3af" />
        <text>{{ emptyText }}</text>
      </view>
    </uni-section>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  words: {
    type: Array,
    default: () => []
  },
  badgeLabel: {
    type: String,
    default: ''
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  emptyIcon: {
    type: String,
    default: 'info'
  }
})

defineEmits(['select'])
</script>

<style lang="scss" scoped>
.status-panel {
  margin: 20rpx;
  background: #fff;
  border-radius: 20rpx;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
}

.status-item__word {
  font-size: 30rpx;
  font-weight: 600;
  color: #0f172a;
}

.status-item__note {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 4rpx;
}

.status-item__source {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
  margin-top: 4rpx;
}

.status-item__badge {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  color: #4338ca;
  font-size: 24rpx;
}

.status-empty {
  min-height: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #9ca3af;
}
</style>
