<template>
  <view class="home-container">
    <!-- 顶部问候和考试倒计时 -->
    <view class="header-section">
      <view class="greeting">
        <text class="greeting-text">早上好！</text>
        <text class="greeting-subtitle">今天也要坚持学习哦 💪</text>
      </view>
      <view class="exam-countdown">
        <view class="countdown-card">
          <text class="countdown-title">距离考试还有</text>
          <view class="countdown-time">
            <text class="countdown-number">{{ examCountdown.days }}</text>
            <text class="countdown-unit">天</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 学习进度概览 -->
    <view class="progress-overview">
      <uni-section title="学习进度" type="line" padding>
        <view class="progress-content">
          <view class="progress-circle">
            <uni-progress 
              :percent="overallProgress" 
              :show-info="true" 
              color="#007AFF" 
              stroke-width="8"
            />
            <text class="progress-label">总体进度</text>
          </view>
          <view class="progress-stats">
            <view class="stat-item" v-for="(stat, index) in progressStats" :key="index">
              <text class="stat-value">{{ stat.value }}</text>
              <text class="stat-label">{{ stat.label }}</text>
            </view>
          </view>
        </view>
      </uni-section>
    </view>

    <!-- 每日一题 -->
    <view class="daily-question">
      <uni-section title="每日一题" type="line" padding>
        <view class="question-card" @click="openDailyQuestion">
          <view class="question-header">
            <view class="question-type">单选题</view>
            <view class="question-points">5分</view>
          </view>
          <text class="question-content">{{ dailyQuestion.content }}</text>
          <view class="question-footer">
            <text class="question-tip">点击查看题目详情</text>
            <uni-icons type="arrowright" size="16" color="#007AFF" />
          </view>
        </view>
      </uni-section>
    </view>

    <!-- 快捷功能 -->
    <view class="quick-actions">
      <uni-section title="快捷功能" type="line" padding>
        <view class="actions-grid">
          <view 
            class="action-item" 
            v-for="(action, index) in quickActions" 
            :key="index"
            @click="handleActionClick(action)"
          >
            <view class="action-icon" :style="{backgroundColor: action.color}">
              <uni-icons :type="action.icon" size="24" color="#fff" />
            </view>
            <text class="action-name">{{ action.name }}</text>
          </view>
        </view>
      </uni-section>
    </view>

    <!-- 学习动态 -->
    <view class="study-updates">
      <uni-section title="学习动态" type="line" padding>
        <uni-list>
          <uni-list-item 
            v-for="(update, index) in studyUpdates" 
            :key="index"
            :title="update.title"
            :note="update.content"
            :rightText="update.time"
            clickable
            @click="viewUpdate(update)"
          >
            <template v-slot:header>
              <view class="update-icon" :style="{backgroundColor: update.color}">
                <uni-icons :type="update.icon" size="18" color="#fff" />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
      </uni-section>
    </view>

    <!-- 自定义底部导航栏 -->
    <CustomTabBar :current="0" @change="onTabChange" />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import CustomTabBar from "@/components/CustomTabBar.vue"

// 考试倒计时
const examCountdown = reactive({
  days: 0
})

const EXAM_MONTH = 5
const EXAM_DAY = 23
const MS_PER_DAY = 24 * 60 * 60 * 1000

let countdownTimer = 0

const calcDaysUntilExam = (now = new Date()) => {
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  let targetUtc = Date.UTC(now.getFullYear(), EXAM_MONTH - 1, EXAM_DAY)
  if (targetUtc < todayUtc) {
    targetUtc = Date.UTC(now.getFullYear() + 1, EXAM_MONTH - 1, EXAM_DAY)
  }
  return Math.max(0, Math.floor((targetUtc - todayUtc) / MS_PER_DAY))
}

const refreshExamCountdown = () => {
  examCountdown.days = calcDaysUntilExam()
}

const stopCountdownTimer = () => {
  if (countdownTimer) clearTimeout(countdownTimer)
  countdownTimer = 0
}

const scheduleNextDayRefresh = () => {
  stopCountdownTimer()

  const now = new Date()
  const nextLocalDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const delay = Math.max(1000, nextLocalDay.getTime() - now.getTime() + 1000)

  countdownTimer = setTimeout(() => {
    refreshExamCountdown()
    scheduleNextDayRefresh()
  }, delay)
}

// 总体学习进度
const overallProgress = ref(68)

// 进度统计
const progressStats = reactive([
  { label: '已学章节', value: '18/26' },
  { label: '练习题数', value: '523' },
  { label: '正确率', value: '87%' }
])

// 每日一题
const dailyQuestion = reactive({
  content: '项目章程的主要作用不包括以下哪一项？',
  type: '单选题',
  points: 5
})

// 快捷功能
const quickActions = reactive([
  { name: '继续学习', icon: 'book', color: '#007AFF', action: 'continue_study' },
  { name: '模拟考试', icon: 'calendar', color: '#28a745', action: 'mock_exam' },
  { name: '错题本', icon: 'closeempty', color: '#dc3545', action: 'wrong_questions' },
  { name: '学习笔记', icon: 'compose', color: '#ffc107', action: 'study_notes' },
  { name: '学习计划', icon: 'gear', color: '#6610f2', action: 'study_plan' },
  { name: '收藏夹', icon: 'star', color: '#fd7e14', action: 'favorites' }
])

// 学习动态
const studyUpdates = reactive([
  {
    title: '完成学习',
    content: '项目整合管理 - 制定项目章程',
    time: '2小时前',
    icon: 'checkmarkempty',
    color: '#28a745'
  },
  {
    title: '练习题目',
    content: '完成项目管理基础专项练习 20题',
    time: '昨天',
    icon: 'compose',
    color: '#007AFF'
  },
  {
    title: '学习提醒',
    content: '今日学习目标：完成项目范围管理章节',
    time: '今天',
    icon: 'sound',
    color: '#ffc107'
  }
])

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好！'
  if (hour < 18) return '下午好！'
  return '晚上好！'
}

// 打开每日一题
const openDailyQuestion = () => {
  uni.showToast({
    title: '打开每日一题',
    icon: 'none'
  })
  // 这里可以跳转到答题页面
}

// 处理快捷功能点击
const handleActionClick = (action) => {
  switch (action.action) {
    case 'continue_study':
      uni.navigateTo({ url: '/pages/study/study' })
      break
    case 'mock_exam':
      // 题库属于“Tab”级页面，直接 reLaunch 更符合预期（且对分包页面更稳定）
      uni.reLaunch({
        url: '/pkg-exam/pages/question/question',
        fail: (err) => {
          console.error('❌ 打开题库失败:', err)
          uni.showToast({ title: '打开题库失败', icon: 'none' })
        }
      })
      break
    case 'wrong_questions':
      uni.showToast({ title: '错题本', icon: 'none' })
      break
    case 'study_notes':
      uni.showToast({ title: '学习笔记', icon: 'none' })
      break
    case 'study_plan':
      uni.showToast({ title: '学习计划', icon: 'none' })
      break
    case 'favorites':
      uni.showToast({ title: '收藏夹', icon: 'none' })
      break
    default:
      break
  }
}

// 查看学习动态
const viewUpdate = (update) => {
  uni.showToast({
    title: `查看：${update.title}`,
    icon: 'none'
  })
}

// 底部导航切换
const onTabChange = (index) => {
  console.log('切换到tab:', index)
}

onMounted(() => {
  // 页面加载时可以获取最新的学习数据
  refreshExamCountdown()
  scheduleNextDayRefresh()
})

onShow(() => {
  refreshExamCountdown()
  scheduleNextDayRefresh()
})

onHide(() => {
  stopCountdownTimer()
})

onUnmounted(() => {
  stopCountdownTimer()
})
</script>

<style lang="scss" scoped>
.home-container {
  padding: 0 0 120rpx 0; /* 底部留出导航栏空间 */
  background-color: #f8f9fa;
  min-height: 100vh;
}

.header-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  color: white;
}

.greeting {
  margin-bottom: 30rpx;
}

.greeting-text {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.greeting-subtitle {
  font-size: 28rpx;
  opacity: 0.9;
}

.exam-countdown {
  display: flex;
  justify-content: center;
}

.countdown-card {
  background: rgba(255, 255, 255, 0.15);
  padding: 30rpx;
  border-radius: 16rpx;
  text-align: center;
  backdrop-filter: blur(10rpx);
}

.countdown-title {
  display: block;
  font-size: 26rpx;
  margin-bottom: 15rpx;
  opacity: 0.9;
}

.countdown-time {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.countdown-number {
  font-size: 48rpx;
  font-weight: bold;
  margin-right: 8rpx;
}

.countdown-unit {
  font-size: 28rpx;
}

.progress-overview {
  margin: 20rpx;
}

.progress-content {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.progress-circle {
  text-align: center;
  margin-bottom: 30rpx;
}

.progress-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-top: 15rpx;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.daily-question {
  margin: 20rpx;
}

.question-card {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.question-type {
  background: #007AFF;
  color: white;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.question-points {
  color: #28a745;
  font-size: 24rpx;
  font-weight: 600;
}

.question-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 20rpx;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-tip {
  font-size: 24rpx;
  color: #007AFF;
}

.quick-actions {
  margin: 20rpx;
}

.actions-grid {
  background: white;
  padding: 20rpx;
  border-radius: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  transition: transform 0.2s ease;
}

.action-item:active {
  transform: scale(0.95);
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15rpx;
}

.action-name {
  font-size: 24rpx;
  color: #333;
  text-align: center;
}

.study-updates {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.update-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}
</style>
