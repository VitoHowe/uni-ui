<template>
  <view class="app-header">
    <view class="header-content">
      <view class="header-left">
        <slot name="left">
          <view class="back-btn" v-if="showBack" @click="goBack">
            <uni-icons type="arrowleft" size="20" color="#333" />
          </view>
        </slot>
      </view>
      
      <view class="header-center">
        <text class="header-title">{{ title }}</text>
      </view>
      
      <view class="header-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  showBack: {
    type: Boolean,
    default: false
  }
})

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: var(--status-bar-height);
}

.header-content {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
}

.header-left,
.header-right {
  width: 60rpx;
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  text-align: center;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: white;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
</style> 