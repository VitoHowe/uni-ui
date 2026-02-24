<template>
  <view class="essay-list-page">
    <view class="subject-card" @click="openSubjectPicker">
      <view class="subject-main">
        <text class="subject-label">当前科目</text>
        <text class="subject-name">{{ selectedSubject?.name || '请选择科目' }}</text>
      </view>
      <view class="subject-action">
        <text>{{ subjects.length ? '切换' : '加载中' }}</text>
        <uni-icons type="arrowdown" size="16" color="#0f766e" />
      </view>
    </view>

    <view class="org-card">
      <view class="section-head">
        <text class="section-title">机构筛选</text>
        <text class="section-hint" v-if="selectedOrg">已选：{{ selectedOrg.name }}</text>
      </view>
      <view v-if="loadingOrgs" class="loading-row">
        <uni-icons type="spinner-cycle" size="16" color="#0f766e" />
        <text>正在加载机构...</text>
      </view>
      <view v-else-if="orgs.length === 0" class="empty-row">
        <text>当前科目暂无论文机构</text>
      </view>
      <scroll-view v-else scroll-x class="org-scroll" show-scrollbar="false">
        <view class="org-chip-row">
          <view
            class="org-chip"
            :class="{ active: selectedOrgId === item.id }"
            v-for="item in orgs"
            :key="item.id"
            @click="selectOrg(item.id)"
          >
            <text class="org-chip-name">{{ item.name }}</text>
            <text class="org-chip-count">{{ item.essay_count || 0 }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="list-card">
      <view class="section-head">
        <text class="section-title">章节论文</text>
        <text class="section-hint" v-if="selectedOrg">{{ selectedOrg.name }}</text>
      </view>

      <view v-if="loadingEssays" class="loading-panel">
        <uni-icons type="spinner-cycle" size="30" color="#0f766e" />
        <text>加载章节论文中...</text>
      </view>

      <view v-else-if="chapterEssayGroups.length === 0" class="empty-panel">
        <text>该机构在当前科目下暂无可学习论文</text>
      </view>

      <view v-else class="chapter-list">
        <view class="chapter-card" v-for="group in chapterEssayGroups" :key="group.chapter_id">
          <view class="chapter-head">
            <text class="chapter-name">{{ group.chapter_name }}</text>
            <text class="chapter-count">{{ group.essays.length }} 篇</text>
          </view>
          <view
            class="essay-item"
            v-for="essay in group.essays"
            :key="essay.id"
            @click="openEssayDetail(essay)"
          >
            <view class="essay-main">
              <text class="essay-title">{{ essay.title }}</text>
              <text class="essay-meta">更新时间：{{ formatDate(essay.updated_at) }}</text>
            </view>
            <uni-icons type="arrowright" size="15" color="#94a3b8" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get } from '@/utils/request.js'
import { SubjectStorage, normalizeSubject } from '@/pkg-exam/utils/subject.js'
import { API_ENDPOINTS } from '@/utils/constants.js'

const subjects = ref([])
const selectedSubject = ref(SubjectStorage.get())

const orgs = ref([])
const selectedOrgId = ref(null)

const chapterEssayGroups = ref([])

const loadingOrgs = ref(false)
const loadingEssays = ref(false)
const loadingSubjects = ref(false)

const selectedOrg = computed(() => {
  if (!selectedOrgId.value) return null
  return orgs.value.find((item) => item.id === selectedOrgId.value) || null
})

const ensureSubject = async () => {
  if (!selectedSubject.value) {
    await fetchSubjects()
  }
  return !!selectedSubject.value
}

const syncSubject = (subject) => {
  selectedSubject.value = subject
  SubjectStorage.set(subject)
}

const fetchSubjects = async () => {
  if (loadingSubjects.value) return

  loadingSubjects.value = true
  try {
    const data = await get(API_ENDPOINTS.SUBJECTS.LIST, {}, { showLoading: false })
    const list = (data.subjects || []).map(normalizeSubject)
    subjects.value = list

    if (!selectedSubject.value && list.length > 0) {
      syncSubject(list[0])
      return
    }

    if (selectedSubject.value) {
      const matched = list.find((item) => item.id === selectedSubject.value.id)
      if (matched) {
        syncSubject(matched)
      } else if (list.length > 0) {
        syncSubject(list[0])
      } else {
        syncSubject(null)
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

const fetchSubjectOrgs = async (subjectId) => {
  const data = await get(API_ENDPOINTS.ESSAYS.SUBJECT_ORGS(subjectId), {}, { showLoading: false })
  orgs.value = data.orgs || []

  if (orgs.value.length === 0) {
    selectedOrgId.value = null
    chapterEssayGroups.value = []
    return
  }

  const matched = orgs.value.find((item) => item.id === selectedOrgId.value)
  selectedOrgId.value = matched ? matched.id : orgs.value[0].id
}

const fetchChapterEssays = async () => {
  if (!selectedSubject.value || !selectedOrgId.value) {
    chapterEssayGroups.value = []
    return
  }

  loadingEssays.value = true
  try {
    const subjectId = selectedSubject.value.id
    const orgId = selectedOrgId.value
    const data = await get(
      API_ENDPOINTS.ESSAYS.SUBJECT_LIST(subjectId),
      { orgId },
      { showLoading: false }
    )
    const essays = data.essays || []
    const groupedMap = new Map()

    essays.forEach((essay) => {
      const chapterId = Number(essay.subject_chapter_id) || 0
      const chapterName = essay.subject_chapter_name || '未分类章节'
      if (!groupedMap.has(chapterId)) {
        groupedMap.set(chapterId, {
          chapter_id: chapterId,
          chapter_name: chapterName,
          essays: []
        })
      }
      groupedMap.get(chapterId).essays.push(essay)
    })

    chapterEssayGroups.value = Array.from(groupedMap.values())
  } catch (error) {
    console.error('加载机构论文失败:', error)
    uni.showToast({
      title: error.message || '加载论文失败',
      icon: 'none'
    })
    chapterEssayGroups.value = []
  } finally {
    loadingEssays.value = false
  }
}

const loadAll = async () => {
  const hasSubject = await ensureSubject()
  if (!hasSubject) {
    chapterEssayGroups.value = []
    return
  }

  const subjectId = selectedSubject.value.id
  loadingOrgs.value = true
  try {
    await fetchSubjectOrgs(subjectId)
  } finally {
    loadingOrgs.value = false
  }

  await fetchChapterEssays()
}

const selectOrg = async (orgId) => {
  if (selectedOrgId.value === orgId) return
  selectedOrgId.value = orgId
  await fetchChapterEssays()
}

const openSubjectPicker = () => {
  if (!subjects.value.length) {
    uni.showToast({
      title: '暂无可选科目',
      icon: 'none'
    })
    return
  }

  uni.showActionSheet({
    itemList: subjects.value.map((item) => item.name),
    success: async (res) => {
      const subject = subjects.value[res.tapIndex]
      if (!subject) return
      syncSubject(subject)
      selectedOrgId.value = null
      await loadAll()
    }
  })
}

const openEssayDetail = (essay) => {
  uni.navigateTo({
    url: `/pkg-exam/pages/essay-detail/essay-detail?essayId=${essay.id}&essayTitle=${encodeURIComponent(essay.title)}`
  })
}

const formatDate = (value) => {
  if (!value) return '-'
  const text = String(value)
  if (text.length >= 16) {
    return text.slice(0, 16).replace('T', ' ')
  }
  return text.replace('T', ' ')
}

onShow(async () => {
  const stored = SubjectStorage.get()
  if (stored) {
    selectedSubject.value = stored
  }

  await fetchSubjects()
  await loadAll()
})
</script>

<style scoped lang="scss">
.essay-list-page {
  --essay-bg: #f8fafc;
  --essay-surface: #ffffff;
  --essay-text: #0f172a;
  --essay-muted: #64748b;
  --essay-primary: #0f766e;
  --essay-border: #dbe7e4;
  min-height: 100vh;
  padding: 24rpx;
  background: linear-gradient(180deg, #ecfeff 0%, #f8fafc 42%, #f8fafc 100%);
}

.subject-card,
.org-card,
.list-card {
  border-radius: 20rpx;
  background: var(--essay-surface);
  border: 1rpx solid var(--essay-border);
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.subject-card {
  margin-bottom: 16rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subject-main {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.subject-label {
  font-size: 24rpx;
  color: var(--essay-muted);
}

.subject-name {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--essay-text);
}

.subject-action {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: var(--essay-primary);
  font-weight: 600;
}

.org-card,
.list-card {
  padding: 22rpx;
  margin-bottom: 16rpx;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--essay-text);
}

.section-hint {
  font-size: 24rpx;
  color: var(--essay-muted);
}

.loading-row,
.empty-row {
  min-height: 72rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #f8fafc;
  color: var(--essay-muted);
  font-size: 24rpx;
}

.org-scroll {
  width: 100%;
  white-space: nowrap;
}

.org-chip-row {
  display: inline-flex;
  gap: 10rpx;
}

.org-chip {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 16rpx;
  border-radius: 999rpx;
  border: 1rpx solid #cbd5e1;
  background: #f8fafc;
}

.org-chip.active {
  background: #0f766e;
  border-color: #0f766e;
}

.org-chip-name {
  font-size: 24rpx;
  color: #0f172a;
  font-weight: 600;
}

.org-chip.active .org-chip-name {
  color: #f8fafc;
}

.org-chip-count {
  min-width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: rgba(15, 118, 110, 0.14);
  color: #0f766e;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.org-chip.active .org-chip-count {
  color: #0f172a;
  background: #f8fafc;
}

.loading-panel,
.empty-panel {
  min-height: 240rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  color: var(--essay-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 25rpx;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.chapter-card {
  border-radius: 16rpx;
  border: 1rpx solid #e2e8f0;
  background: #ffffff;
  overflow: hidden;
}

.chapter-head {
  padding: 16rpx 18rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-bottom: 1rpx solid #e2e8f0;
}

.chapter-name {
  font-size: 27rpx;
  font-weight: 700;
  color: #0f172a;
}

.chapter-count {
  font-size: 22rpx;
  color: #475569;
}

.essay-item {
  padding: 16rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  border-top: 1rpx solid #f1f5f9;
}

.essay-item:first-child {
  border-top: none;
}

.essay-main {
  flex: 1;
}

.essay-title {
  display: block;
  font-size: 27rpx;
  color: #0f172a;
  font-weight: 600;
}

.essay-meta {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #64748b;
}
</style>
