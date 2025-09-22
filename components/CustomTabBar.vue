<template>
  <view class="custom-tab-bar">
    <view class="tab-bar-border"></view>
    <view class="tab-bar-content">
      <view 
        v-for="(tab, index) in tabList" 
        :key="index"
        class="tab-item"
        :class="{ active: currentIndex === index }"
        @click="switchTab(tab, index)"
      >
        <view class="tab-icon">
          <uni-icons 
            :type="tab.iconType" 
            :size="24" 
            :color="currentIndex === index ? activeColor : inactiveColor" 
          />
        </view>
        <text 
          class="tab-text" 
          :style="{ color: currentIndex === index ? activeColor : inactiveColor }"
        >
          {{ tab.text }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 定义props
const props = defineProps({
  current: {
    type: Number,
    default: 0
  }
})

// 定义emit
const emit = defineEmits(['change'])

// 响应式数据
const currentIndex = ref(props.current)
const activeColor = '#007AFF'
const inactiveColor = '#999999'

// 底部导航配置
const tabList = [
  {
    pagePath: '/pages/index/index',
    iconType: 'home',
    text: '首页'
  },
  {
    pagePath: '/pages/study/study',
    iconType: 'medal',
    text: '学习'
  },
  {
    pagePath: '/pages/question/question',
    iconType: 'help',
    text: '题库'
  },
  {
    pagePath: '/pages/profile/profile',
    iconType: 'person',
    text: '我的'
  }
]

// 切换tab
const switchTab = (tab, index) => {
  if (currentIndex.value === index) return
  
  currentIndex.value = index
  emit('change', index)
  
  uni.switchTab({
    url: tab.pagePath,
    fail: () => {
      // 如果switchTab失败，使用redirectTo
      uni.redirectTo({
        url: tab.pagePath
      })
    }
  })
}

// 监听页面变化
onMounted(() => {
  currentIndex.value = props.current
})

// 暴露方法给父组件
defineExpose({
  setCurrentIndex: (index) => {
    currentIndex.value = index
  }
})
</script>

<style lang="scss" scoped>
.custom-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #ffffff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.tab-bar-border {
  height: 1rpx;
  background: #e5e5e5;
}

.tab-bar-content {
  display: flex;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0;
  transition: all 0.2s ease;
}

.tab-item.active {
  transform: scale(1.05);
}

.tab-icon {
  margin-bottom: 4rpx;
  transition: transform 0.2s ease;
}

.tab-item.active .tab-icon {
  transform: scale(1.1);
}

.tab-text {
  font-size: 20rpx;
  transition: all 0.2s ease;
}

.tab-item.active .tab-text {
  font-weight: 600;
}
</style> 