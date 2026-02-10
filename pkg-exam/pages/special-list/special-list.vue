<template>
  <view class="special-list">
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

    <view class="chapter-list">
      <view v-if="loading" class="loading-state">
        <uni-icons type="spinner-cycle" size="40" color="#3B82F6" class="loading-icon" />
        <text class="loading-text">正在加载章节...</text>
      </view>

      <view v-else-if="chapters.length === 0" class="empty-state">
        <uni-icons type="folder-add" size="80" color="#ddd" />
        <text class="empty-title">暂无章节</text>
        <text class="empty-desc">当前科目还没有章节数据</text>
      </view>

      <view v-else class="chapter-cards">
        <view class="chapter-card" v-for="chapter in chapters" :key="chapter.id" @click="startChapter(chapter)">
          <view class="card-header">
            <text class="chapter-name">{{ getChapterName(chapter) }}</text>
            <text class="chapter-count">{{ chapter.question_count || 0 }} 题</text>
          </view>
          <view class="progress-row">
            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: `${getChapterProgress(chapter.id)}%` }"></view>
            </view>
            <text class="progress-text">{{ getChapterProgress(chapter.id) }}%</text>
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
import { SubjectStorage, normalizeSubject } from '@/pkg-exam/utils/subject.js'

const chapters = ref([])
const loading = ref(false)
const subjects = ref([])
const selectedSubject = ref(SubjectStorage.get())
const loadingSubjects = ref(false)
const progressMap = ref({})
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

const fetchProgress = async () => {
  if (!ensureSubjectSelected()) {
    progressMap.value = {}
    return
  }
  try {
    const response = await get(`/subjects/${selectedSubject.value.id}/chapters/progress`, {}, { showLoading: false })
    const list = Array.isArray(response) ? response : (response.progress || [])
    const nextMap = {}
    list.forEach(item => {
      if (!item) return
      const percent = item.progress_percentage !== undefined
        ? Number(item.progress_percentage)
        : item.total_questions > 0
          ? Math.round((item.completed_count / item.total_questions) * 100)
          : 0
      nextMap[item.subject_chapter_id] = percent
    })
    progressMap.value = nextMap
  } catch (error) {
    console.error('获取专项进度失败:', error)
  }
}

const getChapterProgress = (chapterId) => {
  const value = progressMap.value?.[chapterId] || 0
  return Math.min(Math.max(Number(value), 0), 100)
}

const getChapterName = (chapter) => {
  return chapter.display_name || chapter.chapter_name || `章节 ${chapter.id}`
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
      { subjectId: selectedSubject.value.id, mode: 'special' },
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

const fetchChapters = async () => {
  if (!ensureSubjectSelected()) {
    chapters.value = []
    return
  }
  loading.value = true
  try {
    const response = await get(`/subjects/${selectedSubject.value.id}/chapters`)
    chapters.value = response.chapters || []
    await fetchProgress()
  } catch (error) {
    console.error('获取章节失败:', error)
    uni.showToast({
      title: error.message || '获取章节失败',
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
        await fetchChapters()
      }
    }
  })
}

const startChapter = (chapter) => {
  const subjectId = selectedSubject.value?.id || 0
  const subjectName = selectedSubject.value?.name || ''
  const chapterName = getChapterName(chapter)
  uni.navigateTo({
    url: `/pkg-exam/pages/exam/exam?mode=special&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}&subjectChapterId=${chapter.id}&chapterName=${encodeURIComponent(chapterName)}`
  })
}

onShow(async () => {
  applySubjectFromRoute()
  const stored = SubjectStorage.get()
  if (stored) {
    selectedSubject.value = stored
  }
  await fetchSubjects()
  await fetchPracticeSummary()
  await fetchChapters()
})
</script>

<style lang="scss" scoped>
.special-list {
  --primary: #3b82f6;
  --primary-strong: #2563eb;
  --accent: #f97316;
  --success: #22c55e;
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

.chapter-card {
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

.chapter-name {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text);
}

.chapter-count {
  font-size: 24rpx;
  color: var(--primary);
  font-weight: 600;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background: #e2e8f0;
  border-radius: 999rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-strong) 100%);
}

.progress-text {
  font-size: 24rpx;
  color: var(--text);
  min-width: 70rpx;
  text-align: right;
}
</style>
