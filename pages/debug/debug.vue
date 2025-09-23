<template>
  <view class="debug-container">
    <!-- 页面标题 -->
    <view class="debug-header">
      <text class="header-title">🧪 认证系统调试</text>
      <text class="header-desc">用于测试和验证微信登录系统功能</text>
    </view>
    
    <!-- 当前状态显示 -->
    <view class="status-section">
      <uni-section title="当前状态" type="line" padding>
        <view class="status-grid">
          <view class="status-item">
            <text class="status-label">登录状态</text>
            <text class="status-value" :style="{color: authStore.isAuthenticated ? '#28a745' : '#dc3545'}">
              {{ authStore.loginStatusText }}
            </text>
          </view>
          
          <view class="status-item">
            <text class="status-label">用户昵称</text>
            <text class="status-value">{{ authStore.userNickname }}</text>
          </view>
          
          <view class="status-item">
            <text class="status-label">用户角色</text>
            <text class="status-value">{{ authStore.userRoleText }}</text>
          </view>
          
          <view class="status-item">
            <text class="status-label">Token状态</text>
            <text class="status-value" :style="{color: authStore.tokenInfo.hasToken ? '#28a745' : '#dc3545'}">
              {{ authStore.tokenInfo.hasToken ? '有效' : '无效' }}
            </text>
          </view>
        </view>
      </uni-section>
    </view>
    
    <!-- 测试功能 -->
    <view class="test-section">
      <uni-section title="测试功能" type="line" padding>
        <view class="test-buttons">
          <button class="test-btn" @click="runFullTest">
            <uni-icons type="gear" size="16" color="#007AFF" />
            <text>运行完整测试</text>
          </button>
          
          <button class="test-btn" @click="simulateLogin">
            <uni-icons type="person" size="16" color="#28a745" />
            <text>模拟登录</text>
          </button>
          
          <button class="test-btn" @click="testTokenRefresh">
            <uni-icons type="refresh" size="16" color="#ffc107" />
            <text>测试Token刷新</text>
          </button>
          
          <button class="test-btn" @click="testNetworkRequest">
            <uni-icons type="cloud-upload" size="16" color="#17a2b8" />
            <text>测试网络请求</text>
          </button>
          
          <button class="test-btn" @click="testPermissions">
            <uni-icons type="locked" size="16" color="#6f42c1" />
            <text>测试权限检查</text>
          </button>
          
          <button class="test-btn" @click="testWechatCodeManager">
            <uni-icons type="weixin" size="16" color="#07c160" />
            <text>测试Code管理</text>
          </button>
          
          <button class="test-btn" @click="testLoginRetry">
            <uni-icons type="loop" size="16" color="#ff6b6b" />
            <text>测试登录重试</text>
          </button>
          
          <button class="test-btn danger" @click="clearTestData">
            <uni-icons type="trash" size="16" color="#dc3545" />
            <text>清空测试数据</text>
          </button>
        </view>
      </uni-section>
    </view>
    
    <!-- 调试信息 -->
    <view class="debug-info">
      <uni-section title="调试信息" type="line" padding>
        <view class="info-content">
          <text class="info-text">API基础URL: {{ apiBaseUrl }}</text>
          <text class="info-text">当前页面: {{ currentPagePath }}</text>
          <text class="info-text">系统版本: {{ systemInfo.platform }}</text>
          <text class="info-text">小程序版本: {{ systemInfo.version }}</text>
        </view>
      </uni-section>
    </view>
    
    <!-- 日志显示 -->
    <view class="log-section" v-if="logs.length > 0">
      <uni-section title="测试日志" type="line" padding>
        <view class="log-content">
          <scroll-view scroll-y="true" class="log-scroll">
            <view v-for="(log, index) in logs" :key="index" class="log-item">
              <text class="log-time">{{ log.time }}</text>
              <text class="log-message" :class="log.type">{{ log.message }}</text>
            </view>
          </scroll-view>
          <button class="clear-log-btn" @click="clearLogs">清空日志</button>
        </view>
      </uni-section>
    </view>
    
    <!-- 返回按钮 -->
    <view class="back-section">
      <button class="back-btn" @click="goBack">
        <uni-icons type="back" size="16" color="#666" />
        <text>返回首页</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import AuthTestHelper from '@/utils/testHelpers.js'
import { API_CONFIG } from '@/utils/constants.js'
import { PermissionChecker } from '@/utils/auth.js'
import { request } from '@/utils/request.js'

// 状态管理
const authStore = useAuthStore()

// 响应式数据
const logs = ref([])
const systemInfo = reactive({
  platform: '',
  version: ''
})

// 计算属性
const apiBaseUrl = computed(() => API_CONFIG.BASE_URL)
const currentPagePath = computed(() => {
  const pages = getCurrentPages()
  return pages.length > 0 ? `/${pages[pages.length - 1].route}` : '未知'
})

// 添加日志
const addLog = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.unshift({
    time,
    message,
    type
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value.pop()
  }
}

// 运行完整测试
const runFullTest = async () => {
  addLog('开始运行完整测试套件...', 'info')
  
  try {
    await AuthTestHelper.runFullTest()
    addLog('完整测试套件执行完成', 'success')
  } catch (error) {
    addLog(`完整测试失败: ${error.message}`, 'error')
  }
}

// 模拟登录
const simulateLogin = async () => {
  addLog('开始模拟登录测试...', 'info')
  
  try {
    const success = await AuthTestHelper.simulateLogin()
    if (success) {
      addLog('模拟登录成功', 'success')
    } else {
      addLog('模拟登录失败', 'error')
    }
  } catch (error) {
    addLog(`模拟登录异常: ${error.message}`, 'error')
  }
}

// 测试Token刷新
const testTokenRefresh = async () => {
  addLog('开始测试Token刷新机制...', 'info')
  
  try {
    if (!authStore.isAuthenticated) {
      addLog('请先登录后再测试Token刷新', 'warning')
      return
    }
    
    await authStore.refreshToken()
    addLog('Token刷新成功', 'success')
  } catch (error) {
    addLog(`Token刷新失败: ${error.message}`, 'error')
  }
}

// 测试网络请求
const testNetworkRequest = async () => {
  addLog('开始测试网络请求功能...', 'info')
  
  try {
    // 测试无需认证的请求构建
    const testUrl = request.buildFullUrl('/test')
    addLog(`URL构建测试: ${testUrl}`, 'info')
    
    // 测试请求头构建
    const headers = await request.buildHeaders({}, false)
    addLog(`请求头构建测试通过`, 'success')
    
    addLog('网络请求功能测试完成', 'success')
  } catch (error) {
    addLog(`网络请求测试失败: ${error.message}`, 'error')
  }
}

// 测试权限检查
const testPermissions = () => {
  addLog('开始测试权限检查功能...', 'info')
  
  try {
    // 测试文件上传权限
    const uploadPermission = PermissionChecker.checkFeatureAvailable('file_upload')
    addLog(`文件上传权限: ${uploadPermission.available ? '允许' : '拒绝'} - ${uploadPermission.message}`, 
           uploadPermission.available ? 'success' : 'warning')
    
    // 测试个人资料权限
    const profilePermission = PermissionChecker.checkFeatureAvailable('profile_management')
    addLog(`个人资料权限: ${profilePermission.available ? '允许' : '拒绝'} - ${profilePermission.message}`, 
           profilePermission.available ? 'success' : 'warning')
    
    // 测试管理员功能权限
    const adminPermission = PermissionChecker.checkFeatureAvailable('admin_functions')
    addLog(`管理员功能权限: ${adminPermission.available ? '允许' : '拒绝'} - ${adminPermission.message}`, 
           adminPermission.available ? 'success' : 'warning')
    
    addLog('权限检查功能测试完成', 'success')
  } catch (error) {
    addLog(`权限检查测试失败: ${error.message}`, 'error')
  }
}

// 测试微信Code管理
const testWechatCodeManager = async () => {
  addLog('开始测试微信Code管理机制...', 'info')
  
  try {
    const success = await AuthTestHelper.testWechatCodeManager()
    if (success) {
      addLog('微信Code管理机制测试通过', 'success')
    } else {
      addLog('微信Code管理机制测试失败', 'error')
    }
  } catch (error) {
    addLog(`微信Code管理测试异常: ${error.message}`, 'error')
  }
}

// 测试登录重试机制
const testLoginRetry = async () => {
  addLog('开始测试登录重试机制...', 'info')
  
  try {
    const success = await AuthTestHelper.testLoginRetryMechanism()
    if (success) {
      addLog('登录重试机制测试通过', 'success')
    } else {
      addLog('登录重试机制测试失败', 'error')
    }
  } catch (error) {
    addLog(`登录重试测试异常: ${error.message}`, 'error')
  }
}

// 清空测试数据
const clearTestData = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有测试数据吗？这将清除登录状态和用户信息。',
    success: (res) => {
      if (res.confirm) {
        AuthTestHelper.clearTestData()
        addLog('测试数据已清空', 'info')
      }
    }
  })
}

// 清空日志
const clearLogs = () => {
  logs.value = []
  uni.showToast({
    title: '日志已清空',
    icon: 'success'
  })
}

// 返回首页
const goBack = () => {
  uni.reLaunch({
    url: '/pages/index/index'
  })
}

// 获取系统信息
const getSystemInfo = () => {
  uni.getSystemInfo({
    success: (res) => {
      systemInfo.platform = res.platform || '未知'
      systemInfo.version = res.version || '未知'
    }
  })
}

onMounted(() => {
  addLog('认证系统调试页面加载完成', 'info')
  getSystemInfo()
})
</script>

<style lang="scss" scoped>
.debug-container {
  padding: 20rpx;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.debug-header {
  text-align: center;
  margin-bottom: 30rpx;
  padding: 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20rpx;
  color: white;
  
  .header-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    margin-bottom: 15rpx;
  }
  
  .header-desc {
    font-size: 26rpx;
    opacity: 0.9;
  }
}

.status-section,
.test-section,
.debug-info,
.log-section {
  margin-bottom: 30rpx;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.status-item {
  text-align: center;
  
  .status-label {
    display: block;
    font-size: 24rpx;
    color: #666;
    margin-bottom: 10rpx;
  }
  
  .status-value {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
  }
}

.test-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  
  // 响应式调整 - 当按钮较多时使用单列布局
  @media screen and (max-width: 750rpx) {
    grid-template-columns: 1fr;
  }
}

.test-btn {
  height: 80rpx;
  background: #f8f9fa;
  color: #333;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  transition: all 0.3s ease;
  
  &:active {
    background: #e9ecef;
    transform: scale(0.95);
  }
  
  &.danger {
    border-color: #dc3545;
    color: #dc3545;
    
    &:active {
      background: #f5c6cb;
    }
  }
}

.info-content {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  
  .info-text {
    display: block;
    font-size: 26rpx;
    color: #666;
    margin-bottom: 15rpx;
    line-height: 1.5;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.log-content {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.log-scroll {
  height: 400rpx;
  padding: 20rpx;
}

.log-item {
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
  
  .log-time {
    display: block;
    font-size: 22rpx;
    color: #999;
    margin-bottom: 8rpx;
  }
  
  .log-message {
    display: block;
    font-size: 26rpx;
    line-height: 1.4;
    
    &.info {
      color: #333;
    }
    
    &.success {
      color: #28a745;
    }
    
    &.warning {
      color: #ffc107;
    }
    
    &.error {
      color: #dc3545;
    }
  }
}

.clear-log-btn {
  width: 100%;
  height: 60rpx;
  background: #f8f9fa;
  color: #666;
  border: none;
  border-top: 1rpx solid #e0e0e0;
  font-size: 24rpx;
  
  &:active {
    background: #e9ecef;
  }
}

.back-section {
  text-align: center;
  margin-top: 50rpx;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  height: 70rpx;
  padding: 0 40rpx;
  background: white;
  color: #666;
  border: 2rpx solid #e0e0e0;
  border-radius: 35rpx;
  font-size: 28rpx;
  
  &:active {
    background: #f5f5f5;
  }
}
</style>
