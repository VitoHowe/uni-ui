<template>
  <view class="question-container">
    <!-- 科目选择 -->
    <view class="subject-section">
      <view class="subject-card" @click="openSubjectPicker">
        <view class="subject-info">
          <text class="subject-label">当前科目</text>
          <text class="subject-name">{{ selectedSubject?.name || '请选择科目' }}</text>
        </view>
        <view class="subject-action">
          <text class="subject-action-text">{{ subjects.length ? '切换' : '加载中' }}</text>
          <uni-icons type="arrowdown" size="16" color="#999" />
        </view>
      </view>
    </view>

    <!-- 练习模式 -->
    <view class="practice-modes">
      <uni-section title="练习模式" type="line" padding>
        <view class="mode-list">
          <view 
            class="mode-item" 
            v-for="(mode, index) in practiceModes" 
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

    <!-- 错题集入口 -->
    <view class="wrong-questions">
      <uni-section title="错题集" type="line" padding>
        <view class="wrong-header">
          <text class="wrong-count">共 {{ wrongSetCount }} 道错题</text>
          <text class="clear-btn" @click="openWrongSet">查看</text>
        </view>
        <view class="wrong-entry" @click="openWrongSet">
          <view class="wrong-entry-left">
            <uni-icons type="closeempty" size="20" color="#dc3545" />
            <text class="wrong-entry-text">进入错题集</text>
          </view>
          <uni-icons type="arrowright" size="16" color="#ccc" />
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
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from "@/components/CustomTabBar.vue"
import { get } from '@/utils/request.js'
import { SubjectStorage, normalizeSubject } from '@/utils/subject.js'

// 练习模式数据
const practiceModes = reactive([
  {
    key: 'real',
    name: '真题练习',
    description: '历年考试真题，贴近实际考试',
    icon: 'fire',
    color: '#EF4444',
    count: 0
  },
  {
    key: 'mock',
    name: '模拟考试',
    description: '完整模拟考试，检验学习成果',
    icon: 'calendar',
    color: '#3B82F6',
    count: 0
  },
  {
    key: 'special',
    name: '专项训练',
    description: '针对性练习，突破薄弱环节',
    icon: 'gear',
    color: '#10B981',
    count: 0
  },
  {
    key: 'random',
    name: '随机练习',
    description: '随机抽取题目，全面复习',
    icon: 'loop',
    color: '#F59E0B',
    count: 0
  }
])

const subjects = ref([])
const selectedSubject = ref(SubjectStorage.get())
const loadingSubjects = ref(false)
const wrongSetCount = ref(0)
const loadingSummary = ref(false)

const syncSelectedSubject = (subject) => {
  selectedSubject.value = subject
  SubjectStorage.set(subject)
}

const applyModeCounts = (counts) => {
  practiceModes.forEach((mode) => {
    if (counts && counts[mode.key] !== undefined) {
      mode.count = Number(counts[mode.key]) || 0
    }
  })
}

const fetchPracticeSummary = async () => {
  if (!selectedSubject.value || loadingSummary.value) return
  loadingSummary.value = true
  try {
    const data = await get('/practice/summary', { subjectId: selectedSubject.value.id }, { showLoading: false })
    const modeCounts = data.mode_counts || {}
    applyModeCounts(modeCounts)
    wrongSetCount.value = Number(data.wrong_set_count || 0)
  } catch (error) {
    console.error('获取练习统计失败:', error)
  } finally {
    loadingSummary.value = false
  }
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

    await fetchPracticeSummary()
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
    success: (res) => {
      const subject = subjects.value[res.tapIndex]
      if (subject) {
        syncSelectedSubject(subject)
        fetchPracticeSummary()
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
  openSubjectPicker()
  return false
}

const openWrongSet = () => {
  if (!ensureSubjectSelected()) return
  const subjectId = selectedSubject.value?.id || 0
  const subjectName = selectedSubject.value?.name || ''
  uni.navigateTo({
    url: `/pages/wrong-set/wrong-set?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
  })
}

onShow(() => {
  const stored = SubjectStorage.get()
  if (stored) {
    selectedSubject.value = stored
  }
  fetchSubjects()
})

// 浮动按钮配置
const fabPattern = reactive({
  color: '#3B82F6',
  backgroundColor: '#fff',
  selectedColor: '#2563EB'
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
  if (!ensureSubjectSelected()) return

  const subjectId = selectedSubject.value?.id
  const subjectName = selectedSubject.value?.name || ''

  switch (mode.key) {
    case 'mock':
      uni.navigateTo({
        url: `/pages/exam-list/exam-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
      })
      return
    case 'real':
      uni.navigateTo({
        url: `/pages/real-exam-list/real-exam-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
      })
      return
    case 'special':
      uni.navigateTo({
        url: `/pages/special-list/special-list?subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
      })
      return
    case 'random':
      uni.navigateTo({
        url: `/pages/exam/exam?mode=random&subjectId=${subjectId}&subjectName=${encodeURIComponent(subjectName)}`
      })
      return
    default:
      uni.showToast({
        title: `开始${mode.name}`,
        icon: 'none'
      })
  }
}

// 浮动按钮点击
const fabClick = (e) => {
  if (!ensureSubjectSelected()) return

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
  --primary: #3b82f6;
  --primary-strong: #2563eb;
  --accent: #f97316;
  --bg: #f8fafc;
  --card: #ffffff;
  --text: #0f172a;
  --muted: #64748b;
  --border: #e2e8f0;
  --shadow-soft: 0 10rpx 24rpx rgba(15, 23, 42, 0.08);
  --shadow: 0 16rpx 32rpx rgba(15, 23, 42, 0.12);
  padding: 0 0 120rpx 0; /* 底部留出导航栏空间 */
  background: radial-gradient(120% 120% at 20% 0%, #eff6ff 0%, transparent 50%),
    radial-gradient(120% 120% at 100% 20%, #fff7ed 0%, transparent 45%),
    var(--bg);
  min-height: 100vh;
  font-family: 'Poppins', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text);
}

.subject-section {
  margin: 0 20rpx 20rpx;
}

.subject-card {
  background: linear-gradient(135deg, #ffffff 0%, #f1f5ff 100%);
  border-radius: 20rpx;
  padding: 26rpx 30rpx;
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
  letter-spacing: 0.5rpx;
}

.subject-name {
  font-size: 32rpx;
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

.practice-modes {
  margin: 20rpx;
}

.mode-list {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.mode-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-radius: 18rpx;
  border: 1rpx solid var(--border);
  background: var(--card);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.mode-item:active {
  transform: scale(0.99);
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.1);
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
  color: var(--text);
  margin-bottom: 8rpx;
}

.mode-desc {
  font-size: 24rpx;
  color: var(--muted);
}

.mode-right {
  display: flex;
  align-items: center;
}

.mode-count {
  font-size: 24rpx;
  color: var(--primary-strong);
  margin-right: 12rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #e0e7ff;
  font-weight: 600;
}

.wrong-questions {
  margin: 20rpx;
  background: var(--card);
  border-radius: 20rpx;
  overflow: hidden;
  border: 1rpx solid var(--border);
  box-shadow: var(--shadow);
}

.wrong-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 30rpx;
  border-bottom: 1rpx solid var(--border);
}

.wrong-count {
  font-size: 28rpx;
  color: var(--text);
  font-weight: 600;
}

.clear-btn {
  font-size: 24rpx;
  color: #fff;
  background: var(--primary);
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  box-shadow: 0 6rpx 16rpx rgba(59, 130, 246, 0.25);
}

.wrong-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  background: #f8fafc;
  border-top: 1rpx solid var(--border);
}

.wrong-entry-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.wrong-entry-text {
  font-size: 28rpx;
  color: var(--text);
  font-weight: 600;
}
</style> 
