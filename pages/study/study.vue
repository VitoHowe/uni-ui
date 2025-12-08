<template>
  <view class="study-container">
    <view class="progress-card">
      <view class="progress-header">
        <text class="progress-title">学习进度</text>
        <text class="progress-percent">68%</text>
      </view>
      <uni-progress :percent="68" color="#007AFF" stroke-width="8" />
      <view class="progress-info">
        <text class="progress-text">已完成 34/50 个知识点</text>
      </view>
    </view>

    <view class="study-modules">
      <uni-section title="学习模块" type="line" padding>
        <view class="module-grid">
          <view class="module-item" v-for="(module, index) in studyModules" :key="index" @click="enterModule(module)">
            <view class="module-icon" :style="{ backgroundColor: module.color }">
              <uni-icons :type="module.icon" size="24" color="#fff" />
            </view>
            <text class="module-name">{{ module.name }}</text>
            <text class="module-progress">{{ module.progress }}%</text>
            <uni-progress :percent="module.progress" :color="module.color" stroke-width="4" />
          </view>
        </view>
      </uni-section>
    </view>

    <view class="word-entry">
      <uni-section title="单词练习" type="line" padding>
        <view class="word-entry-card simple-card" @click="goToWordPractice">
          <view class="entry-left">
            <view class="entry-badge">热门</view>
            <text class="entry-title">进入单词练习</text>
            <text class="entry-desc">词书分类 · 进度同步 · 收藏与错题集中管理</text>
            <view class="entry-tags">
              <view class="tag">词书</view>
              <view class="tag">进度</view>
              <view class="tag">错题</view>
            </view>
          </view>
          <view class="entry-btn-ghost">
            <text>开始练习</text>
            <uni-icons type="arrowright" size="18" color="#0f62fe" />
          </view>
        </view>
      </uni-section>
    </view>

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

    <CustomTabBar :current="1" @change="onTabChange" />
  </view>
</template>

<script setup>
import { reactive } from 'vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const studyModules = reactive([
  { name: '项目管理基础', icon: 'home', color: '#007AFF', progress: 85 },
  { name: '项目综合管理', icon: 'gear', color: '#28a745', progress: 72 },
  { name: '项目范围管理', icon: 'list', color: '#ffc107', progress: 45 },
  { name: '项目进度管理', icon: 'calendar', color: '#dc3545', progress: 30 },
  { name: '项目成本管理', icon: 'wallet', color: '#6610f2', progress: 15 },
  { name: '项目质量管理', icon: 'checkmarkempty', color: '#fd7e14', progress: 0 }
])

const recentStudy = reactive([
  {
    title: '项目章程制定',
    description: '学习如何制定项目章程，明确项目目标',
    date: '今天'
  },
  {
    title: '工作分解结构',
    description: '掌握WBS的创建方法与实践经验',
    date: '昨天'
  },
  {
    title: '风险识别技巧',
    description: '项目风险识别的方法与工具',
    date: '2天前'
  }
])

const enterModule = (module) => {
  uni.showToast({
    title: `进入${module.name}`,
    icon: 'none'
  })
}

const goToWordPractice = () => {
  uni.navigateTo({
    url: '/pages/word-practice/word-practice'
  })
}

const continueStudy = (item) => {
  uni.showToast({
    title: `继续学习 ${item.title}`,
    icon: 'none'
  })
}

const onTabChange = (index) => {
  console.log('切换到tab:', index)
}
</script>

<style lang="scss" scoped>
.study-container {
  padding: 0 0 120rpx 0;
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

.word-entry {
  margin: 20rpx;
}

.word-entry-card {
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  padding: 28rpx 24rpx;
  color: #1f2937;
  min-height: 150rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2rpx solid #e5e7eb;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.04);
}

.simple-card {
  background: linear-gradient(135deg, #f3f7ff 0%, #e4edff 100%);
}

.entry-title {
  font-size: 36rpx;
  font-weight: 700;
}

.entry-desc {
  font-size: 26rpx;
  opacity: 0.9;
  margin-top: 6rpx;
}

.entry-left {
  flex: 1;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.entry-badge {
  align-self: flex-start;
  padding: 6rpx 14rpx;
  background: #0f62fe;
  color: #fff;
  border-radius: 999rpx;
  font-size: 22rpx;
}

.entry-tags {
  display: flex;
  gap: 10rpx;
  margin-top: 8rpx;
}

.tag {
  padding: 8rpx 14rpx;
  background: #e0e7ff;
  color: #374151;
  border-radius: 10rpx;
  font-size: 22rpx;
}

.entry-btn-ghost {
  padding: 16rpx 20rpx;
  background: #ffffff;
  color: #0f62fe;
  border-radius: 14rpx;
  border: 2rpx solid #0f62fe;
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 6rpx 16rpx rgba(15, 98, 254, 0.12);
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
