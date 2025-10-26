<template>
  <view class="exam-list-container">
    <!-- 顶部搜索栏 -->
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
        <uni-icons type="spinner-cycle" size="40" color="#007AFF" class="loading-icon" />
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
              <text class="progress-text">学到第 {{ bank.current_question_index || 0 }}/{{ bank.total_questions }} 题</text>
            </view>
            <view v-if="bank.completed_count > 0" class="completed-info">
              <text class="completed-text">✓ 已完成 {{ bank.completed_count }} 题</text>
            </view>
          </view>

          <!-- 卡片底部操作 -->
          <view class="card-footer">
            <view class="footer-btn primary" @click.stop="startExam(bank)">
              <uni-icons type="forward" size="16" color="#fff" />
              <text class="btn-text">{{ (bank.current_question_index > 0) ? '继续学习' : '开始练习' }}</text>
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
          v-if="selectedBank && selectedBank.current_question_index > 0" 
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
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get, del } from '@/utils/request.js'

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 题库列表
const bankList = ref([])

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
onShow(() => {
  console.log('📱 题库列表页面显示，刷新数据...')
  fetchBankList()
})

// 获取题库列表
const fetchBankList = async () => {
  loading.value = true
  try {
    // 1. 获取题库列表
    const data = await get('/parse-results')
    bankList.value = data || []
    
    // 2. 获取用户所有学习进度
    try {
      const progressData = await get('/user-progress')
      const progressMap = {}
      
      // 将进度数据转换为以 bank_id 为键的对象
      if (progressData && progressData.length > 0) {
        progressData.forEach(progress => {
          progressMap[progress.bank_id] = progress
        })
      }
      
      // 3. 合并进度数据到题库列表
      bankList.value.forEach(bank => {
        const progress = progressMap[bank.bank_id]
        if (progress) {
          bank.current_question_index = progress.current_question_index || 0
          bank.completed_count = progress.completed_count || 0
          bank.last_study_time = progress.last_study_time
          
          // 计算进度：基于当前学习位置，而不是已完成数量
          // 如果用户已经查看了题目但没作答，仍然算作进度
          const totalQuestions = bank.total_questions || progress.total_questions || 1
          const currentPosition = Math.max(progress.current_question_index || 0, progress.completed_count || 0)
          bank.progress = Math.min(Math.round((currentPosition / totalQuestions) * 100), 100)
          
          console.log(`题库 ${bank.bank_name} 进度计算:`, {
            current_index: progress.current_question_index,
            completed: progress.completed_count,
            total: totalQuestions,
            calculated_progress: bank.progress
          })
        } else {
          bank.progress = 0
          bank.current_question_index = 0
          bank.completed_count = 0
        }
      })
    } catch (progressError) {
      console.error('获取学习进度失败:', progressError)
      // 进度获取失败不影响题库列表显示
      bankList.value.forEach(bank => {
        bank.progress = 0
      })
    }
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

// 开始考试
const startExam = (bank) => {
  // 判断是否有学习进度（只要 current_question_index > 0 就算有进度）
  const hasProgress = bank.current_question_index > 0 && bank.current_question_index < bank.total_questions
  
  let title = '开始练习'
  let content = `准备开始「${bank.bank_name}」练习\n共 ${bank.total_questions} 道题目`
  let confirmText = '开始'
  
  if (hasProgress) {
    title = '继续学习'
    content = `「${bank.bank_name}」\n\n上次学习到第 ${bank.current_question_index + 1} 题\n进度：${bank.progress}%\n已完成：${bank.completed_count} 题\n\n是否继续学习？`
    confirmText = '继续'
  }
  
  uni.showModal({
    title: title,
    content: content,
    confirmText: confirmText,
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 跳转到答题页面
        uni.navigateTo({
          url: `/pages/exam/exam?bankId=${bank.bank_id}&resultId=${bank.id}`
        })
      }
    }
  })
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
    content: `确定要重置「${bank.bank_name}」的学习进度吗？\n\n当前进度：${bank.progress}%\n已完成：${bank.completed_count} 题\n\n重置后将从第一题重新开始，此操作不可恢复。`,
    confirmText: '重置',
    confirmColor: '#ff9500',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '重置中...' })
          
          // 调用重置接口
          await del(`/user-progress/${bank.bank_id}`)
          
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
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
  padding-bottom: 40rpx;
}

/* 搜索栏 */
.search-section {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: white;
  gap: 16rpx;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f7fa;
  border-radius: 50rpx;
  padding: 16rpx 24rpx;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.filter-btn {
  width: 72rpx;
  height: 72rpx;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 统计卡片 */
.stats-overview {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32rpx 20rpx;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.25);
}

.stat-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: white;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #333;
}

.file-name {
  font-size: 24rpx;
  color: #999;
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
  color: #666;
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
  color: #666;
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
  color: #666;
}

.progress-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #667eea;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar-bg {
  flex: 1;
  height: 12rpx;
  background: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
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
  color: #28a745;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #007AFF;
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
  background: #e3f2fd;
}

.option-text {
  font-size: 28rpx;
  color: #333;
}

.confirm-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
</style>

