<template>
  <view class="auth-guard-container">
    <!-- 已登录状态：显示受保护的内容 -->
    <slot v-if="authStore.isAuthenticated" />
    
    <!-- 未登录状态：显示登录引导 -->
    <view v-else class="login-guide">
      <!-- 登录引导卡片 -->
      <view class="guide-card">
        <view class="guide-icon">
          <uni-icons type="locked" size="48" color="#007AFF" />
        </view>
        
        <view class="guide-content">
          <text class="guide-title">{{ title || '需要登录' }}</text>
          <text class="guide-message">{{ message || '请登录后查看完整功能' }}</text>
        </view>
        
        <view class="guide-actions">
          <button class="login-btn" @click="goToLogin">
            <uni-icons type="person" size="18" color="#fff" style="margin-right: 8rpx;" />
            立即登录
          </button>
          
          <button v-if="showGuestOption" class="guest-btn" @click="handleGuestAccess">
            暂不登录
          </button>
        </view>
      </view>
      
      <!-- 功能预览区域（可选） -->
      <view v-if="showPreview" class="preview-area">
        <view class="preview-header">
          <text class="preview-title">功能预览</text>
        </view>
        <view class="preview-content">
          <slot name="preview">
            <view class="preview-item">
              <uni-icons type="checkmarkempty" size="16" color="#28a745" />
              <text>个性化学习推荐</text>
            </view>
            <view class="preview-item">
              <uni-icons type="checkmarkempty" size="16" color="#28a745" />
              <text>学习进度同步</text>
            </view>
            <view class="preview-item">
              <uni-icons type="checkmarkempty" size="16" color="#28a745" />
              <text>文件上传与管理</text>
            </view>
          </slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { RouteGuard } from '@/utils/auth.js'

// Props
const props = defineProps({
  // 标题文本
  title: {
    type: String,
    default: '需要登录'
  },
  
  // 提示消息
  message: {
    type: String,
    default: '请登录后查看完整功能'
  },
  
  // 是否显示游客访问选项
  showGuestOption: {
    type: Boolean,
    default: false
  },
  
  // 是否显示功能预览
  showPreview: {
    type: Boolean,
    default: false
  },
  
  // 当前页面路径（用于登录后返回）
  currentPath: {
    type: String,
    default: ''
  },
  
  // 自动重定向到登录页（而不是显示引导）
  autoRedirect: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['guestAccess'])

// 认证store
const authStore = useAuthStore()

// 计算属性
const shouldRedirect = computed(() => {
  return props.autoRedirect && !authStore.isAuthenticated
})

// 跳转到登录页面
const goToLogin = () => {
  // 保存当前路径
  if (props.currentPath) {
    RouteGuard.saveReturnPath(props.currentPath)
  } else {
    // 尝试获取当前页面路径
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const path = `/${currentPage.route}`
      RouteGuard.saveReturnPath(path)
    }
  }
  
  // 跳转到登录页面
  uni.navigateTo({
    url: '/pages/login/login'
  })
}

// 处理游客访问
const handleGuestAccess = () => {
  emit('guestAccess')
}

// 如果设置了自动重定向，检查登录状态
if (shouldRedirect.value) {
  goToLogin()
}
</script>

<style lang="scss" scoped>
.auth-guard-container {
  width: 100%;
  height: 100%;
}

.login-guide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40rpx;
}

.guide-card {
  background: white;
  border-radius: 24rpx;
  padding: 60rpx 40rpx;
  width: 100%;
  max-width: 600rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.guide-icon {
  margin-bottom: 30rpx;
}

.guide-content {
  margin-bottom: 50rpx;
  
  .guide-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .guide-message {
    display: block;
    font-size: 28rpx;
    color: #666;
    line-height: 1.5;
  }
}

.guide-actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  .login-btn {
    height: 88rpx;
    background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
    color: white;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);
    transition: all 0.3s ease;
    
    &:active {
      transform: translateY(2rpx);
      box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.4);
    }
  }
  
  .guest-btn {
    height: 80rpx;
    background: transparent;
    color: #666;
    border: 2rpx solid #e0e0e0;
    border-radius: 40rpx;
    font-size: 28rpx;
    
    &:active {
      background: #f5f5f5;
    }
  }
}

.preview-area {
  margin-top: 40rpx;
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.preview-header {
  margin-bottom: 30rpx;
  text-align: center;
  
  .preview-title {
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
  }
}

.preview-content {
  .preview-item {
    display: flex;
    align-items: center;
    padding: 15rpx 0;
    font-size: 26rpx;
    color: #666;
    
    uni-icons {
      margin-right: 15rpx;
    }
  }
}

// 响应式设计
@media screen and (max-width: 750rpx) {
  .guide-card {
    margin: 0 20rpx;
    padding: 40rpx 30rpx;
  }
  
  .preview-area {
    margin: 30rpx 20rpx 0;
    padding: 30rpx;
  }
}
</style>
