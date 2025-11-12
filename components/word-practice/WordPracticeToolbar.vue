<template>
  <view class="word-toolbar">
    <view class="word-toolbar__search">
      <uni-icons type="search" size="18" color="#65728a" />
      <input
        class="word-toolbar__input"
        :value="search"
        placeholder="输入英文或中文关键字"
        confirm-type="search"
        @input="onInput"
        @confirm="$emit('search')"
      />
      <view class="word-toolbar__clear" v-if="search" @click="$emit('clear')">
        <uni-icons type="closeempty" size="16" color="#65728a" />
      </view>
    </view>
    <view class="word-toolbar__meta">
      <text>共 {{ total }} 词 · 第 {{ currentPage }}/{{ totalPages }}</text>
      <view class="word-toolbar__actions">
        <text class="toolbar-link" @click="$emit('random')">随机一词</text>
        <text class="toolbar-link" v-if="search" @click="$emit('reset')">重置搜索</text>
      </view>
    </view>
    <view class="word-toolbar__grid">
      <view
        class="toolbar-card"
        v-for="action in quickActions"
        :key="action.type"
        :style="{ backgroundColor: action.bg }"
        @click="$emit('action', action)"
      >
        <view class="toolbar-card__icon">
          <uni-icons :type="action.icon" size="20" color="#fff" />
        </view>
        <view class="toolbar-card__info">
          <text class="toolbar-card__name">{{ action.name }}</text>
          <text class="toolbar-card__desc">{{ action.desc }}</text>
        </view>
        <text class="toolbar-card__count">{{ action.count }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  quickActions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:search', 'search', 'clear', 'reset', 'action', 'random'])

const onInput = (event) => {
  const value = event?.detail?.value ?? ''
  // 向上传递筛选关键词
  emit('update:search', value)
}
</script>

<style lang="scss" scoped>
.word-toolbar {
  margin: 0 20rpx 20rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 26rpx;
  box-shadow: 0 10rpx 30rpx rgba(15, 23, 42, 0.08);
}

.word-toolbar__search {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-radius: 999rpx;
  background: #f6f7fb;
  padding: 10rpx 18rpx;
}

.word-toolbar__input {
  flex: 1;
  font-size: 26rpx;
}

.word-toolbar__clear {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
}

.word-toolbar__meta {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #6b7280;
  display: flex;
  justify-content: space-between;
}

.word-toolbar__actions {
  display: flex;
  gap: 24rpx;
}

.toolbar-link {
  color: #1d4ed8;
}

.word-toolbar__grid {
  margin-top: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.toolbar-card {
  display: flex;
  align-items: center;
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.08);
}

.toolbar-card__icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
}

.toolbar-card__info {
  flex: 1;
}

.toolbar-card__name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}

.toolbar-card__desc {
  font-size: 24rpx;
  opacity: 0.8;
}

.toolbar-card__count {
  font-size: 32rpx;
  font-weight: 700;
}
</style>
