<template>
  <view class="wrong-list">
    <view class="header">
      <text class="title">{{ paperName || '真题错题' }}</text>
      <text class="subtitle">共 {{ wrongQuestions.length }} 题</text>
    </view>

    <view v-if="loading" class="loading-state">
      <uni-icons type="spinner-cycle" size="40" color="#dc3545" class="loading-icon" />
      <text class="loading-text">正在加载错题...</text>
    </view>

    <view v-else-if="wrongQuestions.length === 0" class="empty-state">
      <uni-icons type="checkmarkempty" size="80" color="#28a745" />
      <text class="empty-title">暂无错题</text>
      <text class="empty-desc">这次答题没有错题，继续保持</text>
    </view>

    <view v-else class="question-cards">
      <view class="question-card" v-for="item in wrongQuestions" :key="item.question_id">
        <view class="question-header">
          <text class="question-no">第 {{ item.question_no }} 题</text>
          <text class="question-type">{{ getTypeLabel(item.type) }}</text>
        </view>
        <text class="question-content">{{ item.content }}</text>
        <view class="answer-row">
          <text class="answer-label">你的答案</text>
          <text class="answer-value wrong">{{ formatAnswer(item.selected_answer) || '-' }}</text>
        </view>
        <view class="answer-row">
          <text class="answer-label">正确答案</text>
          <text class="answer-value correct">{{ formatAnswer(item.correct_answer || item.answer) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get } from '@/utils/request.js'

const wrongQuestions = ref([])
const loading = ref(false)
const paperId = ref(0)
const paperName = ref('')

const fetchWrongQuestions = async () => {
  if (!paperId.value) return
  loading.value = true
  try {
    const response = await get(`/real-exams/${paperId.value}/wrong-questions`)
    wrongQuestions.value = response.questions || []
  } catch (error) {
    console.error('获取错题失败:', error)
    uni.showToast({
      title: error.message || '获取错题失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const getTypeLabel = (type) => {
  const typeMap = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    fill: '填空题',
    essay: '简答题'
  }
  return typeMap[type] || '未知题型'
}

const formatAnswer = (answer) => {
  if (!answer) return ''
  if (Array.isArray(answer)) {
    return answer.sort().join('')
  }
  return answer.toString().toUpperCase()
}

onShow(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  paperId.value = parseInt(currentPage?.options?.paperId) || 0
  paperName.value = currentPage?.options?.paperName
    ? decodeURIComponent(currentPage.options.paperName)
    : ''
  await fetchWrongQuestions()
})
</script>

<style lang="scss" scoped>
.wrong-list {
  padding: 20rpx;
  background: #f8f9fa;
  min-height: 100vh;
}

.header {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  margin-bottom: 20rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #999;
}

.loading-state,
.empty-state {
  padding: 80rpx 20rpx;
  text-align: center;
  color: #999;
}

.empty-title {
  display: block;
  font-size: 30rpx;
  color: #666;
  margin-top: 20rpx;
}

.empty-desc {
  display: block;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.question-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.question-no {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.question-type {
  font-size: 22rpx;
  color: #dc3545;
}

.question-content {
  display: block;
  font-size: 26rpx;
  color: #444;
  margin-bottom: 16rpx;
}

.answer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}

.answer-label {
  font-size: 24rpx;
  color: #666;
}

.answer-value {
  font-size: 24rpx;
  font-weight: 600;
}

.answer-value.wrong {
  color: #dc3545;
}

.answer-value.correct {
  color: #28a745;
}
</style>
