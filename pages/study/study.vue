<template>
  <view class="study-container">
    <!-- 顶部进度卡片 -->
    <view class="progress-card">
      <view class="progress-header">
        <text class="progress-title">学习进度</text>
        <text class="progress-percent">68%</text>
      </view>
      <uni-progress :percent="68" color="#007AFF" stroke-width="8" />
      <view class="progress-info">
        <text class="progress-text">已学习 34/50 个知识点</text>
      </view>
    </view>

    <!-- 学习模块 -->
    <view class="study-modules">
      <uni-section title="学习模块" type="line" padding>
        <view class="module-grid">
          <view class="module-item" v-for="(module, index) in studyModules" :key="index" @click="enterModule(module)">
            <view class="module-icon" :style="{backgroundColor: module.color}">
              <uni-icons :type="module.icon" size="24" color="#fff" />
            </view>
            <text class="module-name">{{ module.name }}</text>
            <text class="module-progress">{{ module.progress }}%</text>
            <uni-progress :percent="module.progress" :color="module.color" stroke-width="4" />
          </view>
        </view>
      </uni-section>
    </view>

    <!-- 最近学习 -->
    <view class="recent-study">
      <uni-section title="最近学习" type="line" padding>
        <uni-list>
          <uni-list-item 
            v-for="(item, index) in recentStudy" 
            :key="index"
            :title="item.title"
            :note="item.description"
            :rightText="item.date"
            clickable
            @click="continueStudy(item)"
          >
            <template v-slot:header>
              <view class="recent-icon">
                <uni-icons type="book" size="20" color="#007AFF" />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
      </uni-section>
    </view>

    <!-- 自定义底部导航栏 -->
    <CustomTabBar :current="1" @change="onTabChange" />
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import CustomTabBar from "@/components/CustomTabBar.vue"

// 学习模块数据
const studyModules = reactive([
  { name: '项目管理基础', icon: 'home', color: '#007AFF', progress: 85 },
  { name: '项目整合管理', icon: 'gear', color: '#28a745', progress: 72 },
  { name: '项目范围管理', icon: 'list', color: '#ffc107', progress: 45 },
  { name: '项目进度管理', icon: 'calendar', color: '#dc3545', progress: 30 },
  { name: '项目成本管理', icon: 'wallet', color: '#6610f2', progress: 15 },
  { name: '项目质量管理', icon: 'checkmarkempty', color: '#fd7e14', progress: 0 }
])

// 最近学习数据
const recentStudy = reactive([
  {
    title: '项目章程制定',
    description: '学习如何制定项目章程，明确项目目标...',
    date: '今天'
  },
  {
    title: '工作分解结构',
    description: 'WBS的创建方法和实践技巧...',
    date: '昨天'
  },
  {
    title: '风险识别技术',
    description: '项目风险识别的常用方法和工具...',
    date: '2天前'
  }
])

// 进入学习模块
const enterModule = (module) => {
  uni.showToast({
    title: `进入${module.name}`,
    icon: 'none'
  })
  // 这里后续可以跳转到具体的学习内容页面
}

// 继续学习
const continueStudy = (item) => {
  uni.showToast({
    title: `继续学习：${item.title}`,
    icon: 'none'
  })
  // 这里后续可以跳转到具体的学习内容页面
}

// 底部导航切换
const onTabChange = (index) => {
  console.log('切换到tab:', index)
}
</script>

<style lang="scss" scoped>
.study-container {
  padding: 0 0 120rpx 0; /* 底部留出导航栏空间 */
  background-color: #f8f9fa;
  min-height: 100vh;
}

.progress-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 20rpx;
  padding: 40rpx;
  border-radius: 20rpx;
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(102, 126, 234, 0.3);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.progress-title {
  font-size: 32rpx;
  font-weight: 600;
}

.progress-percent {
  font-size: 48rpx;
  font-weight: bold;
}

.progress-info {
  margin-top: 20rpx;
}

.progress-text {
  font-size: 28rpx;
  opacity: 0.9;
}

.study-modules {
  margin: 20rpx;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx 0;
}

.module-item {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.module-item:active {
  transform: scale(0.95);
}

.module-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
}

.module-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 10rpx;
}

.module-progress {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.recent-study {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.recent-icon {
  width: 60rpx;
  height: 60rpx;
  background: #f0f7ff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}
</style> 