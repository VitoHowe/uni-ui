<template>
  <view class="login-container">
    <!-- 背景装饰 -->
    <view class="background-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <!-- 头部Logo -->
    <view class="header-section">
      <image src="/static/logo.png" class="app-logo" mode="aspectFit" @error="onLogoError" />
      <text class="app-title">高级信息系统项目管理师</text>
      <text class="app-subtitle">学习助手</text>
    </view>
    
    <!-- 功能介绍 -->
    <view class="features-section">
      <view class="feature-item" v-for="(feature, index) in features" :key="index">
        <view class="feature-icon" :style="{backgroundColor: feature.color}">
          <uni-icons :type="feature.icon" size="24" color="#fff" />
        </view>
        <view class="feature-content">
          <text class="feature-title">{{ feature.title }}</text>
          <text class="feature-desc">{{ feature.description }}</text>
        </view>
      </view>
    </view>
    
    <!-- 登录提示 -->
    <view class="login-prompt">
      <text class="prompt-text">使用微信登录，享受完整学习功能</text>
    </view>
    
    <!-- 登录按钮区域 -->
    <view class="login-actions">
      <!-- 微信登录按钮 -->
      <button 
        class="wechat-login-btn"
        :class="{ 'loading': authStore.loading.login }"
        :disabled="authStore.loading.login || showLoadingMask"
        @click="handleWechatLogin"
        open-type="getUserInfo"
        @getuserinfo="onGetUserInfo"
      >
        <uni-icons 
          v-if="!authStore.loading.login && !showLoadingMask" 
          type="weixin" 
          size="20" 
          color="#fff" 
          style="margin-right: 10rpx;" 
        />
        <uni-icons 
          v-else
          type="spinner-cycle" 
          size="20" 
          color="#fff" 
          style="margin-right: 10rpx;" 
        />
        <text class="btn-text">
          {{ getLoginButtonText() }}
        </text>
      </button>
      
      <!-- 游客浏览按钮 -->
      <button 
        class="guest-browse-btn"
        :disabled="authStore.loading.login"
        @click="handleGuestBrowse"
      >
        <text class="btn-text">暂不登录，游客浏览</text>
      </button>
    </view>
    
    <!-- 登录说明 -->
    <view class="login-notice">
      <text class="notice-text">
        登录后可使用文件上传、学习进度同步、个人资料管理等完整功能
      </text>
    </view>
    
    <!-- 用户协议 -->
    <view class="agreement-section">
      <text class="agreement-text">
        登录即表示同意
        <text class="link-text" @click="showUserAgreement">《用户协议》</text>
        和
        <text class="link-text" @click="showPrivacyPolicy">《隐私政策》</text>
      </text>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">版本 {{ appVersion }}</text>
    </view>
    
    <!-- 加载遮罩 -->
    <view v-if="showLoadingMask" class="loading-mask">
      <view class="loading-content">
        <uni-icons type="spinner-cycle" size="40" color="#007AFF" />
        <text class="loading-text">{{ loadingText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { RouteGuard } from '@/utils/auth.js'
import NavigationGuard from '@/utils/navigationGuard.js'

// 状态管理
const authStore = useAuthStore()

// 响应式数据
const appVersion = ref('1.0.0')
const showLoadingMask = ref(false)
const loadingText = ref('登录中...')

// 功能特色介绍
const features = reactive([
  {
    title: '智能学习',
    description: '个性化学习路径推荐',
    icon: 'gear',
    color: '#007AFF'
  },
  {
    title: '题库练习',
    description: '海量题目，精准练习',
    icon: 'compose',
    color: '#28a745'
  },
  {
    title: '进度同步',
    description: '多端数据实时同步',
    icon: 'cloud-upload',
    color: '#ffc107'
  },
  {
    title: '文件上传',
    description: '支持文档批量解析',
    icon: 'folder',
    color: '#17a2b8'
  }
])

// 计算属性
const canLogin = computed(() => {
  return !authStore.loading.login && !showLoadingMask.value
})

// 获取登录按钮文本
const getLoginButtonText = () => {
  if (showLoadingMask.value) {
    return loadingText.value || '处理中...'
  }
  if (authStore.loading.login) {
    return '登录中...'
  }
  return '微信一键登录'
}

// Logo加载失败处理
const onLogoError = () => {
  console.warn('Logo加载失败，使用默认图标')
}

// 微信登录处理
const handleWechatLogin = async () => {
  console.log('🔘 用户点击微信登录按钮')
  
  // 防止重复点击
  if (!canLogin.value) {
    console.warn('⚠️ 当前正在登录中，忽略重复点击')
    return
  }
  
  try {
    showLoadingMask.value = true
    loadingText.value = '正在获取微信授权...'
    
    console.log('🚀 开始微信登录流程')
    
    // 尝试带用户信息的完整登录
    await authStore.loginWithWechat(true, false)
    
    loadingText.value = '登录成功，跳转中...'
    console.log('🎉 微信登录成功，准备跳转')
    
    // 登录成功，跳转到目标页面
    await navigateAfterLogin()
    
  } catch (error) {
    console.error('❌ 微信登录失败:', error)
    
    // 特殊处理code相关错误
    if (authStore.isCodeRelatedError && authStore.isCodeRelatedError(error)) {
      console.log('🔄 检测到code错误，显示重试选项')
      uni.showModal({
        title: '登录失败',
        content: '微信授权码已失效，是否重新尝试登录？',
        confirmText: '重试登录',
        cancelText: '稍后再试',
        success: async (res) => {
          if (res.confirm) {
            // 延迟后重试
            setTimeout(() => {
              handleWechatLogin()
            }, 500)
          }
        }
      })
    } else {
      handleLoginError(error)
    }
  } finally {
    showLoadingMask.value = false
  }
}

// 获取用户信息回调（兼容旧版本）
const onGetUserInfo = async (event) => {
  console.log('获取用户信息:', event.detail)
  
  if (event.detail.errMsg === 'getUserInfo:ok') {
    // 用户同意授权，已在 handleWechatLogin 中处理
    return
  } else {
    // 用户拒绝授权，需要重新获取code进行基础登录
    console.log('🔄 用户拒绝授权，尝试基础登录（使用新code）')
    
    if (!canLogin.value) {
      console.warn('⚠️ 当前正在登录中，忽略重复请求')
      return
    }
    
    try {
      showLoadingMask.value = true
      loadingText.value = '正在进行基础登录...'
      
      // 使用新的code进行基础登录（标记为重试以强制获取新code）
      await authStore.loginWithWechat(false, true)
      
      loadingText.value = '登录成功，跳转中...'
      await navigateAfterLogin()
      
    } catch (error) {
      console.error('基础登录失败:', error)
      handleLoginError(error)
    } finally {
      showLoadingMask.value = false
    }
  }
}

// 游客浏览处理
const handleGuestBrowse = () => {
  uni.showModal({
    title: '游客模式',
    content: '游客模式下部分功能受限，建议登录后使用完整功能。确定以游客身份浏览吗？',
    confirmText: '确定浏览',
    cancelText: '返回登录',
    success: (res) => {
      if (res.confirm) {
        // 跳转到首页
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }
    }
  })
}

// 登录后跳转处理
const navigateAfterLogin = async () => {
  console.log('登录成功，处理跳转逻辑')
  
  // 延迟跳转，让用户看到成功状态
  setTimeout(() => {
    NavigationGuard.handleLoginSuccess()
  }, 1000)
}

// 登录错误处理
const handleLoginError = (error) => {
  let title = '登录失败'
  let content = error.message || '登录过程中发生未知错误，请稍后重试'
  
  // 根据错误类型显示不同提示
  if (error.message && error.message.includes('取消')) {
    title = '登录取消'
    content = '您取消了微信授权。您可以选择游客浏览，或稍后重新登录获取完整功能。'
  } else if (error.message && error.message.includes('网络')) {
    title = '网络错误'
    content = '网络连接异常，请检查网络设置后重试。'
  } else if (error.message && error.message.includes('服务器')) {
    title = '服务异常'
    content = '服务器暂时无法响应，请稍后重试。'
  }
  
  uni.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '知道了'
  })
}

// 显示用户协议
const showUserAgreement = () => {
  uni.showModal({
    title: '用户协议',
    content: '这里应该显示完整的用户协议内容...',
    showCancel: false,
    confirmText: '知道了'
  })
}

// 显示隐私政策
const showPrivacyPolicy = () => {
  uni.showModal({
    title: '隐私政策',
    content: '这里应该显示完整的隐私政策内容...',
    showCancel: false,
    confirmText: '知道了'
  })
}

// 检查登录状态
const checkAuthState = () => {
  if (authStore.isAuthenticated) {
    console.log('用户已登录，跳转至首页')
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }
}

onMounted(() => {
  // 检查是否已经登录
  checkAuthState()
  
  // 获取应用版本信息
  // #ifdef APP-PLUS
  plus.runtime.getProperty(plus.runtime.appid, (widgetInfo) => {
    appVersion.value = widgetInfo.version
  })
  // #endif
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx 40rpx;
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
    
    &.circle-1 {
      width: 200rpx;
      height: 200rpx;
      top: 10%;
      right: -50rpx;
      animation-delay: 0s;
    }
    
    &.circle-2 {
      width: 150rpx;
      height: 150rpx;
      bottom: 20%;
      left: -30rpx;
      animation-delay: -2s;
    }
    
    &.circle-3 {
      width: 100rpx;
      height: 100rpx;
      top: 50%;
      left: 20rpx;
      animation-delay: -4s;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0rpx) rotate(0deg);
  }
  50% {
    transform: translateY(-30rpx) rotate(180deg);
  }
}

.header-section {
  text-align: center;
  margin-bottom: 80rpx;
  z-index: 1;
  
  .app-logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 30rpx;
    border-radius: 24rpx;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .app-title {
    display: block;
    font-size: 40rpx;
    font-weight: 600;
    color: white;
    margin-bottom: 15rpx;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  }
  
  .app-subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
  }
}

.features-section {
  width: 100%;
  max-width: 600rpx;
  margin-bottom: 60rpx;
  z-index: 1;
  
  .feature-item {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10rpx);
    padding: 30rpx;
    margin-bottom: 20rpx;
    border-radius: 20rpx;
    
    .feature-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 30rpx;
      flex-shrink: 0;
    }
    
    .feature-content {
      flex: 1;
      
      .feature-title {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: white;
        margin-bottom: 8rpx;
      }
      
      .feature-desc {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
      }
    }
  }
}

.login-prompt {
  text-align: center;
  margin-bottom: 50rpx;
  z-index: 1;
  
  .prompt-text {
    font-size: 30rpx;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.5;
  }
}

.login-actions {
  width: 100%;
  max-width: 500rpx;
  margin-bottom: 40rpx;
  z-index: 1;
  
  .wechat-login-btn {
    width: 100%;
    height: 88rpx;
    background: #07c160;
    color: white;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
    transition: all 0.3s ease;
    
    &.loading {
      background: #a0a0a0;
      box-shadow: none;
    }
    
    &:not(.loading):active {
      transform: translateY(2rpx);
      box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.4);
    }
    
    .btn-text {
      font-size: 32rpx;
    }
  }
  
  .guest-browse-btn {
    width: 100%;
    height: 80rpx;
    background: transparent;
    color: white;
    border: 2rpx solid rgba(255, 255, 255, 0.3);
    border-radius: 40rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:active {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.login-notice {
  text-align: center;
  margin-bottom: 40rpx;
  z-index: 1;
  
  .notice-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.5;
  }
}

.agreement-section {
  text-align: center;
  margin-bottom: 30rpx;
  z-index: 1;
  
  .agreement-text {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    
    .link-text {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: underline;
    }
  }
}

.version-info {
  text-align: center;
  z-index: 1;
  
  .version-text {
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.5);
  }
}

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  
  .loading-content {
    background: white;
    padding: 60rpx;
    border-radius: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .loading-text {
      font-size: 28rpx;
      color: #333;
      margin-top: 30rpx;
    }
  }
}
</style>
