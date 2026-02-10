<template>
  <view class="profile-container">
    <!-- 认证保护：未登录时显示登录引导 -->
    <AuthGuard 
      v-if="!authStore.isAuthenticated"
      title="个人中心"
      message="登录后可查看学习统计、管理个人资料和使用完整功能"
      :show-preview="true"
      current-path="/pages/profile/profile"
    >
      <template #preview>
        <view class="preview-item">
          <uni-icons type="checkmarkempty" size="16" color="#28a745" />
          <text>学习进度统计</text>
        </view>
        <view class="preview-item">
          <uni-icons type="checkmarkempty" size="16" color="#28a745" />
          <text>个人资料管理</text>
        </view>
        <view class="preview-item">
          <uni-icons type="checkmarkempty" size="16" color="#28a745" />
          <text>学习计划制定</text>
        </view>
      </template>
    </AuthGuard>

    <!-- 已登录内容 -->
    <template v-else>
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <image 
          :src="authStore.userAvatar" 
          mode="aspectFill" 
          @error="onAvatarError" 
        />
      </view>
      <view class="user-info">
        <text class="user-name">{{ authStore.userNickname }}</text>
        <text class="user-desc">
          {{ authStore.isAuthenticated ? 
            `${authStore.userRoleText} · 正在备考高级信息系统项目管理师` : 
            '请登录后查看完整功能' 
          }}
        </text>
      </view>
      <view class="edit-btn" @click="editProfile">
        <uni-icons type="compose" size="18" color="#007AFF" />
      </view>
    </view>

    <!-- 学习统计 -->
    <view class="study-stats">
      <uni-section title="学习统计" type="line" padding>
        <view class="stats-grid">
          <view class="stats-item" v-for="(stat, index) in studyStats" :key="index">
            <text class="stats-number" :style="{color: stat.color}">{{ stat.value }}</text>
            <text class="stats-label">{{ stat.label }}</text>
          </view>
        </view>
      </uni-section>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <uni-section title="功能菜单" type="line" padding>
        <uni-list>
          <uni-list-item 
            v-for="(menu, index) in menuItems" 
            :key="index"
            :title="menu.title"
            :rightText="menu.rightText"
            clickable
            @click="handleMenuClick(menu)"
          >
            <template v-slot:header>
              <view class="menu-icon" :style="{backgroundColor: menu.color}">
                <uni-icons :type="menu.icon" size="20" color="#fff" />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
      </uni-section>
    </view>

    <!-- 设置选项 -->
    <view class="settings-section">
      <uni-section title="设置" type="line" padding>
        <uni-list>
          <uni-list-item 
            v-for="(setting, index) in settingItems" 
            :key="index"
            :title="setting.title"
            :note="setting.note"
            clickable
            @click="handleSettingClick(setting)"
          >
            <template v-slot:header>
              <view class="setting-icon">
                <uni-icons :type="setting.icon" size="20" color="#666" />
              </view>
            </template>
            <template v-slot:footer>
              <uni-icons type="arrowright" size="16" color="#ccc" />
            </template>
          </uni-list-item>
        </uni-list>
      </uni-section>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-section">
      <button 
        class="logout-btn" 
        :class="{ 'login-btn': !authStore.isAuthenticated }"
        @click="handleLogout"
      >
        {{ authStore.isAuthenticated ? '退出登录' : '立即登录' }}
      </button>
    </view>

    <!-- 自定义底部导航栏 -->
    <CustomTabBar :current="3" @change="onTabChange" />
    </template>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { PermissionChecker } from '@/utils/auth.js'
import CustomTabBar from "@/components/CustomTabBar.vue"
import AuthGuard from "@/components/AuthGuard.vue"

// 认证store
const authStore = useAuthStore()

// 学习统计数据
const studyStats = reactive([
  { label: '学习天数', value: '45', color: '#007AFF' },
  { label: '完成章节', value: '18', color: '#28a745' },
  { label: '练习题数', value: '523', color: '#ffc107' },
  { label: '正确率', value: '87%', color: '#dc3545' }
])

// 功能菜单
const menuItems = reactive([
  {
    title: '学习计划',
    icon: 'calendar',
    color: '#007AFF',
    rightText: '',
    action: 'studyPlan'
  },
  {
    title: '学习笔记',
    icon: 'compose',
    color: '#28a745',
    rightText: '12篇',
    action: 'studyNotes'
  },
  {
    title: '收藏夹',
    icon: 'star',
    color: '#ffc107',
    rightText: '8个',
    action: 'favorites'
  },
  {
    title: '学习报告',
    icon: 'bars',
    color: '#6f42c1',
    rightText: '',
    action: 'studyReport'
  },
  {
    title: '文件管理',
    icon: 'cloud-upload',
    color: '#17a2b8',
    rightText: '',
    action: 'fileManagement'
  }
])

// 设置选项
const settingItems = reactive([
  {
    title: '消息通知',
    note: '管理推送通知设置',
    icon: 'sound',
    action: 'notification'
  },
  {
    title: '学习提醒',
    note: '设置每日学习提醒时间',
    icon: 'calendar',
    action: 'reminder'
  },
  {
    title: '清除缓存',
    note: '清理应用缓存数据',
    icon: 'trash',
    action: 'clearCache'
  },
  {
    title: '意见反馈',
    note: '向我们反馈问题和建议',
    icon: 'chatboxes',
    action: 'feedback'
  },
  {
    title: '关于我们',
    note: '应用版本信息',
    icon: 'info',
    action: 'about'
  }
])

// 头像加载失败处理
const onAvatarError = () => {
  // 可以设置默认头像
  console.log('头像加载失败')
}

// 编辑个人资料
const editProfile = () => {
  uni.showToast({
    title: '编辑个人资料',
    icon: 'none'
  })
}

// 处理菜单点击
const handleMenuClick = (menu) => {
  switch (menu.action) {
    case 'studyPlan':
      uni.showToast({ title: '学习计划', icon: 'none' })
      break
    case 'studyNotes':
      uni.showToast({ title: '学习笔记', icon: 'none' })
      break
    case 'favorites':
      uni.showToast({ title: '收藏夹', icon: 'none' })
      break
    case 'studyReport':
      uni.showToast({ title: '学习报告', icon: 'none' })
      break
    case 'fileManagement':
      uni.navigateTo({ url: '/pkg-tools/pages/upload/upload' })
      break
    default:
      break
  }
}

// 处理设置点击
const handleSettingClick = (setting) => {
  switch (setting.action) {
    case 'notification':
      uni.showToast({ title: '消息通知设置', icon: 'none' })
      break
    case 'reminder':
      uni.showToast({ title: '学习提醒设置', icon: 'none' })
      break
    case 'clearCache':
      handleClearCache()
      break
    case 'feedback':
      uni.showToast({ title: '意见反馈', icon: 'none' })
      break
    case 'about':
      uni.showToast({ title: '关于我们', icon: 'none' })
      break
    default:
      break
  }
}

// 清除缓存
const handleClearCache = () => {
  uni.showModal({
    title: '确认清除',
    content: '确定要清除应用缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '缓存清除成功',
          icon: 'success'
        })
      }
    }
  })
}

// 退出登录
const handleLogout = () => {
  if (!authStore.isAuthenticated) {
    // 未登录状态，跳转到登录页
    uni.navigateTo({
      url: '/pages/login/login'
    })
    return
  }
  
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？退出后部分功能将无法使用。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await authStore.logout()
        } catch (error) {
          console.error('退出登录失败:', error)
          uni.showToast({
            title: '退出失败，请重试',
            icon: 'error'
          })
        }
      }
    }
  })
}

// 底部导航切换
const onTabChange = (index) => {
  console.log('切换到tab:', index)
}
</script>

<style lang="scss" scoped>
.profile-container {
  padding: 0 0 120rpx 0; /* 底部留出导航栏空间 */
  background-color: #f8f9fa;
  min-height: 100vh;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 20rpx;
  padding: 40rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  overflow: hidden;
  margin-right: 30rpx;
  background-color: rgba(255, 255, 255, 0.2);
}

.user-avatar image {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.user-desc {
  font-size: 26rpx;
  opacity: 0.8;
}

.edit-btn {
  padding: 20rpx;
}

.study-stats {
  margin: 20rpx;
}

.stats-grid {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.stats-item {
  text-align: center;
}

.stats-number {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.stats-label {
  font-size: 26rpx;
  color: #666;
}

.menu-section,
.settings-section {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.menu-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.setting-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.logout-section {
  margin: 40rpx 20rpx 20rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.logout-btn:active {
  background-color: #c82333;
}

.login-btn {
  background-color: #007AFF !important;
  
  &:active {
    background-color: #0056CC !important;
  }
}

// AuthGuard预览项目样式
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
</style> 