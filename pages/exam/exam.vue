<template>
  <view class="exam-container">
    <!-- 顶部进度栏 -->
    <view class="exam-header">
      <view class="header-info">
        <view class="back-btn" @click="handleBack">
          <uni-icons type="back" size="20" color="#333" />
        </view>
        <view class="exam-title">
          <text class="title-text">{{ titleText }}</text>
          <text class="subtitle-text">{{ subtitleText }}</text>
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
          <text>题号 {{ currentQuestionNumber }}</text>
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
          :disabled="!hasPrevQuestion && (practiceMode === 'chapter' || !canSwitchToPrevChapter())"
          @click="prevQuestion"
        >
          <uni-icons type="back" size="16" color="#fff" />
          <text class="btn-text">上一题</text>
        </button>

        <button 
          v-if="!showAnswer"
          class="action-btn primary show-answer"
          @click="toggleAnswer"
        >
          <uni-icons type="eye" size="16" color="#fff" />
          <text class="btn-text">查看答案</text>
        </button>
        <button 
          v-else
          class="action-btn primary hide-answer"
          @click="toggleAnswer"
        >
          <uni-icons type="eye-slash" size="16" color="#fff" />
          <text class="btn-text">收起</text>
        </button>

        <button 
          v-if="hasNextQuestion || (practiceMode === 'full' && canSwitchToNextChapter())"
          class="action-btn secondary"
          @click="nextQuestion"
        >
          <text class="btn-text">下一题</text>
          <uni-icons type="forward" size="16" color="#fff" />
        </button>
        <button 
          v-else
          class="action-btn finish"
          @click="finishExam"
        >
          <uni-icons type="checkmarkempty" size="16" color="#fff" />
          <text class="btn-text">完成</text>
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
          
          <view class="stats-note">
            <text class="note-text">💡 统计数据基于本次会话答题情况</text>
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

// 页面参数
const bankId = ref(0)
const practiceMode = ref('full') // 'chapter' | 'full'
const startChapterId = ref(null)
const startQuestionNumber = ref(1)

// 题库信息
const bankInfo = ref({
  bank_name: '',
  total_questions: 0
})

// 章节数据
const chapters = ref([]) // 所有章节列表
const currentChapterIndex = ref(0) // 当前章节索引
const currentChapter = ref(null) // 当前章节对象

// 当前题目
const currentQuestionNumber = ref(1) // 当前题号（章节内，从1开始）
const currentQuestion = ref(null) // 当前题目对象
const totalInChapter = ref(0) // 当前章节总题数
const hasNextQuestion = ref(true) // 是否有下一题
const hasPrevQuestion = ref(true) // 是否有上一题

// 答题数据
const userAnswers = ref({}) // {chapterId_questionNumber: answer}
const showAnswer = ref(false)
const questionCache = ref({}) // 题目缓存 {chapterId_questionNumber: question}

// 加载状态
const loading = ref(false)

// 弹窗引用
const statsPopup = ref(null)

// 答案key格式：chapterId_questionNumber
const getAnswerKey = () => {
  if (!currentChapter.value) return ''
  return `${currentChapter.value.id}_${currentQuestionNumber.value}`
}

// 用户当前题目的答案
const userAnswer = computed(() => userAnswers.value[getAnswerKey()] || '')

// 标题文本
const titleText = computed(() => {
  if (practiceMode.value === 'chapter') {
    return currentChapter.value?.chapter_name || bankInfo.value.bank_name
  }
  return bankInfo.value.bank_name
})

// 副标题文本
const subtitleText = computed(() => {
  if (practiceMode.value === 'chapter') {
    return `第 ${currentQuestionNumber.value} / ${totalInChapter.value} 题`
  }
  
  // 整卷模式显示总进度
  let position = 0
  chapters.value.forEach((chapter, index) => {
    if (index < currentChapterIndex.value) {
      position += chapter.question_count
    }
  })
  position += currentQuestionNumber.value
  
  const chapterName = currentChapter.value?.chapter_name || ''
  return `第 ${position} / ${bankInfo.value.total_questions} 题 (${chapterName})`
})

// 进度百分比
const progressPercent = computed(() => {
  if (practiceMode.value === 'chapter') {
    return totalInChapter.value > 0 ? Math.round((currentQuestionNumber.value / totalInChapter.value) * 100) : 0
  }
  
  // 整卷模式计算整体进度
  let totalQuestions = 0
  let currentPosition = 0
  
  chapters.value.forEach((chapter, index) => {
    totalQuestions += chapter.question_count
    if (index < currentChapterIndex.value) {
      currentPosition += chapter.question_count
    }
  })
  currentPosition += currentQuestionNumber.value
  
  return totalQuestions > 0 ? Math.round((currentPosition / totalQuestions) * 100) : 0
})

// 已答题数
const answeredCount = computed(() => Object.keys(userAnswers.value).length)

// 正确数
const correctCount = computed(() => {
  return Object.keys(userAnswers.value).filter(key => {
    const userAns = userAnswers.value[key]
    return checkAnswerByKey(key, userAns)
  }).length
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
onMounted(async () => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options
  
  bankId.value = parseInt(options.bankId) || 0
  practiceMode.value = options.mode || 'full'
  startChapterId.value = parseInt(options.chapterId) || null
  startQuestionNumber.value = parseInt(options.questionNumber) || 1
  
  if (!bankId.value) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }
  
  await initExam()
  
  // 监听小程序隐藏事件
  uni.onAppHide(() => {
    saveProgress()
  })
})

// 页面卸载时保存进度
onUnmounted(() => {
  saveProgress()
})

// 监听题号和章节变化，自动保存进度
watch([currentQuestionNumber, currentChapterIndex], ([newQuestionNum, newChapterIdx], [oldQuestionNum, oldChapterIdx]) => {
  if ((oldQuestionNum !== undefined && newQuestionNum !== oldQuestionNum) ||
      (oldChapterIdx !== undefined && newChapterIdx !== oldChapterIdx)) {
    saveProgress()
  }
})

// 初始化考试
const initExam = async () => {
  loading.value = true
  try {
    console.log('📖 开始初始化考试，参数:', {
      bankId: bankId.value,
      mode: practiceMode.value,
      chapterId: startChapterId.value,
      questionNumber: startQuestionNumber.value
    })
    
    // 1. 获取题库基本信息（使用新的题库管理API）
    const bankData = await get(`/questions/banks/${bankId.value}`, {}, { showLoading: false })
    console.log('✅ 题库信息:', bankData)
    
    bankInfo.value = {
      bank_name: bankData.name || '题库',
      total_questions: bankData.question_count || 0
    }
    
    // 2. 获取章节列表
    const chaptersData = await get(`/question-banks/${bankId.value}/chapters`, {}, { showLoading: false })
    console.log('✅ 章节列表:', chaptersData)
    
    chapters.value = chaptersData.chapters || []
    
    if (chapters.value.length === 0) {
      uni.showToast({ title: '该题库暂无章节', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 1500)
      return
    }
    
    // 3. 确定起始章节
    if (startChapterId.value) {
      const index = chapters.value.findIndex(c => c.id === startChapterId.value)
      currentChapterIndex.value = index >= 0 ? index : 0
      console.log(`📍 找到起始章节，索引: ${currentChapterIndex.value}`)
    } else {
      currentChapterIndex.value = 0
      console.log('📍 使用第一个章节')
    }
    
    currentChapter.value = chapters.value[currentChapterIndex.value]
    currentQuestionNumber.value = startQuestionNumber.value
    
    console.log('📍 当前章节:', currentChapter.value)
    console.log('📍 起始题号:', currentQuestionNumber.value)
    
    // 4. 加载起始题目
    await loadQuestion()
    
    console.log(`✅ 初始化完成，开始${practiceMode.value === 'chapter' ? '章节' : '整卷'}练习`)
    
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
    setTimeout(() => uni.navigateBack(), 1500)
  } finally {
    loading.value = false
    console.log('✅ 初始化loading状态已重置')
  }
}

// 加载题目（单题模式）
const loadQuestion = async () => {
  if (!currentChapter.value) {
    console.error('❌ currentChapter is null')
    return
  }
  
  loading.value = true
  try {
    console.log(`📖 开始加载题目: 题库${bankId.value}, 章节${currentChapter.value.id}, 题号${currentQuestionNumber.value}`)
    
    const response = await get(
      `/question-banks/${bankId.value}/chapters/${currentChapter.value.id}/questions`,
      { questionNumber: currentQuestionNumber.value },
      { showLoading: false } // 使用组件自己的loading状态，不显示系统加载提示
    )
    
    console.log('📡 题目数据响应:', response)
    
    if (response && response.question) {
      currentQuestion.value = response.question
      totalInChapter.value = response.total || 0
      hasNextQuestion.value = response.hasNext || false
      hasPrevQuestion.value = response.hasPrev || false
      
      // 更新题库总题数（整卷模式下累加所有章节题数）
      if (practiceMode.value === 'full' && chapters.value.length > 0) {
        let totalCount = 0
        chapters.value.forEach(chapter => {
          totalCount += chapter.question_count || 0
        })
        if (totalCount > 0) {
          bankInfo.value.total_questions = totalCount
        }
      }
      
      // 缓存题目
      const cacheKey = getAnswerKey()
      questionCache.value[cacheKey] = response.question
      
      // 重置答案显示状态
      showAnswer.value = false
      
      console.log(`✅ 题目加载成功: ${currentChapter.value.chapter_name} 第${currentQuestionNumber.value}题`)
    } else {
      console.warn('⚠️ 响应中没有question字段:', response)
      // 没有更多题目了
      if (practiceMode.value === 'full' && canSwitchToNextChapter()) {
        // 整卷模式，自动切换到下一章节
        await switchToNextChapter()
      } else {
        uni.showToast({ title: '已是最后一题', icon: 'none' })
      }
    }
  } catch (error) {
    console.error('❌ 加载题目失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    console.log('✅ loading状态已重置为false')
  }
}

// 检查是否可以切换到下一章节
const canSwitchToNextChapter = () => {
  return currentChapterIndex.value < chapters.value.length - 1
}

// 检查是否可以切换到上一章节
const canSwitchToPrevChapter = () => {
  return currentChapterIndex.value > 0
}

// 切换到下一章节
const switchToNextChapter = async () => {
  if (canSwitchToNextChapter()) {
    currentChapterIndex.value++
    currentChapter.value = chapters.value[currentChapterIndex.value]
    currentQuestionNumber.value = 1
    
    uni.showToast({
      title: `进入${currentChapter.value.chapter_name}`,
      icon: 'none',
      duration: 1500
    })
    
    await loadQuestion()
  }
}

// 切换到上一章节
const switchToPrevChapter = async () => {
  if (canSwitchToPrevChapter()) {
    currentChapterIndex.value--
    currentChapter.value = chapters.value[currentChapterIndex.value]
    currentQuestionNumber.value = currentChapter.value.question_count
    
    await loadQuestion()
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
  const key = getAnswerKey()
  const answer = userAnswers.value[key]
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
  const key = getAnswerKey()
  
  if (currentQuestion.value.type === 'multiple') {
    // 多选题
    let currentAnswer = userAnswers.value[key] || ''
    
    if (currentAnswer.includes(label)) {
      // 取消选择
      currentAnswer = currentAnswer.replace(label, '')
    } else {
      // 添加选择
      currentAnswer += label
    }
    
    // 按字母顺序排序
    currentAnswer = currentAnswer.split('').sort().join('')
    
    userAnswers.value[key] = currentAnswer
  } else {
    // 单选题或判断题
    userAnswers.value[key] = label
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
const prevQuestion = async () => {
  if (hasPrevQuestion.value) {
    // 章节内有上一题
    currentQuestionNumber.value--
    await loadQuestion()
  } else {
    // 章节内没有上一题了
    if (practiceMode.value === 'full' && canSwitchToPrevChapter()) {
      // 整卷模式，可以返回上一章节
      uni.showModal({
        title: '返回上一章节',
        content: '是否返回上一章节的最后一题？',
        success: async (res) => {
          if (res.confirm) {
            await switchToPrevChapter()
          }
        }
      })
    } else {
      uni.showToast({ title: '已是第一题', icon: 'none' })
    }
  }
}

// 下一题
const nextQuestion = async () => {
  if (hasNextQuestion.value) {
    // 章节内有下一题
    currentQuestionNumber.value++
    await loadQuestion()
  } else {
    // 章节内没有下一题了
    if (practiceMode.value === 'full' && canSwitchToNextChapter()) {
      // 整卷模式，切换到下一章节
      uni.showModal({
        title: '章节完成',
        content: `「${currentChapter.value.chapter_name}」已完成\n\n是否继续下一章节？`,
        confirmText: '继续',
        cancelText: '退出',
        success: async (res) => {
          if (res.confirm) {
            await switchToNextChapter()
          } else {
            handleBack()
          }
        }
      })
    } else {
      // 章节练习模式或已是最后一章
      uni.showToast({ title: '本章节已完成', icon: 'success' })
      finishExam()
    }
  }
}

// 跳转到指定题目（简化版，仅用于统计弹窗）
const jumpToQuestion = async (questionNumber) => {
  if (questionNumber >= 1 && questionNumber <= totalInChapter.value) {
    currentQuestionNumber.value = questionNumber
    await loadQuestion()
    closeStats()
  }
}

// 检查答案是否正确（使用缓存的题目信息）
const checkAnswerByKey = (answerKey, userAns) => {
  if (!userAns) return false
  
  const cachedQuestion = questionCache.value[answerKey]
  if (!cachedQuestion) return false
  
  const correctAns = formatAnswer(cachedQuestion.answer)
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
  if (!bankId.value || !currentChapter.value) return
  
  try {
    if (practiceMode.value === 'chapter') {
      // 章节练习：保存到具体章节
      await post(
        `/user-progress/${bankId.value}/chapters/${currentChapter.value.id}`,
        {
          practice_mode: 'chapter',
          current_question_number: currentQuestionNumber.value,
          completed_count: currentQuestionNumber.value,
          total_questions: totalInChapter.value
        },
        { showLoading: false }
      )
      
      console.log('💾 章节进度已保存:', {
        mode: 'chapter',
        chapter: currentChapter.value.chapter_name,
        questionNumber: currentQuestionNumber.value,
        completedCount: currentQuestionNumber.value,
        total: totalInChapter.value
      })
    } else {
      // 整卷练习：保存到chapter_id=0，记录整体进度
      // 计算整体完成的题目数（前面章节的题数 + 当前章节的题号）
      let totalCompleted = currentQuestionNumber.value
      for (let i = 0; i < currentChapterIndex.value; i++) {
        totalCompleted += chapters.value[i].question_count || 0
      }
      
      await post(
        `/user-progress/${bankId.value}/chapters/0`,
        {
          practice_mode: 'full',
          current_chapter_id: currentChapter.value.id,
          current_question_number: currentQuestionNumber.value,
          completed_count: totalCompleted,
          total_questions: bankInfo.value.total_questions
        },
        { showLoading: false }
      )
      
      console.log('💾 整卷进度已保存:', {
        mode: 'full',
        chapter: currentChapter.value.chapter_name,
        chapterQuestionNumber: currentQuestionNumber.value,
        totalCompleted: totalCompleted,
        total: bankInfo.value.total_questions
      })
    }
  } catch (error) {
    console.error('保存进度失败:', error)
  }
}

// 重置学习进度
const resetProgress = async () => {
  uni.showModal({
    title: '重新练习',
    content: '确定要清除当前章节进度，重新开始练习吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '重置中...' })
          
          // 删除当前章节进度
          if (practiceMode.value === 'chapter') {
            // 章节练习：只删除当前章节
            await del(`/user-progress/${bankId.value}/chapters/${currentChapter.value.id}`)
          } else {
            // 整卷练习：删除所有章节进度
            await del(`/user-progress/${bankId.value}`)
          }
          
          // 重置本地状态
          currentQuestionNumber.value = 1
          userAnswers.value = {}
          showAnswer.value = false
          questionCache.value = {}
          
          // 重新加载第一题
          await loadQuestion()
          
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
  
  const totalQuestions = practiceMode.value === 'chapter' ? totalInChapter.value : bankInfo.value.total_questions
  
  uni.showModal({
    title: '完成练习',
    content: `已完成 ${answeredCount.value}/${totalQuestions} 题\n正确率：${accuracy.value}%`,
    confirmText: '查看统计',
    cancelText: '返回',
    success: (res) => {
      if (res.confirm) {
        showStats()
      } else {
        uni.navigateBack()
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
  padding: 16rpx;
  flex: 1;
  overflow-y: auto;
}

/* 题目卡片 */
.question-card {
  background: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
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
  font-size: 30rpx;
  line-height: 1.7;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
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
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.option-item {
  background: white;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  transition: all 0.2s ease;
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
  width: 48rpx;
  height: 48rpx;
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
  font-size: 26rpx;
  font-weight: 600;
  color: white;
}

.option-content {
  flex: 1;
}

.option-text {
  font-size: 27rpx;
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
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.answer-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.answer-content {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.answer-row {
  display: flex;
  align-items: center;
}

.answer-label {
  font-size: 26rpx;
  color: #666;
  min-width: 150rpx;
}

.answer-value {
  font-size: 26rpx;
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
  padding: 20rpx;
  border-radius: 10rpx;
  margin-top: 6rpx;
}

.explanation-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 10rpx;
}

.explanation-text {
  font-size: 25rpx;
  line-height: 1.7;
  color: #666;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12rpx;
  padding: 0 20rpx 20rpx;
  margin-top: 24rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 20rpx 16rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
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

.action-btn .btn-text {
  font-size: 26rpx;
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

.stats-note {
  padding: 20rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  text-align: center;
}

.note-text {
  font-size: 24rpx;
  color: #666;
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

