<template>
  <view class="practice-panel">
    <view v-if="word" class="practice-card">
      <view class="practice-card__head">
        <view>
          <text class="practice-card__word">{{ word.english }}</text>
          <text class="practice-card__chinese">{{ word.chinese }}</text>
          <text class="practice-card__book">来源 · {{ word.bookName || '未标注' }}</text>
        </view>
        <view class="practice-card__tag">
          {{ word.english?.charAt(0)?.toUpperCase() }}
        </view>
      </view>
      <view class="practice-card__actions">
        <button class="pill pill--primary" @click="$emit('play')" :loading="pronunciationState.loading">
          <uni-icons type="sound" size="18" color="#fff" />
          <text>播放发音</text>
        </button>
        <button class="pill pill--ghost" @click="$emit('toggle-favorite')">
          <uni-icons type="star" size="18" :color="isFavorite ? '#f59e0b' : '#1d4ed8'" />
          <text>{{ isFavorite ? '已收藏' : '收藏' }}</text>
        </button>
        <button class="pill pill--success" @click="$emit('mark-mastered')">
          <uni-icons type="checkmarkempty" size="18" color="#fff" />
          <text>已掌握</text>
        </button>
        <button class="pill pill--warning" @click="$emit('mark-mistake')">
          <uni-icons type="refresh" size="18" color="#fff" />
          <text>待复习</text>
        </button>
      </view>
      <view class="practice-card__meta">
        <text>索引 {{ index + 1 }}/{{ total }}</text>
        <text>状态：{{ masteryLabel }}</text>
      </view>
      <view class="practice-card__nav">
        <button class="nav nav--ghost" @click="$emit('prev')">上一词</button>
        <button class="nav nav--primary" @click="$emit('next')">下一词</button>
      </view>
      <view class="practice-card__preview">即将学习：{{ nextPreview }}</view>
      <view v-if="pronunciationState.error" class="practice-card__error">
        {{ pronunciationState.error }}
      </view>
    </view>
    <view v-else class="practice-empty">
      <uni-icons type="info" size="32" color="#999" />
      <text>暂无单词，请先选择单词本</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  word: {
    type: Object,
    default: null
  },
  index: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  masteryLabel: {
    type: String,
    default: '未学习'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  nextPreview: {
    type: String,
    default: '--'
  },
  pronunciationState: {
    type: Object,
    default: () => ({ loading: false, error: '' })
  }
})

defineEmits(['play', 'toggle-favorite', 'mark-mastered', 'mark-mistake', 'next', 'prev'])
</script>

<style lang="scss" scoped>
.practice-panel {
  margin: 20rpx;
}

.practice-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 34rpx;
  border: 1px solid #eef2ff;
  box-shadow: 0 20rpx 40rpx rgba(15, 23, 42, 0.08);
}

.practice-card__head {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.practice-card__word {
  font-size: 44rpx;
  font-weight: 700;
  color: #0f172a;
}

.practice-card__chinese {
  display: block;
  margin-top: 8rpx;
  font-size: 30rpx;
  color: #6b7280;
}

.practice-card__book {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.practice-card__tag {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #e0e7ff, #f5f3ff);
  color: #4338ca;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
}

.practice-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 24rpx;
}

.pill {
  flex: 1;
  min-width: 220rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 999rpx;
  border: none;
  padding: 18rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.pill--primary {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  box-shadow: 0 10rpx 22rpx rgba(79, 70, 229, 0.28);
}

.pill--ghost {
  background: #eef2ff;
  color: #1d4ed8;
  box-shadow: none;
}

.pill--success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  box-shadow: 0 10rpx 22rpx rgba(34, 197, 94, 0.25);
}

.pill--warning {
  background: linear-gradient(135deg, #f97316, #fb7185);
  color: #fff;
  box-shadow: 0 10rpx 22rpx rgba(248, 113, 113, 0.25);
}

.practice-card__meta {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #64748b;
  margin-top: 22rpx;
}

.practice-card__nav {
  display: flex;
  gap: 20rpx;
  margin-top: 24rpx;
}

.nav {
  flex: 1;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
  font-weight: 600;
}

.nav--primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff;
  box-shadow: 0 12rpx 24rpx rgba(79, 70, 229, 0.2);
}

.nav--ghost {
  border: 2rpx solid #c7d2fe;
  color: #4338ca;
  background: #f8fafc;
}

.practice-card__preview {
  margin-top: 16rpx;
  text-align: right;
  font-size: 24rpx;
  color: #64748b;
}

.practice-card__error {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #b91c1c;
  background: #fff1f2;
  border-radius: 12rpx;
  padding: 10rpx 14rpx;
}

.practice-empty {
  min-height: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #999;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #eef2ff;
  border-radius: 24rpx;
  padding: 36rpx;
  box-shadow: 0 16rpx 32rpx rgba(15, 23, 42, 0.08);
}
</style>
