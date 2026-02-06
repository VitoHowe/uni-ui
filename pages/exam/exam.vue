<template>
  <view class="exam-container">
    <!-- 顶部进度栏 -->
    <view class="exam-header" :style="{ paddingTop: statusBarHeight + 'px', height: navBarHeight + 'px' }">
      <view class="header-content">
        <view class="header-info"
          :style="{ maxWidth: (menuButtonInfo.left || 0) > 0 ? (menuButtonInfo.left - 20) + 'px' : 'auto' }">
          <view class="back-btn" @click="handleBack">
            <uni-icons type="back" size="20" color="#333" />
          </view>
          <view class="exam-title">
            <text class="title-text">{{ titleText }}</text>
            <text class="subtitle-text">{{ subtitleText }}</text>
          </view>
          <!-- 统计按钮移到左侧，避免与胶囊重叠 -->
        </view>
        <view class="progress-container">
          <view v-if="showProgress" class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
          </view>
          <text v-if="showProgress" class="progress-text">{{ progressPercent }}%</text>
          <view class="stats-btn" @click="showStats">
            <uni-icons type="bars" size="18" color="#3B82F6" />
          </view>
        </view>
      </view>
    </view>

    <!-- 随机练习历史统计 -->
    <view v-if="showPracticeSummary" class="practice-summary">
      <view class="summary-card">
        <view class="summary-item">
          <text class="summary-number">{{ practiceSummary.answered_count }}</text>
          <text class="summary-label">已作答</text>
        </view>
        <view class="summary-item">
          <text class="summary-number">{{ practiceSummary.accuracy }}%</text>
          <text class="summary-label">正确率</text>
        </view>
        <view class="summary-item">
          <text class="summary-number">{{ practiceSummary.wrong_count }}</text>
          <text class="summary-label">错题数</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <uni-icons type="spinner-cycle" size="40" color="#667eea" class="loading-icon" />
      <text class="loading-text">正在加载题目...</text>
    </view>

    <!-- 题目内容 -->
    <view v-else-if="currentQuestion" class="question-wrapper">
      <!-- 可滚动的题目内容区域 -->
      <view class="question-content">
        <!-- 题目卡片 -->
        <view class="question-card">
          <view class="question-header">
            <view class="question-type" :class="'type-' + currentQuestion.type">
              <text class="type-text">{{ getTypeLabel(currentQuestion.type) }}</text>
            </view>
            <view class="question-difficulty">
              <uni-icons v-for="i in 3" :key="i" type="star-filled" :size="14"
                :color="i <= currentQuestion.difficulty ? '#ffc107' : '#ddd'" />
            </view>
          </view>

          <view class="question-number">
            <text>题号 {{ currentQuestionNumber }}</text>
          </view>

          <view class="question-text" @click="handleImageClick">
            <rich-text :nodes="parsedContent"></rich-text>
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
          <view v-for="(option, index) in currentQuestion.options" :key="index" class="option-item" :class="{
            'selected': isOptionSelected(index),
            'correct': showAnswer && isCorrectOption(index),
            'wrong': showAnswer && isOptionSelected(index) && !isCorrectOption(index),
            'disabled': showAnswer
          }" @click="selectOption(index)">
            <view class="option-label">
              <text class="label-text">{{ getOptionLabel(index) }}</text>
            </view>
            <view class="option-content">
              <text class="option-text">{{ option }}</text>
            </view>
            <view class="option-icon">
              <uni-icons v-if="showAnswer && isCorrectOption(index)" type="checkmarkempty" size="20" color="#28a745" />
              <uni-icons v-else-if="showAnswer && isOptionSelected(index) && !isCorrectOption(index)" type="closeempty"
                size="20" color="#dc3545" />
              <view v-else-if="isOptionSelected(index)" class="selected-dot"></view>
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
            <view class="explanation" @click="handleImageClick">
              <text class="explanation-label">解析：</text>
              <view class="explanation-text">
                <rich-text v-if="currentQuestion.explanation" :nodes="parsedExplanation"></rich-text>
                <text v-else style="color:#999;">暂无解析</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 固定在底部的操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn secondary"
          :disabled="!hasPrevQuestion && (practiceMode === 'chapter' || !canSwitchToPrevChapter())"
          @click="prevQuestion">
          <uni-icons type="back" size="16" color="#fff" />
          <text class="btn-text">上一题</text>
        </button>

        <button v-if="!showAnswer" class="action-btn primary show-answer" @click="toggleAnswer">
          <uni-icons type="eye" size="16" color="#fff" />
          <text class="btn-text">查看答案</text>
        </button>
        <button v-else class="action-btn primary hide-answer" @click="toggleAnswer">
          <uni-icons type="eye-slash" size="16" color="#fff" />
          <text class="btn-text">收起</text>
        </button>

        <button v-if="hasNextQuestion || (practiceMode === 'full' && canSwitchToNextChapter())"
          class="action-btn secondary" @click="nextQuestion">
          <text class="btn-text">下一题</text>
          <uni-icons type="forward" size="16" color="#fff" />
        </button>
        <button v-else class="action-btn finish" @click="finishExam">
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
            <text class="note-text">提示：统计数据基于本次会话答题情况</text>
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
import { parseQuestionImages, extractAllQuestionImages } from '@/utils/imageParser.js'
import { API_CONFIG } from '@/utils/constants.js'

// 胶囊按钮和状态栏信息
const menuButtonInfo = ref({})
const statusBarHeight = ref(0)
const navBarHeight = ref(0)

// 页面参数
const bankId = ref(0)
const practiceMode = ref('full') // 'chapter' | 'full' | 'special' | 'random' | 'real'
const startChapterId = ref(null)
const startQuestionNumber = ref(1)
const subjectId = ref(0)
const subjectChapterId = ref(0)
const subjectName = ref('')
const chapterName = ref('')
const paperId = ref(0)
const paperName = ref('')

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
const randomQuestions = ref([])
const attemptSubmitted = ref(false)
const practiceSummary = ref({
  answered_count: 0,
  correct_count: 0,
  wrong_count: 0,
  accuracy: 0
})

// 加载状态
const loading = ref(false)

// 弹窗引用
const statsPopup = ref(null)

const isBankMode = computed(() => practiceMode.value === 'full' || practiceMode.value === 'chapter')
const isSpecialMode = computed(() => practiceMode.value === 'special')
const isRandomMode = computed(() => practiceMode.value === 'random')
const isRealMode = computed(() => practiceMode.value === 'real')
const showProgress = computed(() => !isRandomMode.value)
const showPracticeSummary = computed(() => isRandomMode.value)

// 答案key格式：chapterId_questionNumber
const getAnswerKey = () => {
  if (isRandomMode.value) {
    return `random_${currentQuestionNumber.value}`
  }
  if (isRealMode.value) {
    return `real_${paperId.value}_${currentQuestionNumber.value}`
  }
  if (isSpecialMode.value) {
    return `special_${subjectChapterId.value}_${currentQuestionNumber.value}`
  }
  if (!currentChapter.value) return ''
  return `${currentChapter.value.id}_${currentQuestionNumber.value}`
}

// 用户当前题目的答案
const userAnswer = computed(() => userAnswers.value[getAnswerKey()] || '')

// 标题文本
const titleText = computed(() => {
  if (isRealMode.value) {
    return paperName.value || '真题练习'
  }
  if (isRandomMode.value) {
    return subjectName.value ? `${subjectName.value} 随机练习` : '随机练习'
  }
  if (isSpecialMode.value) {
    return currentChapter.value?.chapter_name || subjectName.value || '专项训练'
  }
  if (practiceMode.value === 'chapter') {
    return currentChapter.value?.chapter_name || bankInfo.value.bank_name
  }
  return bankInfo.value.bank_name
})

const totalQuestions = computed(() => {
  if (isRandomMode.value) {
    return randomQuestions.value.length
  }
  if (isSpecialMode.value || isRealMode.value || practiceMode.value === 'chapter') {
    return totalInChapter.value
  }
  return bankInfo.value.total_questions
})

// 副标题文本
const subtitleText = computed(() => {
  if (isSpecialMode.value || isRandomMode.value || isRealMode.value || practiceMode.value === 'chapter') {
    return `第 ${currentQuestionNumber.value} / ${totalQuestions.value} 题`
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
  if (isRandomMode.value) {
    return 0
  }
  if (isSpecialMode.value || isRealMode.value || practiceMode.value === 'chapter') {
    return totalQuestions.value > 0
      ? Math.round((currentQuestionNumber.value / totalQuestions.value) * 100)
      : 0
  }

  // 整卷模式计算整体进度
  let totalQuestionCount = 0
  let currentPosition = 0

  chapters.value.forEach((chapter, index) => {
    totalQuestionCount += chapter.question_count
    if (index < currentChapterIndex.value) {
      currentPosition += chapter.question_count
    }
  })
  currentPosition += currentQuestionNumber.value

  return totalQuestionCount > 0 ? Math.round((currentPosition / totalQuestionCount) * 100) : 0
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

const imageBankId = computed(() => {
  return currentQuestion.value?.bank_id || bankId.value || 0
})

// 解析后的题目内容（包含图片）
const parsedContent = computed(() => {
  if (!currentQuestion.value || !currentQuestion.value.content) return ''
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '')
  return parseQuestionImages(currentQuestion.value.content, imageBankId.value, baseUrl)
})

// 解析后的答案解析（包含图片）
const parsedExplanation = computed(() => {
  if (!currentQuestion.value || !currentQuestion.value.explanation) return ''
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '')
  return parseQuestionImages(currentQuestion.value.explanation, imageBankId.value, baseUrl)
})

// 获取当前题目所有图片URL（用于预览）
const currentImageUrls = computed(() => {
  if (!currentQuestion.value) return []
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '')
  return extractAllQuestionImages(currentQuestion.value, imageBankId.value, baseUrl)
})

// 页面加载
onMounted(async () => {
  // 获取胶囊按钮信息（仅微信小程序）
  // #ifdef MP-WEIXIN
  try {
    const menuButton = uni.getMenuButtonBoundingClientRect()
    const systemInfo = uni.getSystemInfoSync()
    menuButtonInfo.value = menuButton
    statusBarHeight.value = systemInfo.statusBarHeight || 0

    // 计算导航栏高度：胶囊按钮底部位置 + 与顶部相同的间距
    const gap = menuButton.top - statusBarHeight.value
    navBarHeight.value = menuButton.height + gap * 2 + statusBarHeight.value
  } catch (e) {
    console.error('获取胶囊按钮信息失败:', e)
  }
  // #endif

  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.options

  practiceMode.value = options.mode || 'full'
  bankId.value = parseInt(options.bankId) || 0
  subjectId.value = parseInt(options.subjectId) || 0
  subjectChapterId.value = parseInt(options.subjectChapterId || options.chapterId) || 0
  paperId.value = parseInt(options.paperId) || 0
  subjectName.value = options.subjectName ? decodeURIComponent(options.subjectName) : ''
  chapterName.value = options.chapterName ? decodeURIComponent(options.chapterName) : ''
  paperName.value = options.paperName ? decodeURIComponent(options.paperName) : ''
  startChapterId.value = parseInt(options.chapterId) || null
  startQuestionNumber.value = parseInt(options.questionNumber) || 1

  const paramError = (() => {
    if (isBankMode.value && !bankId.value) return '题库参数错误'
    if (isSpecialMode.value && (!subjectId.value || !subjectChapterId.value)) return '科目章节参数错误'
    if (isRandomMode.value && !subjectId.value) return '科目参数错误'
    if (isRealMode.value && !paperId.value) return '试卷参数错误'
    return ''
  })()

  if (paramError) {
    uni.showToast({ title: paramError, icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
    return
  }

  await initExam()

  // 监听小程序隐藏事件
  uni.onAppHide(() => {
    saveCurrentProgress()
  })
})

const saveCurrentProgress = async () => {
  if (isBankMode.value) {
    await saveProgress()
    return
  }
  if (isSpecialMode.value) {
    await saveSpecialProgress()
  }
}

// 页面卸载时保存进度
onUnmounted(() => {
  saveCurrentProgress()
})

// 监听题号和章节变化，自动保存进度
watch([currentQuestionNumber, currentChapterIndex], ([newQuestionNum, newChapterIdx], [oldQuestionNum, oldChapterIdx]) => {
  if ((oldQuestionNum !== undefined && newQuestionNum !== oldQuestionNum) ||
    (oldChapterIdx !== undefined && newChapterIdx !== oldChapterIdx)) {
    saveCurrentProgress()
  }
})

// 初始化考试
const initExam = async () => {
  loading.value = true
  try {
    if (isRandomMode.value) {
      await initRandomExam()
      return
    }
    if (isSpecialMode.value) {
      await initSpecialExam()
      return
    }
    if (isRealMode.value) {
      await initRealExam()
      return
    }

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

const initSpecialExam = async () => {
  console.log('📘 初始化专项训练', {
    subjectId: subjectId.value,
    subjectChapterId: subjectChapterId.value
  })

  chapters.value = []
  currentChapterIndex.value = 0
  currentChapter.value = {
    id: subjectChapterId.value,
    chapter_name: chapterName.value || subjectName.value || '专项训练'
  }

  bankInfo.value = {
    bank_name: currentChapter.value.chapter_name,
    total_questions: 0
  }

  currentQuestionNumber.value = startQuestionNumber.value
  await loadQuestion()
}

const initRandomExam = async () => {
  console.log('📘 初始化随机练习', { subjectId: subjectId.value })

  chapters.value = []
  currentChapterIndex.value = 0
  currentChapter.value = null
  randomQuestions.value = []

  const response = await get(
    `/subjects/${subjectId.value}/random`,
    { count: 10 },
    { showLoading: false }
  )

  randomQuestions.value = response.questions || []
  totalInChapter.value = randomQuestions.value.length
  bankInfo.value = {
    bank_name: subjectName.value || '随机练习',
    total_questions: totalInChapter.value
  }

  await fetchPracticeSummary()

  if (!randomQuestions.value.length) {
    uni.showToast({ title: '暂无可用题目', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }

  currentQuestionNumber.value = Math.min(startQuestionNumber.value, totalInChapter.value || 1)
  await loadQuestion()
}

const initRealExam = async () => {
  console.log('📘 初始化真题练习', { paperId: paperId.value })

  chapters.value = []
  currentChapterIndex.value = 0
  currentChapter.value = null
  bankInfo.value = {
    bank_name: paperName.value || '真题练习',
    total_questions: 0
  }

  currentQuestionNumber.value = startQuestionNumber.value
  await loadQuestion()
}

// 加载题目（单题模式）
const loadQuestion = async () => {
  if (isRandomMode.value) {
    await loadRandomQuestion()
    return
  }
  if (isSpecialMode.value) {
    await loadSpecialQuestion()
    return
  }
  if (isRealMode.value) {
    await loadRealQuestion()
    return
  }
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

const loadSpecialQuestion = async () => {
  loading.value = true
  try {
    const response = await get(
      `/subjects/${subjectId.value}/chapters/${subjectChapterId.value}/questions`,
      { questionNumber: currentQuestionNumber.value },
      { showLoading: false }
    )

    if (response && response.question) {
      currentQuestion.value = response.question
      totalInChapter.value = response.total || 0
      hasNextQuestion.value = response.hasNext || false
      hasPrevQuestion.value = response.hasPrev || false

      const cacheKey = getAnswerKey()
      questionCache.value[cacheKey] = response.question
      showAnswer.value = false
    } else {
      uni.showToast({ title: '已是最后一题', icon: 'none' })
    }
  } catch (error) {
    console.error('❌ 加载专项题目失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadRandomQuestion = async () => {
  totalInChapter.value = randomQuestions.value.length
  const index = currentQuestionNumber.value - 1
  const question = randomQuestions.value[index]

  if (!question) {
    uni.showToast({ title: '已是最后一题', icon: 'none' })
    return
  }

  currentQuestion.value = question
  hasNextQuestion.value = index < randomQuestions.value.length - 1
  hasPrevQuestion.value = index > 0

  const cacheKey = getAnswerKey()
  questionCache.value[cacheKey] = question
  showAnswer.value = false
}

const loadRealQuestion = async () => {
  loading.value = true
  try {
    const response = await get(
      `/real-exams/${paperId.value}/questions`,
      { questionNumber: currentQuestionNumber.value },
      { showLoading: false }
    )

    if (response && response.question) {
      currentQuestion.value = response.question
      totalInChapter.value = response.total || 0
      bankInfo.value.total_questions = response.total || 0
      hasNextQuestion.value = response.hasNext || false
      hasPrevQuestion.value = response.hasPrev || false

      const cacheKey = getAnswerKey()
      questionCache.value[cacheKey] = response.question
      showAnswer.value = false
    } else {
      uni.showToast({ title: '已是最后一题', icon: 'none' })
    }
  } catch (error) {
    console.error('❌ 加载真题失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 检查是否可以切换到下一章节
const canSwitchToNextChapter = () => {
  if (!isBankMode.value) return false
  return currentChapterIndex.value < chapters.value.length - 1
}

// 检查是否可以切换到上一章节
const canSwitchToPrevChapter = () => {
  if (!isBankMode.value) return false
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
  const maxQuestions = practiceMode.value === 'full' ? totalInChapter.value : totalQuestions.value
  if (questionNumber >= 1 && questionNumber <= maxQuestions) {
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
  if (!isBankMode.value) return
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

          if (!isBankMode.value) {
            currentQuestionNumber.value = 1
            userAnswers.value = {}
            showAnswer.value = false
            questionCache.value = {}
            attemptSubmitted.value = false

            await loadQuestion()

            uni.hideLoading()
            uni.showToast({
              title: '已重新开始',
              icon: 'success'
            })
            return
          }

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
          attemptSubmitted.value = false

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

const saveSpecialProgress = async () => {
  if (!isSpecialMode.value || !subjectId.value || !subjectChapterId.value) return
  if (totalQuestions.value <= 0) return
  try {
    await post(
      `/subjects/${subjectId.value}/chapters/${subjectChapterId.value}/progress`,
      {
        current_question_number: currentQuestionNumber.value,
        completed_count: currentQuestionNumber.value,
        total_questions: totalQuestions.value
      },
      { showLoading: false }
    )
  } catch (error) {
    console.error('❌ 保存专项进度失败:', error)
  }
}

const buildWrongQuestions = () => {
  return Object.keys(userAnswers.value)
    .map((key) => {
      const userAns = userAnswers.value[key]
      if (checkAnswerByKey(key, userAns)) return null
      const cachedQuestion = questionCache.value[key]
      if (!cachedQuestion) return null
      return {
        question_id: cachedQuestion.id,
        selected_answer: userAns || null,
        correct_answer: formatAnswer(cachedQuestion.answer) || null
      }
    })
    .filter(Boolean)
}

const buildAttemptQuestionIds = () => {
  const ids = Object.keys(userAnswers.value)
    .map((key) => questionCache.value[key]?.id)
    .filter((id) => Number.isFinite(id))
  return Array.from(new Set(ids))
}

const getPracticeAttemptMode = () => {
  if (isRandomMode.value) return 'random'
  if (isSpecialMode.value) return 'special'
  if (isBankMode.value) return 'mock'
  return 'mock'
}

const getPracticeSourceType = () => {
  if (isRandomMode.value) return 'subject'
  if (isSpecialMode.value) return 'subject_chapter'
  if (practiceMode.value === 'chapter') return 'chapter'
  return 'bank'
}

const getPracticeSourceId = () => {
  if (isRandomMode.value) return subjectId.value
  if (isSpecialMode.value) return subjectChapterId.value
  if (practiceMode.value === 'chapter') return currentChapter.value?.id || 0
  return bankId.value
}

const fetchPracticeSummary = async () => {
  if (!isRandomMode.value || !subjectId.value) return
  try {
    const response = await get(
      '/practice/summary',
      { subjectId: subjectId.value, mode: 'random' },
      { showLoading: false }
    )
    practiceSummary.value = response.stats || {
      answered_count: 0,
      correct_count: 0,
      wrong_count: 0,
      accuracy: 0
    }
  } catch (error) {
    console.error('❌ 获取随机练习统计失败:', error)
  }
}

const submitPracticeAttempt = async () => {
  if (isRealMode.value || attemptSubmitted.value) return
  if (!subjectId.value) return

  const sourceId = getPracticeSourceId()
  if (!sourceId) return

  const questionIds = buildAttemptQuestionIds()
  if (!questionIds.length) return

  try {
    const payload = {
      subject_id: subjectId.value,
      mode: getPracticeAttemptMode(),
      source_type: getPracticeSourceType(),
      source_id: sourceId,
      total_questions: totalQuestions.value,
      correct_count: correctCount.value,
      wrong_count: wrongCount.value,
      accuracy: accuracy.value,
      question_source: 'question_bank',
      question_ids: questionIds,
      wrong_questions: buildWrongQuestions()
    }
    await post('/practice/attempts', payload, { showLoading: false })
    attemptSubmitted.value = true
  } catch (error) {
    console.error('❌ 提交练习统计失败:', error)
  }
}

const submitRealAttempt = async () => {
  if (!isRealMode.value || attemptSubmitted.value) return
  try {
    const payload = {
      total_questions: totalQuestions.value,
      correct_count: correctCount.value,
      wrong_count: wrongCount.value,
      accuracy: accuracy.value,
      wrong_questions: buildWrongQuestions()
    }
    await post(`/real-exams/${paperId.value}/attempts`, payload, { showLoading: false })
    attemptSubmitted.value = true
  } catch (error) {
    console.error('❌ 提交真题结果失败:', error)
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    })
  }
}

const goToWrongQuestions = () => {
  uni.navigateTo({
    url: `/pages/real-exam-wrong/real-exam-wrong?paperId=${paperId.value}&paperName=${encodeURIComponent(paperName.value)}`
  })
}

// 完成考试
const finishExam = async () => {
  // 保存最终进度
  if (isBankMode.value) {
    saveProgress()
  }
  if (isSpecialMode.value) {
    saveSpecialProgress()
  }

  const content = `已完成 ${answeredCount.value}/${totalQuestions.value} 题\n正确率：${accuracy.value}%`

  if (isRealMode.value) {
    await submitRealAttempt()
    uni.showModal({
      title: '完成练习',
      content,
      confirmText: '查看错题',
      cancelText: '返回',
      success: (res) => {
        if (res.confirm) {
          goToWrongQuestions()
        } else {
          uni.navigateBack()
        }
      }
    })
    return
  }

  await submitPracticeAttempt()

  uni.showModal({
    title: '完成练习',
    content,
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

// 处理图片点击事件（预览图片）
const handleImageClick = () => {
  if (currentImageUrls.value.length > 0) {
    uni.previewImage({
      urls: currentImageUrls.value,
      current: 0
    })
  }
}
</script>

<style lang="scss" scoped>
.exam-container {
  --primary: #3b82f6;
  --primary-strong: #2563eb;
  --accent: #f97316;
  --success: #22c55e;
  --danger: #ef4444;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --shadow-soft: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
  --shadow: 0 16rpx 30rpx rgba(15, 23, 42, 0.12);
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(120% 120% at 20% 0%, #eff6ff 0%, transparent 55%),
    radial-gradient(120% 120% at 100% 20%, #fff7ed 0%, transparent 45%),
    var(--bg);
  font-family: 'Poppins', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text);
}

.practice-summary {
  margin: 16rpx 20rpx 0;
}

.summary-card {
  background: var(--card);
  border-radius: 18rpx;
  padding: 22rpx 24rpx;
  display: flex;
  justify-content: space-between;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-number {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.summary-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--muted);
}

/* 顶部进度栏 */
.exam-header {
  background: var(--card);
  box-shadow: 0 2rpx 12rpx rgba(15, 23, 42, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid var(--border);
}

.header-content {
  padding: 0 20rpx;
}

.header-info {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.header-info .back-btn {
  margin-right: 20rpx;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e0e7ff;
  border-radius: 50%;
}

.stats-btn {
  width: 56rpx;
  height: 56rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dbeafe;
  border-radius: 50%;
  margin-left: 16rpx;
}

.exam-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.exam-title .title-text {
  margin-bottom: 4rpx;
}

.title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.subtitle-text {
  font-size: 24rpx;
  color: var(--muted);
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-container .progress-bar {
  margin-right: 16rpx;
}

.progress-container .progress-text {
  margin-right: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 8rpx;
  background: #e2e8f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-strong) 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 24rpx;
  color: var(--primary);
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
}

.loading-state .loading-icon {
  margin-bottom: 24rpx;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 题目内容包裹器 */
.question-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 可滚动的题目内容区域 - 使用view替代scroll-view */
.question-content {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  /* 隐藏滚动条 - 全平台兼容 */
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 隐藏 WebKit 内核浏览器的滚动条 */
.question-content::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

/* 题目卡片 */
.question-card {
  background: var(--card);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
  box-sizing: border-box;
  width: 100%;
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
  background: #dbeafe;
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
  color: var(--primary-strong);
}

.question-difficulty {
  display: flex;
}

.question-difficulty uni-icons {
  margin-right: 4rpx;
}

.question-difficulty uni-icons:last-child {
  margin-right: 0;
}

.question-number {
  margin-bottom: 16rpx;
}

.question-number text {
  font-size: 26rpx;
  color: var(--muted);
}

.question-text {
  font-size: 30rpx;
  line-height: 1.7;
  color: var(--text);
  margin-bottom: 16rpx;
  font-weight: 500;
}

/* Markdown 内容基础样式 */
.question-text ::v-deep p,
.explanation-text ::v-deep p {
  margin: 0 0 12rpx;
}

.question-text ::v-deep p:last-child,
.explanation-text ::v-deep p:last-child {
  margin-bottom: 0;
}

.question-text ::v-deep ul,
.question-text ::v-deep ol,
.explanation-text ::v-deep ul,
.explanation-text ::v-deep ol {
  padding-left: 32rpx;
  margin: 0 0 12rpx;
}

.question-text ::v-deep li,
.explanation-text ::v-deep li {
  margin-bottom: 6rpx;
}

.question-text ::v-deep .katex-display,
.explanation-text ::v-deep .katex-display {
  margin: 12rpx 0;
}

/* 题目内容中的图片样式 */
.question-text ::v-deep img,
.question-text ::v-deep image {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  border-radius: 12rpx;
  margin: 24rpx auto;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  display: block;
  background: #f5f7fa;
  border: 2rpx solid #e8eaed;
  transition: all 0.3s ease;
  object-fit: contain;
}

.question-text ::v-deep img:active,
.question-text ::v-deep image:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.question-tags {
  display: flex;
  flex-wrap: wrap;
  margin: -6rpx;
}

.question-tags .tag {
  margin: 6rpx;
}

.tag {
  padding: 6rpx 16rpx;
  background: #f1f5f9;
  border-radius: 8rpx;
}

.tag-text {
  font-size: 22rpx;
  color: var(--muted);
}

/* 选项列表 */
.options-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 20rpx;
  width: 100%;
  box-sizing: border-box;
}

.options-list .option-item {
  margin-bottom: 14rpx;
}

.options-list .option-item:last-child {
  margin-bottom: 0;
}

.option-item {
  background: var(--card);
  border: 2rpx solid var(--border);
  border-radius: 16rpx;
  padding: 20rpx 22rpx;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-soft);
  box-sizing: border-box;
  width: 100%;
}

.option-item.selected {
  border-color: var(--primary);
  background: #eff6ff;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.15);
}

.option-item.correct {
  border-color: var(--success);
  background: #ecfdf5;
  box-shadow: 0 4rpx 12rpx rgba(34, 197, 94, 0.12);
}

.option-item.wrong {
  border-color: var(--danger);
  background: #fef2f2;
  box-shadow: 0 4rpx 12rpx rgba(239, 68, 68, 0.12);
}

.option-item.disabled {
  pointer-events: none;
}

.option-label {
  width: 52rpx;
  height: 52rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.25);
  margin-right: 18rpx;
}

.option-item.correct .option-label {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.option-item.wrong .option-label {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.label-text {
  font-size: 28rpx;
  font-weight: 700;
  color: white;
}

.option-content {
  flex: 1;
  margin-right: 12rpx;
}

.option-text {
  font-size: 28rpx;
  line-height: 1.65;
  color: var(--text);
  font-weight: 400;
}

.option-icon {
  flex-shrink: 0;
}

.selected-dot {
  width: 16rpx;
  height: 16rpx;
  background: var(--primary);
  border-radius: 50%;
}

/* 答案解析 */
.answer-section {
  background: var(--card);
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
  box-sizing: border-box;
  width: 100%;
}

.answer-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid var(--border);
}

.answer-header uni-icons {
  margin-right: 10rpx;
}

.answer-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text);
}

.answer-content {
  display: flex;
  flex-direction: column;
}

.answer-content>view {
  margin-bottom: 16rpx;
}

.answer-content>view:last-child {
  margin-bottom: 0;
}

.answer-row {
  display: flex;
  align-items: center;
}

.answer-label {
  font-size: 26rpx;
  color: var(--muted);
  min-width: 150rpx;
}

.answer-value {
  font-size: 26rpx;
  font-weight: 600;
}

.answer-value.correct {
  color: var(--success);
}

.answer-value.wrong {
  color: var(--danger);
}

.explanation {
  background: #f8fafc;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-top: 6rpx;
}

.explanation-label {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--text);
  display: block;
  margin-bottom: 10rpx;
}

.explanation-text {
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--muted);
}

/* 解析内容中的图片样式 */
.explanation ::v-deep img,
.explanation ::v-deep image {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  border-radius: 10rpx;
  margin: 16rpx auto;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.08);
  display: block;
  background: #fafafa;
  border: 1rpx solid #e0e0e0;
  transition: all 0.3s ease;
  object-fit: contain;
}

.explanation ::v-deep img:active,
.explanation ::v-deep image:active {
  transform: scale(0.98);
  box-shadow: 0 1rpx 6rpx rgba(0, 0, 0, 0.06);
}

/* 操作按钮 - 固定在底部 */
.action-buttons {
  display: flex;
  padding: 12rpx 24rpx 24rpx;
  background: var(--card);
  box-shadow: 0 -2rpx 16rpx rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
  border-top: 1rpx solid var(--border);
}

.action-buttons .action-btn {
  margin-right: 10rpx;
}

.action-buttons .action-btn:last-child {
  margin-right: 0;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 14rpx;
  border-radius: 14rpx;
  font-size: 24rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.action-btn uni-icons {
  margin-right: 6rpx;
}

.action-btn .btn-text+uni-icons {
  margin-right: 0;
  margin-left: 6rpx;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: white;
}

.action-btn.secondary:disabled {
  background: #e2e8f0 !important;
  color: #94a3b8 !important;
  box-shadow: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: white;
  flex: 1.4;
}

.action-btn.finish {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.action-btn .btn-text {
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1;
}

/* 统计弹窗 */
.stats-popup {
  width: 640rpx;
  background: var(--card);
  border-radius: 24rpx;
  padding: 32rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow);
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
  color: var(--text);
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
}

.stats-content>view {
  margin-bottom: 32rpx;
}

.stats-content>view:last-child {
  margin-bottom: 0;
}

.stat-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .stat-number {
  margin-bottom: 8rpx;
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
}

.stat-number.primary {
  color: var(--primary);
}

.stat-number.success {
  color: var(--success);
}

.stat-number.danger {
  color: var(--danger);
}

.stat-label {
  font-size: 24rpx;
  color: var(--muted);
}

.accuracy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
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
  background: #f1f5f9;
  border-radius: 12rpx;
  text-align: center;
}

.note-text {
  font-size: 24rpx;
  color: var(--muted);
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-gap: 16rpx;
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
  border-color: var(--primary);
  background: #dbeafe;
}

.grid-item.answered {
  background: #e0e0e0;
}

.grid-item.correct {
  background: #dcfce7;
  color: var(--success);
}

.grid-item.wrong {
  background: #fee2e2;
  color: var(--danger);
}

.grid-number {
  font-size: 24rpx;
  font-weight: 600;
}

.popup-buttons {
  display: flex;
  margin-top: 16rpx;
}

.popup-buttons .popup-btn {
  margin-right: 16rpx;
}

.popup-buttons .popup-btn:last-child {
  margin-right: 0;
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
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: white;
}

.popup-btn.secondary {
  background: #f1f5f9;
  color: var(--text);
}
</style>
