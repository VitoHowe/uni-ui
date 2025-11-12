<template>
  <view class="word-header">
    <view class="word-header__meta">
      <view class="word-header__info">
        <text class="info-eyebrow">{{ book ? '当前词书' : '尚未选择词书' }}</text>
        <text class="info-title">{{ book?.name || '选择词书开始练习' }}</text>
        <text class="info-desc">
          {{ book?.description || '覆盖后端同步的单词书资源，支持多源学习。' }}
        </text>
      </view>
      <view class="word-header__progress">
        <view class="progress-ring">
          <text class="progress-value">{{ loading ? '--' : `${learningRate}%` }}</text>
          <text class="progress-label">掌握率</text>
        </view>
        <button class="progress-switch" @click="$emit('open-selector')">切换词书</button>
      </view>
    </view>
    <view class="word-header__stats">
      <view class="word-stat" v-for="stat in stats" :key="stat.label">
        <text class="word-stat__value">{{ stat.value }}</text>
        <text class="word-stat__label">{{ stat.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  book: {
    type: Object,
    default: null
  },
  learningRate: {
    type: Number,
    default: 0
  },
  stats: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['open-selector'])
</script>

<style lang="scss" scoped>
.word-header {
  margin: 20rpx;
  padding: 38rpx 34rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, #312e81, #6366f1);
  color: #fff;
  box-shadow: 0 24rpx 60rpx rgba(79, 70, 229, 0.35);
}

.word-header__meta {
  display: flex;
  justify-content: space-between;
  gap: 32rpx;
}

.info-eyebrow {
  font-size: 24rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  opacity: 0.75;
}

.info-title {
  display: block;
  margin-top: 10rpx;
  font-size: 46rpx;
  font-weight: 700;
}

.info-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  opacity: 0.9;
}

.word-header__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.progress-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.progress-value {
  font-size: 32rpx;
  font-weight: 700;
}

.progress-label {
  font-size: 22rpx;
  opacity: 0.85;
}

.progress-switch {
  border: none;
  border-radius: 999rpx;
  padding: 12rpx 26rpx;
  font-size: 26rpx;
  color: #0f172a;
  background: #fff;
}

.word-header__stats {
  display: flex;
  gap: 18rpx;
  margin-top: 32rpx;
}

.word-stat {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.18);
}

.word-stat__value {
  font-size: 34rpx;
  font-weight: 600;
}

.word-stat__label {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  opacity: 0.85;
}
</style>
