<template>
  <view class="wrong-set">
    <view class="subject-bar">
      <view class="subject-info">
        <text class="subject-label">当前科目</text>
        <text class="subject-name">{{ subject?.name || '未选择科目' }}</text>
      </view>
    </view>

    <view class="filter-bar">
      <view
        v-for="item in modeOptions"
        :key="item.value"
        class="filter-item"
        :class="{ active: modeFilter === item.value }"
        @click="selectMode(item.value)"
      >
        <text class="filter-text">{{ item.label }}</text>
      </view>
    </view>

    <view v-if="loading" class="loading-state">
      <uni-icons type="spinner-cycle" size="40" color="#dc3545" class="loading-icon" />
      <text class="loading-text">正在加载错题...</text>
    </view>

    <view v-else-if="wrongQuestions.length === 0" class="empty-state">
      <uni-icons type="checkmarkempty" size="80" color="#ddd" />
      <text class="empty-title">暂无错题</text>
      <text class="empty-desc">继续加油，保持正确率</text>
    </view>

    <view v-else class="wrong-cards">
      <view class="wrong-card" v-for="item in wrongQuestions" :key="item.id">
        <view class="card-header">
          <text class="mode-tag">{{ modeLabel(item.mode) }}</text>
          <text class="source-name">{{ item.source_name || '未知来源' }}</text>
        </view>
        <text class="question-content">{{ getContentPreview(item.content) }}</text>
        <view class="card-meta">
          <text class="meta-text">错题次数 {{ item.wrong_times || 0 }}</text>
          <text class="meta-text">连续答对 {{ item.correct_streak || 0 }}</text>
        </view>
        <view class="card-actions">
          <button class="remove-btn" @click="removeWrong(item)">移除</button>
        </view>
      </view>
    </view>

    <view v-if="hasMore && wrongQuestions.length > 0" class="load-more">
      <button class="load-more-btn" @click="loadMore">加载更多</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get, del } from '@/utils/request.js'
import { SubjectStorage } from '@/pkg-exam/utils/subject.js'

const subject = ref(SubjectStorage.get())
const wrongQuestions = ref([])
const loading = ref(false)
const page = ref(1)
const limit = 20
const hasMore = ref(true)
const modeFilter = ref('all')

const modeOptions = [
  { label: '全部', value: 'all' },
  { label: '真题', value: 'real' },
  { label: '模拟', value: 'mock' },
  { label: '专项', value: 'special' },
  { label: '随机', value: 'random' }
]

const modeLabel = (mode) => {
  const map = {
    real: '真题',
    mock: '模拟',
    special: '专项',
    random: '随机'
  }
  return map[mode] || '未知'
}

const applySubjectFromRoute = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const subjectId = currentPage?.options?.subjectId
  const subjectName = currentPage?.options?.subjectName
  if (subjectId) {
    subject.value = {
      id: Number(subjectId),
      name: subjectName ? decodeURIComponent(subjectName) : `科目 ${subjectId}`,
      code: null
    }
    SubjectStorage.set(subject.value)
  }
}

const buildQuery = () => {
  const params = {
    subjectId: subject.value?.id || 0,
    page: page.value,
    limit
  }
  if (modeFilter.value !== 'all') {
    params.mode = modeFilter.value
  }
  return params
}

const fetchWrongQuestions = async (reset = false) => {
  if (!subject.value?.id) return
  if (loading.value) return
  if (!hasMore.value && !reset) return

  if (reset) {
    page.value = 1
    wrongQuestions.value = []
    hasMore.value = true
  }

  loading.value = true
  try {
    const response = await get('/practice/wrong-questions', buildQuery(), { showLoading: false })
    const items = response.items || []
    wrongQuestions.value = reset ? items : wrongQuestions.value.concat(items)
    const total = response.total || 0
    hasMore.value = wrongQuestions.value.length < total
    page.value += 1
  } catch (error) {
    console.error('获取错题集失败:', error)
  } finally {
    loading.value = false
  }
}

const selectMode = async (mode) => {
  if (modeFilter.value === mode) return
  modeFilter.value = mode
  await fetchWrongQuestions(true)
}

const loadMore = async () => {
  await fetchWrongQuestions(false)
}

const removeWrong = (item) => {
  uni.showModal({
    title: '移除错题',
    content: '确定要移除此错题吗？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await del(`/practice/wrong-questions/${item.id}`, { showLoading: false })
        wrongQuestions.value = wrongQuestions.value.filter(q => q.id !== item.id)
      } catch (error) {
        console.error('移除错题失败:', error)
        uni.showToast({
          title: error.message || '移除失败',
          icon: 'none'
        })
      }
    }
  })
}

const getContentPreview = (content) => {
  if (!content) return ''
  const text = String(content).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > 80 ? `${text.slice(0, 80)}...` : text
}

onShow(async () => {
  applySubjectFromRoute()
  await fetchWrongQuestions(true)
})
</script>

<style lang="scss" scoped>
.wrong-set {
  --primary: #3b82f6;
  --primary-strong: #2563eb;
  --accent: #f97316;
  --danger: #ef4444;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --shadow-soft: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
  --shadow: 0 18rpx 32rpx rgba(15, 23, 42, 0.12);
  padding: 20rpx;
  background: radial-gradient(120% 120% at 10% 0%, #eff6ff 0%, transparent 55%),
    radial-gradient(120% 120% at 100% 10%, #fff7ed 0%, transparent 45%),
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
  margin-bottom: 16rpx;
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

.filter-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.filter-item {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: var(--card);
  color: var(--muted);
  font-size: 24rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}

.filter-item.active {
  background: var(--primary);
  color: #fff;
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

.wrong-cards {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.wrong-card {
  background: var(--card);
  border-radius: 18rpx;
  padding: 24rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.mode-tag {
  font-size: 22rpx;
  color: var(--danger);
  background: rgba(239, 68, 68, 0.12);
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
}

.source-name {
  font-size: 22rpx;
  color: var(--muted);
}

.question-content {
  font-size: 26rpx;
  color: var(--text);
  line-height: 1.6;
}

.card-meta {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}

.meta-text {
  font-size: 22rpx;
  color: var(--muted);
}

.card-actions {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-end;
}

.remove-btn {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 999rpx;
}

.load-more {
  margin: 20rpx 0;
  display: flex;
  justify-content: center;
}

.load-more-btn {
  background: var(--card);
  color: var(--muted);
  font-size: 24rpx;
  padding: 12rpx 32rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow-soft);
}
</style>
