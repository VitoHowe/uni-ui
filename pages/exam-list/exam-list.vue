<template>
  <view class="exam-list-container">
    <!-- 顶部搜索栏 -->
    <view class="subject-bar" @click="openSubjectPicker">
      <view class="subject-info">
        <text class="subject-label">当前科目</text>
        <text class="subject-name">{{ selectedSubject?.name || '请选择科目' }}</text>
      </view>
      <view class="subject-action">
        <text class="subject-action-text">{{ subjects.length ? '切换' : '加载中' }}</text>
        <uni-icons type="arrowdown" size="16" color="#999" />
      </view>
    </view>

    <view class="search-section">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#999" />
        <input 
          class="search-input" 
          placeholder="搜索题库名称或文件名" 
          v-model="searchKeyword"
          @input="handleSearch"
        />
        <uni-icons 
          v-if="searchKeyword" 
          type="clear" 
          size="16" 
          color="#999" 
          @click="clearSearch"
        />
      </view>
      <view class="filter-btn" @click="showFilterPopup">
        <uni-icons type="funnel" size="18" color="#333" />
      </view>
    </view>

    <!-- 练习统计 -->
    <view class="practice-stats">
      <view class="stat-card">
        <text class="stat-number">{{ practiceStats.answered_count }}</text>
        <text class="stat-label">已作答</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ practiceStats.accuracy }}%</text>
        <text class="stat-label">正确率</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ practiceStats.wrong_count }}</text>
        <text class="stat-label">错题数</text>
      </view>
    </view>

    <!-- 数据统计卡片 -->
    <view class="stats-overview">
      <view class="stat-card">
        <text class="stat-number">{{ totalBanks }}</text>
        <text class="stat-label">题库总数</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ totalQuestions }}</text>
        <text class="stat-label">题目总数</text>
      </view>
      <view class="stat-card">
        <text class="stat-number">{{ todayAdded }}</text>
        <text class="stat-label">今日新增</text>
      </view>
    </view>

    <!-- 题库列表 -->
    <view class="bank-list">
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-state">
        <uni-icons type="spinner-cycle" size="40" color="#3B82F6" class="loading-icon" />
        <text class="loading-text">正在加载题库...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="filteredBankList.length === 0" class="empty-state">
        <uni-icons type="folder-add" size="80" color="#ddd" />
        <text class="empty-title">暂无题库</text>
        <text class="empty-desc">上传文件创建你的第一个题库吧</text>
        <button class="upload-btn" @click="goToUpload">
          <uni-icons type="plus" size="16" color="#fff" />
          <text>上传题库</text>
        </button>
      </view>

      <!-- 题库卡片列表 -->
      <view v-else class="bank-cards">
        <view 
          class="bank-card" 
          v-for="bank in filteredBankList" 
          :key="bank.id"
          @click="startExam(bank)"
        >
          <!-- 卡片头部 -->
          <view class="card-header">
            <view class="bank-icon">
              <uni-icons type="paperplane" size="24" color="#fff" />
            </view>
            <view class="bank-info">
              <text class="bank-name">{{ bank.bank_name }}</text>
              <text class="file-name">{{ bank.file_name }}</text>
            </view>
            <view class="more-btn" @click.stop="showMoreActions(bank)">
              <uni-icons type="more-filled" size="20" color="#999" />
            </view>
          </view>

          <!-- 卡片内容 -->
          <view class="card-content">
            <view class="content-item">
              <uni-icons type="compose" size="16" color="#666" />
              <text class="item-text">{{ bank.total_questions }} 道题目</text>
            </view>
            <view class="content-item">
              <uni-icons type="calendar" size="16" color="#666" />
              <text class="item-text">{{ formatDate(bank.created_at) }}</text>
            </view>
          </view>

          <!-- 题目类型分布 -->
          <view class="card-tags">
            <view 
              class="tag" 
              v-for="(type, index) in getQuestionTypes(bank)" 
              :key="index"
              :class="'tag-' + type.type"
            >
              <text class="tag-text">{{ type.label }}×{{ type.count }}</text>
            </view>
          </view>

          <!-- 学习进度显示 -->
          <view class="progress-section">
            <view class="progress-info">
              <text class="progress-label">学习进度</text>
              <text class="progress-value">{{ bank.progress || 0 }}%</text>
            </view>
            <view class="progress-bar-wrapper">
              <view class="progress-bar-bg">
                <view class="progress-bar-fill" :style="{width: (bank.progress || 0) + '%'}"></view>
              </view>
              <text class="progress-text">{{ getProgressText(bank) }}</text>
            </view>
            <view v-if="bank.completed_count > 0" class="completed-info">
              <text class="completed-text">✓ 已完成 {{ bank.completed_count }} 题</text>
            </view>
          </view>

          <!-- 卡片底部操作 -->
          <view class="card-footer">
            <view class="footer-btn primary" @click.stop="startExam(bank)">
              <uni-icons type="forward" size="16" color="#fff" />
              <text class="btn-text">{{ (bank.completed_count > 0) ? '继续学习' : '开始练习' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 筛选弹窗 -->
    <uni-popup ref="filterPopup" type="bottom">
      <view class="filter-content">
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <text class="filter-reset" @click="resetFilter">重置</text>
        </view>
        
        <view class="filter-section">
          <text class="section-title">排序方式</text>
          <view class="filter-options">
            <view 
              class="option-item" 
              v-for="sort in sortOptions" 
              :key="sort.value"
              :class="{active: currentSort === sort.value}"
              @click="selectSort(sort.value)"
            >
              <text class="option-text">{{ sort.label }}</text>
              <uni-icons v-if="currentSort === sort.value" type="checkmarkempty" size="18" color="#007AFF" />
            </view>
          </view>
        </view>

        <button class="confirm-btn" @click="applyFilter">确认</button>
      </view>
    </uni-popup>

    <!-- 更多操作弹窗 -->
    <uni-popup ref="actionPopup" type="bottom">
      <view class="action-content">
        <view class="action-item" @click="shareBank">
          <uni-icons type="redo" size="20" color="#333" />
          <text class="action-text">分享题库</text>
        </view>
        <view 
          v-if="selectedBank && selectedBank.completed_count > 0" 
          class="action-item danger" 
          @click="resetBankProgress"
        >
          <uni-icons type="refreshempty" size="20" color="#ff9500" />
          <text class="action-text warning">重置学习进度</text>
        </view>
        <view class="action-item cancel" @click="closeActionPopup">
          <text class="action-text">取消</text>
        </view>
      </view>
    </uni-popup>

    <!-- 练习模式选择弹窗 -->
    <uni-popup ref="modePopup" type="center">
      <view class="mode-popup">
        <view class="popup-header">
          <text class="popup-title">选择练习模式</text>
          <view class="close-btn" @click="modePopup.close()">
            <uni-icons type="closeempty" size="20" color="#999" />
          </view>
        </view>
        
        <view class="mode-options">
          <view class="mode-card" @click="startChapterPractice">
            <uni-icons type="list" size="40" color="#667eea" />
            <text class="mode-title">章节练习</text>
            <text class="mode-desc">选择特定章节进行练习</text>
          </view>
          
          <view class="mode-card" @click="startFullPractice">
            <uni-icons type="paperplane" size="40" color="#f5576c" />
            <text class="mode-title">整卷练习</text>
            <text class="mode-desc">按顺序练习所有章节</text>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 章节选择弹窗 -->
    <uni-popup ref="chapterSelectPopup" type="bottom">
      <view class="chapter-select-content">
        <view class="popup-header">
          <text class="popup-title">选择章节</text>
          <view class="close-btn" @click="chapterSelectPopup.close()">
            <uni-icons type="closeempty" size="20" color="#999" />
          </view>
        </view>
        
        <scroll-view class="chapter-list" scroll-y>
          <view 
            v-for="chapter in selectedBank?.chapters" 
            :key="chapter.id"
            class="chapter-item"
            @click="selectChapterAndStart(chapter)"
          >
            <view class="chapter-info">
              <text class="chapter-name">{{ chapter.chapter_name }}</text>
              <text class="chapter-count">{{ chapter.question_count }} 题</text>
            </view>
            
            <view class="chapter-progress">
              <text class="progress-percent">{{ getChapterProgressText(chapter) }}</text>
              <uni-icons type="forward" size="16" color="#999" />
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get, del } from '@/utils/request.js'
import { SubjectStorage, normalizeSubject } from '@/utils/subject.js'

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 题库列表
const bankList = ref([])

const subjects = ref([])
const selectedSubject = ref(SubjectStorage.get())
const loadingSubjects = ref(false)
const practiceStats = ref({
  answered_count: 0,
  correct_count: 0,
  wrong_count: 0,
  accuracy: 0
})

// 当前选中的题库
const selectedBank = ref(null)

// 排序选项
const sortOptions = [
  { label: '最新创建', value: 'created_desc' },
  { label: '最早创建', value: 'created_asc' },
  { label: '题目最多', value: 'questions_desc' },
  { label: '题目最少', value: 'questions_asc' }
]

// 当前排序
const currentSort = ref('created_desc')

// 弹窗引用
const filterPopup = ref(null)
const actionPopup = ref(null)
const modePopup = ref(null)
const chapterSelectPopup = ref(null)

const syncSelectedSubject = (subject) => {
  selectedSubject.value = subject
  SubjectStorage.set(subject)
}

const applySubjectFromRoute = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const subjectId = currentPage?.options?.subjectId
  const subjectName = currentPage?.options?.subjectName

  if (subjectId) {
    syncSelectedSubject({
      id: Number(subjectId),
      name: subjectName ? decodeURIComponent(subjectName) : `科目 ${subjectId}`,
      code: null
    })
  }
}

const fetchSubjects = async () => {
  if (loadingSubjects.value) return
  loadingSubjects.value = true
  try {
    if (!ensureSubjectSelected()) {
      loading.value = false
      return
    }

    const subjectId = selectedSubject.value?.id
    const data = await get('/subjects')
    const list = (data.subjects || []).map(normalizeSubject)
    subjects.value = list

    if (!selectedSubject.value && list.length) {
      syncSelectedSubject(list[0])
      return
    }

    if (selectedSubject.value) {
      const matched = list.find(item => item.id === selectedSubject.value.id)
      if (matched) {
        syncSelectedSubject(matched)
      } else if (list.length) {
        syncSelectedSubject(list[0])
      }
    }
  } catch (error) {
    console.error('获取科目失败:', error)
    uni.showToast({
      title: error.message || '获取科目失败',
      icon: 'none'
    })
  } finally {
    loadingSubjects.value = false
  }
}

const resetPracticeStats = () => {
  practiceStats.value = {
    answered_count: 0,
    correct_count: 0,
    wrong_count: 0,
    accuracy: 0
  }
}

const fetchPracticeSummary = async () => {
  if (!ensureSubjectSelected()) {
    resetPracticeStats()
    return
  }
  try {
    const response = await get(
      '/practice/summary',
      { subjectId: selectedSubject.value.id, mode: 'mock' },
      { showLoading: false }
    )
    practiceStats.value = response.stats || {
      answered_count: 0,
      correct_count: 0,
      wrong_count: 0,
      accuracy: 0
    }
  } catch (error) {
    console.error('获取练习统计失败:', error)
    resetPracticeStats()
  }
}

const openSubjectPicker = () => {
  if (loadingSubjects.value) return
  if (!subjects.value.length) {
    uni.showToast({
      title: '暂无可选科目',
      icon: 'none'
    })
    return
  }

  uni.showActionSheet({
    itemList: subjects.value.map(item => item.name),
    success: async (res) => {
      const subject = subjects.value[res.tapIndex]
      if (subject) {
        syncSelectedSubject(subject)
        await fetchPracticeSummary()
        await fetchBankList()
      }
    }
  })
}

const ensureSubjectSelected = () => {
  if (selectedSubject.value) return true
  uni.showToast({
    title: '请先选择科目',
    icon: 'none'
  })
  return false
}

// 统计数据
const totalBanks = computed(() => bankList.value.length)
const totalQuestions = computed(() => {
  return bankList.value.reduce((sum, bank) => sum + bank.total_questions, 0)
})
const todayAdded = computed(() => {
  const today = new Date().toDateString()
  return bankList.value.filter(bank => {
    const bankDate = new Date(bank.created_at).toDateString()
    return bankDate === today
  }).length
})

// 过滤后的题库列表
const filteredBankList = computed(() => {
  let list = [...bankList.value]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(bank => 
      bank.bank_name.toLowerCase().includes(keyword) ||
      bank.file_name.toLowerCase().includes(keyword)
    )
  }
  
  // 排序
  list.sort((a, b) => {
    switch (currentSort.value) {
      case 'created_desc':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'created_asc':
        return new Date(a.created_at) - new Date(b.created_at)
      case 'questions_desc':
        return b.total_questions - a.total_questions
      case 'questions_asc':
        return a.total_questions - b.total_questions
      default:
        return 0
    }
  })
  
  return list
})

// 页面显示时刷新题库列表（包括首次加载和从答题页返回）
const initPage = async () => {
  applySubjectFromRoute()
  const stored = SubjectStorage.get()
  if (stored) {
    selectedSubject.value = stored
  }

  await fetchSubjects()
  if (!selectedSubject.value) {
    bankList.value = []
    return
  }
  await fetchPracticeSummary()
  await fetchBankList()
}

onShow(() => {
  console.log('📱 题库列表页面显示，刷新数据...')
  initPage()
})

// 获取题库列表
const fetchBankList = async () => {
  loading.value = true
  try {
    if (!ensureSubjectSelected()) {
      loading.value = false
      return
    }
    const subjectId = selectedSubject.value?.id
    // 1. 获取题库列表（使用优化后的API，包含study_progress）
    const response = await get(`/subjects/${subjectId}/banks`, { page: 1, limit: 20 })
    const banks = response.banks || []
    
    // 映射字段名称并使用study_progress字段
    bankList.value = banks.map(bank => {
      const studyProgress = bank.study_progress || {}
      
      return {
        id: bank.id,
        bank_id: bank.id, // 向后兼容
        bank_name: bank.name,
        file_name: bank.file_original_name,
        total_questions: bank.question_count,
        created_at: bank.created_at,
        description: bank.description,
        creator_name: bank.creator_name,
        file_type: bank.file_type,
        file_size: bank.file_size,
        
        // 使用后端返回的study_progress字段
        totalChapters: studyProgress.total_chapters || 0,
        studiedChapters: studyProgress.studied_chapters || 0,
        progress: studyProgress.progress_percentage || 0,
        completed_count: studyProgress.completed_questions || 0,
        last_study_time: studyProgress.last_study_time || null,
        
        // 章节信息和详细进度将在需要时按需加载
        chapters: [],
        chapterProgress: null, // 标记为未加载
        current_chapter_id: null,
        current_question_number: 0
      }
    })
    
    console.log('✅ 题库列表加载完成，已使用study_progress优化接口调用')
  } catch (error) {
    console.error('获取题库列表失败:', error)
    uni.showToast({
      title: error.message || '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 获取题目类型统计
const getQuestionTypes = (bank) => {
  if (!bank.questions || bank.questions.length === 0) {
    return []
  }
  
  const typeMap = {
    'single': { label: '单选', count: 0, type: 'single' },
    'multiple': { label: '多选', count: 0, type: 'multiple' },
    'judge': { label: '判断', count: 0, type: 'judge' },
    'fill': { label: '填空', count: 0, type: 'fill' }
  }
  
  bank.questions.forEach(q => {
    if (typeMap[q.type]) {
      typeMap[q.type].count++
    }
  })
  
  return Object.values(typeMap).filter(type => type.count > 0)
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
}

// 显示筛选弹窗
const showFilterPopup = () => {
  filterPopup.value.open()
}

// 选择排序
const selectSort = (value) => {
  currentSort.value = value
}

// 重置筛选
const resetFilter = () => {
  currentSort.value = 'created_desc'
}

// 应用筛选
const applyFilter = () => {
  filterPopup.value.close()
}

// 获取进度显示文本
const getProgressText = (bank) => {
  if (!bank.last_study_time || bank.completed_count === 0) {
    return '尚未开始'
  }
  
  return `已学习 ${bank.studiedChapters}/${bank.totalChapters} 章节`
}

// 开始考试 - 显示模式选择（按需加载章节列表）
const startExam = async (bank) => {
  selectedBank.value = bank
  
  // 如果尚未加载章节列表，则加载
  if (!bank.chapters || bank.chapters.length === 0) {
    try {
      uni.showLoading({ title: '加载章节信息...' })
      const chaptersData = await get(`/question-banks/${bank.id}/chapters`)
      bank.chapters = chaptersData.chapters || []
      uni.hideLoading()
      
      if (bank.chapters.length === 0) {
        uni.showToast({
          title: '该题库暂无章节',
          icon: 'none'
        })
        return
      }
    } catch (error) {
      uni.hideLoading()
      console.error(`获取题库${bank.id}章节失败:`, error)
      uni.showToast({
        title: '加载章节失败',
        icon: 'none'
      })
      return
    }
  }
  
  modePopup.value.open()
}

// 开始章节练习（按需加载章节进度）
const startChapterPractice = async () => {
  modePopup.value.close()
  
  const bank = selectedBank.value
  
  // 如果尚未加载章节进度，则加载
  if (bank.chapterProgress === null) {
    try {
      uni.showLoading({ title: '加载章节进度...' })
      const progressData = await get(`/user-progress/${bank.id}/chapters`)
      bank.chapterProgress = progressData || []
      uni.hideLoading()
    } catch (error) {
      uni.hideLoading()
      console.error(`获取题库${bank.id}章节进度失败:`, error)
      bank.chapterProgress = []
    }
  }
  
  chapterSelectPopup.value.open()
}

// 开始整卷练习（查询整卷练习进度）
const startFullPractice = async () => {
  modePopup.value.close()
  
  const bank = selectedBank.value
  let startChapterId = bank.chapters[0]?.id
  let startQuestionNumber = 1
  
  try {
    // 查询整卷练习进度
    uni.showLoading({ title: '加载进度...' })
    const fullProgress = await get(`/user-progress/${bank.id}/full`)
    uni.hideLoading()
    
    // 如果有整卷练习进度，询问是否继续
    if (fullProgress && fullProgress.current_question_number > 0) {
      const chapterName = getChapterName(bank, fullProgress.current_chapter_id)
      
      uni.showModal({
        title: '继续练习',
        content: `上次学习到「${chapterName}」第${fullProgress.current_question_number}题\n整体进度：${Math.round((fullProgress.completed_count / bank.total_questions) * 100)}%\n\n是否继续？`,
        confirmText: '继续',
        cancelText: '从头开始',
        success: (res) => {
          if (res.confirm) {
            startChapterId = fullProgress.current_chapter_id
            startQuestionNumber = fullProgress.current_question_number
          }
          navigateToExam('full', startChapterId, startQuestionNumber)
        }
      })
      return
    }
  } catch (error) {
    uni.hideLoading()
    console.error(`获取整卷练习进度失败:`, error)
    // 如果接口返回404或其他错误，说明没有进度，继续从头开始
  }
  
  // 没有整卷练习进度，直接从第一章开始
  navigateToExam('full', startChapterId, startQuestionNumber)
}

// 选择章节后开始
const selectChapterAndStart = (chapter) => {
  chapterSelectPopup.value.close()
  
  const bank = selectedBank.value
  const chapterProgress = bank.chapterProgress?.find(cp => cp.chapter_id === chapter.id)
  
  let startQuestionNumber = 1
  
  if (chapterProgress && chapterProgress.current_question_number > 0) {
    uni.showModal({
      title: '继续练习',
      content: `「${chapter.chapter_name}」\n\n上次学习到第${chapterProgress.current_question_number}题\n进度：${chapterProgress.progress_percentage}%\n\n是否继续？`,
      confirmText: '继续',
      cancelText: '从头开始',
      success: (res) => {
        if (res.confirm) {
          startQuestionNumber = chapterProgress.current_question_number
        }
        navigateToExam('chapter', chapter.id, startQuestionNumber)
      }
    })
  } else {
    navigateToExam('chapter', chapter.id, startQuestionNumber)
  }
}

// 跳转到答题页
const navigateToExam = (mode, chapterId, questionNumber = 1) => {
  const bank = selectedBank.value
  const subjectId = selectedSubject.value?.id
  const subjectParam = subjectId ? `&subjectId=${subjectId}` : ''
  uni.navigateTo({
    url: `/pages/exam/exam?bankId=${bank.id}&mode=${mode}&chapterId=${chapterId}&questionNumber=${questionNumber}${subjectParam}`
  })
}

// 获取章节名称
const getChapterName = (bank, chapterId) => {
  const chapter = bank.chapters?.find(c => c.id === chapterId)
  return chapter ? chapter.chapter_name : ''
}

// 获取章节进度文本
const getChapterProgressText = (chapter) => {
  if (!selectedBank.value) return '未开始'
  
  const progress = selectedBank.value.chapterProgress?.find(cp => cp.chapter_id === chapter.id)
  
  if (!progress || progress.current_question_number === 0) {
    return '未开始'
  }
  
  return `${progress.progress_percentage}%`
}

// 显示更多操作
const showMoreActions = (bank) => {
  selectedBank.value = bank
  actionPopup.value.open()
}

// 关闭操作弹窗
const closeActionPopup = () => {
  actionPopup.value.close()
}

// 分享题库
const shareBank = () => {
  actionPopup.value.close()
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
  })
}

// 重置题库学习进度
const resetBankProgress = () => {
  if (!selectedBank.value) return
  
  const bank = selectedBank.value
  actionPopup.value.close()
  
  uni.showModal({
    title: '重置学习进度',
    content: `确定要重置「${bank.bank_name}」的所有章节学习进度吗？\n\n当前整体进度：${bank.progress}%\n已完成：${bank.completed_count} 题\n\n重置后将从第一题重新开始，此操作不可恢复。`,
    confirmText: '重置',
    confirmColor: '#ff9500',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '重置中...' })
          
          // 删除该题库所有章节的进度
          await del(`/user-progress/${bank.id}`)
          
          // 刷新列表
          await fetchBankList()
          
          uni.hideLoading()
          uni.showToast({
            title: '重置成功',
            icon: 'success',
            duration: 2000
          })
          
          console.log(`🔄 题库 ${bank.bank_name} 学习进度已重置`)
        } catch (error) {
          uni.hideLoading()
          console.error('重置进度失败:', error)
          uni.showToast({
            title: error.message || '重置失败',
            icon: 'none',
            duration: 2000
          })
        }
      }
    }
  })
}

// 跳转到上传页面
const goToUpload = () => {
  uni.navigateTo({
    url: '/pages/upload/upload'
  })
}
</script>

<style lang="scss" scoped>
.exam-list-container {
  --primary: #3b82f6;
  --primary-strong: #2563eb;
  --accent: #f97316;
  --success: #22c55e;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --shadow-soft: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
  --shadow: 0 18rpx 34rpx rgba(15, 23, 42, 0.12);
  min-height: 100vh;
  background: radial-gradient(120% 120% at 10% 0%, #eff6ff 0%, transparent 55%),
    radial-gradient(120% 120% at 100% 10%, #fff7ed 0%, transparent 50%),
    var(--bg);
  padding-bottom: 40rpx;
  font-family: 'Poppins', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text);
}

.subject-bar {
  margin: 20rpx;
  padding: 26rpx 30rpx;
  background: var(--card);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow);
}

.subject-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.subject-label {
  font-size: 24rpx;
  color: var(--muted);
}

.subject-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.subject-action {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.subject-action-text {
  font-size: 24rpx;
  color: var(--primary);
  font-weight: 600;
}

/* 搜索栏 */
.search-section {
  display: flex;
  align-items: center;
  padding: 0 20rpx 20rpx;
  background: transparent;
  gap: 16rpx;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--card);
  border-radius: 999rpx;
  padding: 16rpx 24rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
  gap: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--text);
}

.filter-btn {
  width: 72rpx;
  height: 72rpx;
  background: var(--card);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}

/* 练习统计 */
.practice-stats {
  display: flex;
  gap: 16rpx;
  padding: 0 20rpx 10rpx;
}

.practice-stats .stat-card {
  background: var(--card);
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
  padding: 22rpx 12rpx;
}

.practice-stats .stat-number {
  font-size: 34rpx;
  color: var(--text);
}

.practice-stats .stat-label {
  color: var(--muted);
}

/* 统计卡片 */
.stats-overview {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  padding: 32rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10rpx 24rpx rgba(59, 130, 246, 0.25);
}

.stat-card:nth-child(2) {
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
}

.stat-card:nth-child(3) {
  background: linear-gradient(135deg, #22c55e 0%, #86efac 100%);
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  color: white;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 题库列表 */
.bank-list {
  padding: 0 20rpx;
}

/* 加载状态 */
.loading-state {
  padding: 120rpx 0;
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

/* 空状态 */
.empty-state {
  padding: 120rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-top: 32rpx;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 48rpx;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: white;
  border: none;
  padding: 24rpx 48rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
}

/* 题库卡片 */
.bank-cards {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.bank-card {
  background: var(--card);
  border-radius: 20rpx;
  padding: 32rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bank-card:active {
  transform: scale(0.98);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.bank-icon {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.bank-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.bank-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}

.file-name {
  font-size: 24rpx;
  color: var(--muted);
}

.more-btn {
  padding: 8rpx;
}

/* 卡片内容 */
.card-content {
  display: flex;
  gap: 32rpx;
  margin-bottom: 20rpx;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.item-text {
  font-size: 26rpx;
  color: var(--muted);
}

/* 标签 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  background: #f0f0f0;
}

.tag-single {
  background: #e3f2fd;
}

.tag-multiple {
  background: #fff3e0;
}

.tag-judge {
  background: #e8f5e9;
}

.tag-fill {
  background: #fce4ec;
}

.tag-text {
  font-size: 22rpx;
  color: var(--muted);
}

/* 学习进度区域 */
.progress-section {
  padding: 24rpx 0;
  border-top: 1rpx solid #f0f0f0;
  margin-top: 20rpx;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.progress-label {
  font-size: 26rpx;
  color: var(--muted);
}

.progress-value {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--primary-strong);
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar-bg {
  flex: 1;
  height: 12rpx;
  background: #e2e8f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-strong) 100%);
  border-radius: 6rpx;
  transition: width 0.3s ease;
  min-width: 2%;
}

.progress-text {
  font-size: 22rpx;
  color: #999;
  white-space: nowrap;
}

.completed-info {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
}

.completed-text {
  font-size: 22rpx;
  color: var(--success);
}

/* 卡片底部 */
.card-footer {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.footer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: white;
}

.footer-btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  border: none;
}

.footer-btn .btn-text {
  font-size: 28rpx;
  color: white;
}

/* 筛选弹窗 */
.filter-content {
  background: white;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.filter-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.filter-reset {
  font-size: 28rpx;
  color: var(--primary);
}

.filter-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
}

.option-item.active {
  background: #dbeafe;
}

.option-text {
  font-size: 28rpx;
  color: #333;
}

.confirm-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: white;
  border: none;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
}

/* 操作弹窗 */
.action-content {
  background: white;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.action-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.action-item.cancel {
  justify-content: center;
  border-bottom: none;
  margin-top: 8rpx;
}

.action-item.cancel .action-text {
  color: #666;
}

.action-item.danger .action-text.warning {
  color: #ff9500;
  font-weight: 500;
}

.action-text {
  font-size: 30rpx;
  color: #333;
}

/* 练习模式选择弹窗 */
.mode-popup {
  width: 600rpx;
  background: white;
  border-radius: 24rpx;
  padding: 32rpx;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 24rpx;
}

.mode-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 16rpx;
  border: 2rpx solid var(--border);
  transition: all 0.3s ease;
}

.mode-card:active {
  transform: scale(0.98);
  border-color: var(--primary);
}

.mode-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-top: 16rpx;
}

.mode-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

/* 章节选择弹窗 */
.chapter-select-content {
  background: white;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.chapter-list {
  flex: 1;
  margin-top: 24rpx;
  max-height: 600rpx;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 24rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  transition: all 0.3s ease;
}

.chapter-item:active {
  transform: scale(0.98);
  background: #e3f2fd;
}

.chapter-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.chapter-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.chapter-count {
  font-size: 24rpx;
  color: #999;
}

.chapter-progress {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.progress-percent {
  font-size: 26rpx;
  color: #667eea;
  font-weight: 600;
}
</style>

