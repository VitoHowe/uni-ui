<template>
  <view class="real-exam-list">
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

    <view class="paper-list">
      <view v-if="loading" class="loading-state">
        <uni-icons type="spinner-cycle" size="40" color="#3B82F6" class="loading-icon" />
        <text class="loading-text">正在加载试卷...</text>
      </view>

      <view v-else-if="papers.length === 0" class="empty-state">
        <uni-icons type="folder-add" size="80" color="#ddd" />
        <text class="empty-title">暂无真题</text>
        <text class="empty-desc">当前科目还没有真题试卷</text>
      </view>

      <view v-else class="paper-cards">
        <view class="paper-card" v-for="paper in papers" :key="paper.id" @click="startPaper(paper)">
          <view class="card-header">
            <text class="paper-name">{{ paper.name }}</text>
            <text class="paper-count">{{ paper.total_questions || 0 }} 题</text>
          </view>
          <text v-if="paper.description" class="paper-desc">{{ paper.description }}</text>
          <view class="card-footer">
            <text class="paper-date">{{ formatDate(paper.created_at) }}</text>
            <view class="start-btn">开始练习</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get } from '@/utils/request.js'
import { SubjectStorage, normalizeSubject } from '@/utils/subject.js'

const papers = ref([])
const loading = ref(false)
const subjects = ref([])
const selectedSubject = ref(SubjectStorage.get())
const loadingSubjects = ref(false)
const practiceStats = ref({
  answered_count: 0,
  correct_count: 0,
  wrong_count: 0,
  accuracy: 0
})

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

const ensureSubjectSelected = () => {
  if (selectedSubject.value) return true
  uni.showToast({
    title: '请先选择科目',
    icon: 'none'
  })
  return false
}

const fetchSubjects = async () => {
  if (loadingSubjects.value) return
  loadingSubjects.value = true
  try {
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
      { subjectId: selectedSubject.value.id, mode: 'real' },
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

const fetchPapers = async () => {
  if (!ensureSubjectSelected()) {
    papers.value = []
    return
  }
  loading.value = true
  try {
    const response = await get('/real-exams', {
      subjectId: selectedSubject.value.id,
      page: 1,
      limit: 20
    })
    papers.value = response.papers || []
  } catch (error) {
    console.error('获取真题失败:', error)
    uni.showToast({
      title: error.message || '获取真题失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
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
        await fetchPapers()
      }
    }
  })
}

const startPaper = (paper) => {
  const subjectId = selectedSubject.value?.id || 0
  const subjectName = selectedSubject.value?.name || ''
  const paperName = paper.name || ''
  uni.navigateTo({
    url: `/pages/exam/exam?mode=real&paperId=${paper.id}&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&paperName=${encodeURIComponent(paperName)}`
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

onShow(async () => {
  applySubjectFromRoute()
  const stored = SubjectStorage.get()
  if (stored) {
    selectedSubject.value = stored
  }
  await fetchSubjects()
  await fetchPracticeSummary()
  await fetchPapers()
})
</script>

<style lang="scss" scoped>
.real-exam-list {
  --primary: #3b82f6;
  --primary-strong: #2563eb;
  --accent: #f97316;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --shadow-soft: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
  --shadow: 0 18rpx 32rpx rgba(15, 23, 42, 0.12);
  padding: 20rpx;
  background: radial-gradient(120% 120% at 12% 0%, #eff6ff 0%, transparent 55%),
    radial-gradient(120% 120% at 100% 12%, #fff7ed 0%, transparent 45%),
    var(--bg);
  min-height: 100vh;
  font-family: 'Poppins', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text);
}

.subject-bar {
  background: var(--card);
  border-radius: 20rpx;
  padding: 26rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow);
  margin-bottom: 20rpx;
}

.practice-stats {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.stat-card {
  flex: 1;
  background: var(--card);
  border-radius: 18rpx;
  padding: 20rpx 12rpx;
  text-align: center;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}

.stat-number {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text);
}

.stat-label {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--muted);
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

.paper-list {
  margin-top: 10rpx;
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

.paper-card {
  background: var(--card);
  border-radius: 18rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.paper-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.paper-count {
  font-size: 24rpx;
  color: var(--primary);
  font-weight: 600;
}

.paper-desc {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--muted);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 18rpx;
}

.paper-date {
  font-size: 22rpx;
  color: var(--muted);
}

.start-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%);
  color: #fff;
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  box-shadow: 0 6rpx 16rpx rgba(59, 130, 246, 0.25);
}
</style>
