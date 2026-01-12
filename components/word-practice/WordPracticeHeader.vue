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
        <view class="progress-inline">
          <view class="progress-chip">
            <text class="progress-label">掌握率</text>
            <text class="progress-value">{{ loading ? '--' : `${learningRate}%` }}</text>
          </view>
          <button class="progress-switch" @click="$emit('open-selector')">切换词书</button>
        </view>
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
  padding: 40rpx 34rpx;
  border-radius: 36rpx;
  background: radial-gradient(circle at top right, rgba(149, 114, 252, 0.65), rgba(79, 70, 229, 0.95));
  color: #fff;
  box-shadow: 0 30rpx 60rpx rgba(79, 70, 229, 0.35);
}

.word-header__meta {
  display: flex;
  justify-content: space-between;
  gap: 32rpx;
  flex-wrap: wrap;
  align-items: flex-start;
}

.info-eyebrow {
  font-size: 24rpx;
  letter-spacing: 3rpx;
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
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.progress-inline {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.progress-chip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.progress-value {
  font-size: 30rpx;
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
  box-shadow: 0 10rpx 20rpx rgba(15, 23, 42, 0.18);
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
