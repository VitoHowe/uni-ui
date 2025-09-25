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
import { LoginStateManager, RouteGuard } from '@/utils/auth.js'

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
  
  // 检查页面访问权限
  if (RouteGuard.isProtectedRoute(tab.pagePath)) {
    const isLoggedIn = LoginStateManager.getLoginState()
    
    if (!isLoggedIn) {
      console.log('❌ Tab切换需要登录权限:', tab.pagePath)
      
      // 保存目标路径，用于登录成功后跳转
      RouteGuard.saveReturnPath(tab.pagePath)
      
      // 显示登录提示
      uni.showModal({
        title: '需要登录',
        content: '访问此页面需要登录，是否立即登录？',
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: (res) => {
          if (res.confirm) {
            // 跳转到登录页面
            uni.navigateTo({
              url: '/pages/login/login'
            })
          }
          // 注意：无论用户选择什么，都不改变当前tab状态
        }
      })
      
      // 权限检查失败，不切换tab状态
      return
    }
  }
  
  // 权限检查通过，切换tab状态
  currentIndex.value = index
  emit('change', index)
  
  // 执行页面跳转
  uni.switchTab({
    url: tab.pagePath,
    fail: () => {
      // 如果switchTab失败，使用redirectTo
      uni.redirectTo({
        url: tab.pagePath,
        fail: () => {
          // 如果页面跳转彻底失败，恢复原来的tab状态
          console.error('❌ 页面跳转失败，恢复tab状态')
          // 这里需要恢复到之前的状态，但由于我们无法确定之前的状态
          // 可以通过emit通知父组件处理，或者重新计算当前页面对应的tab
          
          // 简单的处理方式：显示错误提示
          uni.showToast({
            title: '页面跳转失败',
            icon: 'error'
          })
        }
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