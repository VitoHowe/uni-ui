<template>
  <view class="exam-container">
    <!-- 顶部进度栏 -->
    <view class="exam-header">
      <view class="header-info">
        <view class="back-btn" @click="handleBack">
          <uni-icons type="back" size="20" color="#333" />
        </view>
        <view class="exam-title">
          <text class="title-text">{{ bankInfo.bank_name }}</text>
          <text class="subtitle-text">{{ currentIndex + 1 }} / {{ questions.length }}</text>
        </view>
        <view class="stats-btn" @click="showStats">
          <uni-icons type="bars" size="20" color="#333" />
        </view>
      </view>
      <view class="progress-container">
        <view class="progress-bar">
          <view class="progress-fill" :style="{width: progressPercent + '%'}"></view>
        </view>
        <text class="progress-text">{{ progressPercent }}%</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-icons type="spinner-cycle" size="40" color="#667eea" class="loading-icon" />
      <text class="loading-text">正在加载题目...</text>
    </view>

    <!-- 题目内容 -->
    <view v-else-if="currentQuestion" class="question-content">
      <!-- 题目卡片 -->
      <view class="question-card">
        <view class="question-header">
          <view class="question-type" :class="'type-' + currentQuestion.type">
            <text class="type-text">{{ getTypeLabel(currentQuestion.type) }}</text>
          </view>
          <view class="question-difficulty">
            <uni-icons 
              v-for="i in 3" 
              :key="i"
              type="star-filled" 
              :size="14" 
              :color="i <= currentQuestion.difficulty ? '#ffc107' : '#ddd'" 
            />
          </view>
        </view>

        <view class="question-number">
          <text>第 {{ currentIndex + 1 }} 题</text>
        </view>

        <view class="question-text">
          <text>{{ currentQuestion.content }}</text>
        </view>

        <!-- 标签 -->
        <view v-if="currentQuestion.tags && currentQuestion.tags.length > 0" class="question-tags">
          <view class="tag" v-for="(tag, index) in currentQuestion.tags" :key="index">
            <text class="tag-text">{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- 选项列表 -->
      <view class="options-list">
        <view 
          v-for="(option, index) in currentQuestion.options" 
          :key="index"
          class="option-item"
          :class="{
            'selected': isOptionSelected(index),
            'correct': showAnswer && isCorrectOption(index),
            'wrong': showAnswer && isOptionSelected(index) && !isCorrectOption(index),
            'disabled': showAnswer
          }"
          @click="selectOption(index)"
        >
          <view class="option-label">
            <text class="label-text">{{ getOptionLabel(index) }}</text>
          </view>
          <view class="option-content">
            <text class="option-text">{{ option }}</text>
          </view>
          <view class="option-icon">
            <uni-icons 
              v-if="showAnswer && isCorrectOption(index)"
              type="checkmarkempty" 
              size="20" 
              color="#28a745" 
            />
            <uni-icons 
              v-else-if="showAnswer && isOptionSelected(index) && !isCorrectOption(index)"
              type="closeempty" 
              size="20" 
              color="#dc3545" 
            />
            <view 
              v-else-if="isOptionSelected(index)" 
              class="selected-dot"
            ></view>
          </view>
        </view>
      </view>

      <!-- 答案解析 -->
      <view v-if="showAnswer" class="answer-section">
        <view class="answer-header">
          <uni-icons type="info" size="20" color="#667eea" />
          <text class="answer-title">答案解析</text>
        </view>
        <view class="answer-content">
          <view class="answer-row">
            <text class="answer-label">正确答案：</text>
            <text class="answer-value correct">{{ formatAnswer(currentQuestion.answer) }}</text>
          </view>
          <view class="answer-row">
            <text class="answer-label">你的答案：</text>
            <text class="answer-value" :class="isAnswerCorrect ? 'correct' : 'wrong'">
              {{ userAnswer || '未作答' }}
            </text>
          </view>
          <view class="explanation">
            <text class="explanation-label">解析：</text>
            <text class="explanation-text">{{ currentQuestion.explanation || '暂无解析' }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button 
          class="action-btn secondary"
          :disabled="currentIndex === 0"
          @click="prevQuestion"
        >
          <uni-icons type="back" size="18" color="#fff" />
          <text>上一题</text>
        </button>

        <button 
          v-if="!showAnswer"
          class="action-btn primary show-answer"
          @click="toggleAnswer"
        >
          <uni-icons type="eye" size="18" color="#fff" />
          <text>显示答案</text>
        </button>
        <button 
          v-else
          class="action-btn primary hide-answer"
          @click="toggleAnswer"
        >
          <uni-icons type="eye-slash" size="18" color="#fff" />
          <text>隐藏答案</text>
        </button>

        <button 
          v-if="currentIndex < questions.length - 1"
          class="action-btn secondary"
          @click="nextQuestion"
        >
          <text>下一题</text>
          <uni-icons type="forward" size="18" color="#fff" />
        </button>
        <button 
          v-else
          class="action-btn finish"
          @click="finishExam"
        >
          <uni-icons type="checkmarkempty" size="18" color="#fff" />
          <text>完成</text>
        </button>
      </view>
    </view>

    <!-- 统计弹窗 -->
    <uni-popup ref="statsPopup" type="center">
      <view class="stats-popup">
        <view class="popup-header">
          <text class="popup-title">答题统计</text>
          <view class="close-btn" @click="closeStats">
            <uni-icons type="closeempty" size="20" color="#999" />
          </view>
        </view>

        <view class="stats-content">
          <view class="stat-row">
            <view class="stat-item">
              <text class="stat-number primary">{{ answeredCount }}</text>
              <text class="stat-label">已答题</text>
            </view>
            <view class="stat-item">
              <text class="stat-number success">{{ correctCount }}</text>
              <text class="stat-label">正确数</text>
            </view>
            <view class="stat-item">
              <text class="stat-number danger">{{ wrongCount }}</text>
              <text class="stat-label">错误数</text>
            </view>
          </view>

          <view class="accuracy-row">
            <text class="accuracy-label">正确率</text>
            <text class="accuracy-value">{{ accuracy }}%</text>
          </view>

          <view class="question-grid">
            <view 
              v-for="(q, index) in questions" 
              :key="index"
              class="grid-item"
              :class="{
                'current': index === currentIndex,
                'answered': userAnswers[index],
                'correct': userAnswers[index] && checkAnswer(index),
                'wrong': userAnswers[index] && !checkAnswer(index)
              }"
              @click="jumpToQuestion(index)"
            >
              <text class="grid-number">{{ index + 1 }}</text>
            </view>
          </view>
        </view>

        <view class="popup-buttons">
          <button class="popup-btn secondary" @click="resetProgress">重新练习</button>
          <button class="popup-btn primary" @click="closeStats">继续练习</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { get, post, del } from '@/utils/request.js'

// 获取页面参数
const bankInfo = ref({
  bank_name: '',
  file_name: ''
})
const resultId = ref(0)
const bankId = ref(0)

// 题目数据
const questions = ref([])
const currentIndex = ref(0)
const userAnswers = ref({}) // 用户答案记录 {index: answer}
const showAnswer = ref(false)
const historyAnsweredCount = ref(0) // 历史累计已答题数

// 加载状态
const loading = ref(false)

// 弹窗引用
const statsPopup = ref(null)

// 当前题目
const currentQuestion = computed(() => questions.value[currentIndex.value] || null)

// 用户当前题目的答案
const userAnswer = computed(() => userAnswers.value[currentIndex.value] || '')

// 进度百分比
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((currentIndex.value + 1) / questions.value.length * 100)
})

// 已答题数
const answeredCount = computed(() => Object.keys(userAnswers.value).length)

// 正确数
const correctCount = computed(() => {
  return Object.keys(userAnswers.value).filter(index => checkAnswer(parseInt(index))).length
})

// 错误数
const wrongCount = computed(() => answeredCount.value - correctCount.value)

// 正确率
const accuracy = computed(() => {
  if (answeredCount.value === 0) return 0
  return Math.round(correctCount.value / answeredCount.value * 100)
})

// 当前答案是否正确
const isAnswerCorrect = computed(() => {
  if (!userAnswer.value) return false
  return userAnswer.value === formatAnswer(currentQuestion.value.answer)
})

// 页面加载
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  
  resultId.value = parseInt(options.resultId) || 0
  bankId.value = parseInt(options.bankId) || 0
  
  if (resultId.value) {
    fetchExamData()
  }
  
  // 监听小程序隐藏事件（用户切换应用或返回桌面）
  uni.onAppHide(() => {
    saveProgress()
  })
})

// 页面卸载时保存进度
onUnmounted(() => {
  saveProgress()
})

// 监听题目切换，自动保存进度
watch(currentIndex, (newIndex, oldIndex) => {
  // 当题目发生变化时保存进度
  if (oldIndex !== undefined && newIndex !== oldIndex) {
    saveProgress()
  }
})

// 获取考试数据
const fetchExamData = async () => {
  loading.value = true
  try {
    // 1. 获取题库数据
    const data = await get(`/parse-results/${resultId.value}`)
    
    bankInfo.value = {
      bank_name: data.bank_name,
      file_name: data.file_name
    }
    questions.value = data.questions || []
    
    // 2. 获取学习进度
    try {
      const progressData = await get(`/user-progress/${bankId.value}`)
      
      if (progressData && progressData.current_question_index > 0) {
        // 有学习进度，跳转到上次学习位置
        const lastIndex = progressData.current_question_index
        
        // 保存历史已答题数量
        historyAnsweredCount.value = progressData.completed_count || 0
        
        // 确保索引不超过题目总数
        if (lastIndex < questions.value.length) {
          currentIndex.value = lastIndex
          
          console.log(`📖 继续学习，从第 ${lastIndex + 1} 题开始，历史已答 ${historyAnsweredCount.value} 题`)
        }
      } else {
        console.log('🆕 开始新的学习')
        historyAnsweredCount.value = 0
      }
    } catch (progressError) {
      console.error('获取学习进度失败:', progressError)
      // 进度获取失败，从第一题开始
      currentIndex.value = 0
      historyAnsweredCount.value = 0
    }
    
  } catch (error) {
    console.error('获取题库失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 获取题型标签
const getTypeLabel = (type) => {
  const typeMap = {
    'single': '单选题',
    'multiple': '多选题',
    'judge': '判断题',
    'fill': '填空题'
  }
  return typeMap[type] || '未知题型'
}

// 获取选项标签
const getOptionLabel = (index) => {
  return String.fromCharCode(65 + index) // A, B, C, D...
}

// 格式化答案
const formatAnswer = (answer) => {
  if (!answer) return ''
  
  // 如果是多选题，答案可能是 "AB" 或 ["A", "B"]
  if (Array.isArray(answer)) {
    return answer.sort().join('')
  }
  
  // 单选题或判断题
  return answer.toString().toUpperCase()
}

// 判断选项是否被选中
const isOptionSelected = (optionIndex) => {
  const answer = userAnswers.value[currentIndex.value]
  if (!answer) return false
  
  const label = getOptionLabel(optionIndex)
  
  if (currentQuestion.value.type === 'multiple') {
    return answer.includes(label)
  }
  
  return answer === label
}

// 判断选项是否是正确答案
const isCorrectOption = (optionIndex) => {
  const correctAnswer = formatAnswer(currentQuestion.value.answer)
  const label = getOptionLabel(optionIndex)
  
  if (currentQuestion.value.type === 'multiple') {
    return correctAnswer.includes(label)
  }
  
  return correctAnswer === label
}

// 选择选项
const selectOption = (optionIndex) => {
  if (showAnswer.value) return // 已显示答案时不能再选择
  
  const label = getOptionLabel(optionIndex)
  
  if (currentQuestion.value.type === 'multiple') {
    // 多选题
    let currentAnswer = userAnswers.value[currentIndex.value] || ''
    
    if (currentAnswer.includes(label)) {
      // 取消选择
      currentAnswer = currentAnswer.replace(label, '')
    } else {
      // 添加选择
      currentAnswer += label
    }
    
    // 按字母顺序排序
    currentAnswer = currentAnswer.split('').sort().join('')
    
    userAnswers.value[currentIndex.value] = currentAnswer
  } else {
    // 单选题或判断题
    userAnswers.value[currentIndex.value] = label
  }
  
  // 选择后自动显示答案
  setTimeout(() => {
    showAnswer.value = true
  }, 300)
}

// 切换答案显示
const toggleAnswer = () => {
  showAnswer.value = !showAnswer.value
}

// 上一题
const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
  }
}

// 下一题
const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
  }
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  currentIndex.value = index
  showAnswer.value = false
  closeStats()
}

// 检查答案是否正确
const checkAnswer = (index) => {
  const userAns = userAnswers.value[index]
  if (!userAns) return false
  
  const question = questions.value[index]
  const correctAns = formatAnswer(question.answer)
  
  return userAns === correctAns
}

// 显示统计
const showStats = () => {
  statsPopup.value.open()
}

// 关闭统计
const closeStats = () => {
  statsPopup.value.close()
}

// 保存学习进度
const saveProgress = async () => {
  if (!bankId.value || questions.value.length === 0) return
  
  try {
    // 计算已完成题目数量：历史已答题数 + 本次新答题数
    // 注意：这里的 answeredCount 是本次会话中答题的数量
    const totalCompleted = historyAnsweredCount.value + answeredCount.value
    
    await post(`/user-progress/${bankId.value}`, {
      parse_result_id: resultId.value,
      current_question_index: currentIndex.value,
      completed_count: totalCompleted, // 累计已答题数
      total_questions: questions.value.length
    }, {
      showLoading: false // 后台保存，不显示加载提示
    })
    
    console.log('💾 学习进度已保存:', {
      current: currentIndex.value + 1,
      historyAnswered: historyAnsweredCount.value,
      sessionAnswered: answeredCount.value,
      totalCompleted: totalCompleted,
      total: questions.value.length,
      progress: progressPercent.value + '%'
    })
  } catch (error) {
    console.error('保存学习进度失败:', error)
    // 保存失败不影响用户操作
  }
}

// 重置学习进度
const resetProgress = async () => {
  uni.showModal({
    title: '重新练习',
    content: '确定要清除当前进度，重新开始练习吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '重置中...' })
          
          // 调用重置接口
          await del(`/user-progress/${bankId.value}`)
          
          // 重置本地状态
          currentIndex.value = 0
          userAnswers.value = {}
          showAnswer.value = false
          historyAnsweredCount.value = 0 // 重置历史答题数
          
          uni.hideLoading()
          uni.showToast({
            title: '已重新开始',
            icon: 'success'
          })
          
          console.log('🔄 学习进度已重置')
        } catch (error) {
          uni.hideLoading()
          console.error('重置进度失败:', error)
          uni.showToast({
            title: error.message || '重置失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 完成考试
const finishExam = () => {
  // 保存最终进度
  saveProgress()
  
  uni.showModal({
    title: '完成练习',
    content: `已完成 ${answeredCount.value}/${questions.value.length} 题\n正确率：${accuracy.value}%`,
    confirmText: '查看统计',
    cancelText: '重新练习',
    success: (res) => {
      if (res.confirm) {
        showStats()
      } else {
        // 用户点击"重新练习"
        resetProgress()
      }
    }
  })
}

// 返回
const handleBack = () => {
  uni.showModal({
    title: '确认退出',
    content: '学习进度已自动保存，确定要退出吗？',
    success: async (res) => {
      if (res.confirm) {
        // 退出前保存一次进度
        await saveProgress()
        uni.navigateBack()
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.exam-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  padding-bottom: 40rpx;
}

/* 顶部进度栏 */
.exam-header {
  background: white;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.back-btn, .stats-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 50%;
}

.exam-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.subtitle-text {
  font-size: 24rpx;
  color: #999;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
  min-width: 60rpx;
  text-align: right;
}

/* 加载状态 */
.loading-state {
  padding: 200rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 题目内容 */
.question-content {
  padding: 20rpx;
}

/* 题目卡片 */
.question-card {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.question-type {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  background: #e3f2fd;
}

.type-single {
  background: #e3f2fd;
}

.type-multiple {
  background: #fff3e0;
}

.type-judge {
  background: #e8f5e9;
}

.type-fill {
  background: #fce4ec;
}

.type-text {
  font-size: 24rpx;
  color: #666;
}

.question-difficulty {
  display: flex;
  gap: 4rpx;
}

.question-number {
  margin-bottom: 16rpx;
}

.question-number text {
  font-size: 26rpx;
  color: #999;
}

.question-text {
  font-size: 32rpx;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20rpx;
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.tag {
  padding: 6rpx 16rpx;
  background: #f5f7fa;
  border-radius: 8rpx;
}

.tag-text {
  font-size: 22rpx;
  color: #666;
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.option-item {
  background: white;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  transition: all 0.3s ease;
}

.option-item.selected {
  border-color: #667eea;
  background: #f5f7ff;
}

.option-item.correct {
  border-color: #28a745;
  background: #f1f9f3;
}

.option-item.wrong {
  border-color: #dc3545;
  background: #fff5f5;
}

.option-item.disabled {
  pointer-events: none;
}

.option-label {
  width: 56rpx;
  height: 56rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-item.correct .option-label {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.option-item.wrong .option-label {
  background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
}

.label-text {
  font-size: 28rpx;
  font-weight: 600;
  color: white;
}

.option-content {
  flex: 1;
}

.option-text {
  font-size: 28rpx;
  line-height: 1.6;
  color: #333;
}

.option-icon {
  flex-shrink: 0;
}

.selected-dot {
  width: 16rpx;
  height: 16rpx;
  background: #667eea;
  border-radius: 50%;
}

/* 答案解析 */
.answer-section {
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.answer-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.answer-content {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.answer-row {
  display: flex;
  align-items: center;
}

.answer-label {
  font-size: 28rpx;
  color: #666;
  min-width: 160rpx;
}

.answer-value {
  font-size: 28rpx;
  font-weight: 600;
}

.answer-value.correct {
  color: #28a745;
}

.answer-value.wrong {
  color: #dc3545;
}

.explanation {
  background: #f5f7fa;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-top: 8rpx;
}

.explanation-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.explanation-text {
  font-size: 26rpx;
  line-height: 1.8;
  color: #666;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16rpx;
  padding: 0 20rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  border: none;
  transition: all 0.3s ease;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:disabled {
  background: #e0e0e0;
  color: #999;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.finish {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

/* 统计弹窗 */
.stats-popup {
  width: 640rpx;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.stat-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
}

.stat-number.primary {
  color: #667eea;
}

.stat-number.success {
  color: #28a745;
}

.stat-number.danger {
  color: #dc3545;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.accuracy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
}

.accuracy-label {
  font-size: 28rpx;
  color: white;
}

.accuracy-value {
  font-size: 40rpx;
  font-weight: bold;
  color: white;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16rpx;
}

.grid-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8rpx;
  border: 2rpx solid transparent;
}

.grid-item.current {
  border-color: #667eea;
  background: #e3f2fd;
}

.grid-item.answered {
  background: #e0e0e0;
}

.grid-item.correct {
  background: #d4edda;
  color: #28a745;
}

.grid-item.wrong {
  background: #f8d7da;
  color: #dc3545;
}

.grid-number {
  font-size: 24rpx;
  font-weight: 600;
}

.popup-buttons {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.popup-btn {
  flex: 1;
  border: none;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.popup-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.popup-btn.secondary {
  background: #f5f7fa;
  color: #333;
}
</style>

