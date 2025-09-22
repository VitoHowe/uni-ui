<template>
  <view class="question-container">
    <!-- 学习统计卡片 -->
    <view class="stats-card">
      <view class="stats-header">
        <text class="stats-title">练习统计</text>
        <text class="stats-date">本周</text>
      </view>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-number">156</text>
          <text class="stat-label">已练习</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">89%</text>
          <text class="stat-label">正确率</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">23</text>
          <text class="stat-label">错题数</text>
        </view>
      </view>
    </view>

    <!-- 练习模式 -->
    <view class="practice-modes">
      <uni-section title="练习模式" type="line" padding>
        <view class="mode-list">
          <view 
            class="mode-item" 
            v-for="(mode, index) in practiceModess" 
            :key="index"
            @click="startPractice(mode)"
          >
            <view class="mode-left">
              <view class="mode-icon" :style="{backgroundColor: mode.color}">
                <uni-icons :type="mode.icon" size="22" color="#fff" />
              </view>
              <view class="mode-info">
                <text class="mode-name">{{ mode.name }}</text>
                <text class="mode-desc">{{ mode.description }}</text>
              </view>
            </view>
            <view class="mode-right">
              <view class="mode-count">{{ mode.count }}题</view>
              <uni-icons type="arrowright" size="16" color="#ccc" />
            </view>
          </view>
        </view>
      </uni-section>
    </view>

    <!-- 错题本 -->
    <view class="wrong-questions">
      <uni-section title="错题本" type="line" padding>
        <view class="wrong-header">
          <text class="wrong-count">共 {{ wrongQuestions.length }} 道错题</text>
          <text class="clear-btn" @click="clearWrongQuestions">清空</text>
        </view>
        <uni-list v-if="wrongQuestions.length > 0">
          <uni-list-item 
            v-for="(question, index) in wrongQuestions" 
            :key="index"
            :title="question.title"
            :note="question.type"
            :rightText="question.date"
            clickable
            @click="reviewQuestion(question)"
          >
            <template v-slot:header>
              <view class="question-icon">
                <uni-icons type="closeempty" size="18" color="#dc3545" />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
        <view v-else class="empty-state">
          <uni-icons type="checkmarkempty" size="48" color="#28a745" />
          <text class="empty-text">太棒了！暂无错题</text>
        </view>
      </uni-section>
    </view>

    <!-- 浮动按钮：开始答题 -->
    <uni-fab 
      :pattern="fabPattern" 
      :content="fabContent"
      direction="vertical"
      @trigger="fabClick"
    />

    <!-- 自定义底部导航栏 -->
    <CustomTabBar :current="2" @change="onTabChange" />
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import CustomTabBar from "@/components/CustomTabBar.vue"

// 练习模式数据
const practiceModess = reactive([
  {
    name: '真题练习',
    description: '历年考试真题，贴近实际考试',
    icon: 'fire',
    color: '#dc3545',
    count: 1200
  },
  {
    name: '模拟考试',
    description: '完整模拟考试，检验学习成果',
    icon: 'calendar',
    color: '#007AFF',
    count: 150
  },
  {
    name: '专项训练',
    description: '针对性练习，突破薄弱环节',
    icon: 'gear',
    color: '#28a745',
    count: 800
  },
  {
    name: '随机练习',
    description: '随机抽取题目，全面复习',
    icon: 'loop',
    color: '#ffc107',
    count: 500
  }
])

// 错题数据
const wrongQuestions = reactive([
  {
    title: '关于项目章程的描述，以下哪项是错误的？',
    type: '单选题',
    date: '2天前'
  },
  {
    title: '项目范围说明书不包括以下哪项内容？',
    type: '单选题',
    date: '3天前'
  },
  {
    title: '在进行风险定性分析时，主要考虑的因素包括...',
    type: '多选题',
    date: '5天前'
  }
])

// 浮动按钮配置
const fabPattern = reactive({
  color: '#007AFF',
  backgroundColor: '#fff',
  selectedColor: '#007AFF'
})

const fabContent = reactive([
  {
    iconPath: '/static/c1.png',
    selectedIconPath: '/static/c1.png',
    text: '快速练习',
    active: false
  }
])

// 开始练习
const startPractice = (mode) => {
  uni.showToast({
    title: `开始${mode.name}`,
    icon: 'none'
  })
  // 这里后续跳转到答题页面
}

// 复习错题
const reviewQuestion = (question) => {
  uni.showToast({
    title: '查看错题详情',
    icon: 'none'
  })
  // 这里后续跳转到错题详情页面
}

// 清空错题
const clearWrongQuestions = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有错题吗？',
    success: (res) => {
      if (res.confirm) {
        wrongQuestions.splice(0)
        uni.showToast({
          title: '已清空错题本',
          icon: 'success'
        })
      }
    }
  })
}

// 浮动按钮点击
const fabClick = (e) => {
  // 开始快速练习
  uni.showToast({
    title: '开始快速练习',
    icon: 'none'
  })
}

// 底部导航切换
const onTabChange = (index) => {
  console.log('切换到tab:', index)
}
</script>

<style lang="scss" scoped>
.question-container {
  padding: 0 0 120rpx 0; /* 底部留出导航栏空间 */
  background-color: #f8f9fa;
  min-height: 100vh;
}

.stats-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  margin: 20rpx;
  padding: 40rpx;
  border-radius: 20rpx;
  color: white;
  box-shadow: 0 8rpx 32rpx rgba(79, 172, 254, 0.3);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.stats-title {
  font-size: 32rpx;
  font-weight: 600;
}

.stats-date {
  font-size: 26rpx;
  opacity: 0.8;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.9;
}

.practice-modes {
  margin: 20rpx;
}

.mode-list {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.mode-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.mode-item:last-child {
  border-bottom: none;
}

.mode-item:active {
  background-color: #f8f9fa;
}

.mode-left {
  display: flex;
  align-items: center;
}

.mode-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.mode-info {
  display: flex;
  flex-direction: column;
}

.mode-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.mode-desc {
  font-size: 24rpx;
  color: #666;
}

.mode-right {
  display: flex;
  align-items: center;
}

.mode-count {
  font-size: 24rpx;
  color: #999;
  margin-right: 10rpx;
}

.wrong-questions {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.wrong-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.wrong-count {
  font-size: 28rpx;
  color: #333;
}

.clear-btn {
  font-size: 26rpx;
  color: #007AFF;
}

.question-icon {
  width: 60rpx;
  height: 60rpx;
  background: #fff5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.empty-state {
  padding: 60rpx;
  text-align: center;
}

.empty-text {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #666;
}
</style> 