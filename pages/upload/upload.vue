<template>
  <view class="upload-container">
    <!-- 认证保护：未登录时显示登录引导 -->
    <AuthGuard 
      v-if="!authStore.isAuthenticated"
      title="文件上传"
      message="登录后可上传PDF文件，系统将自动解析题库和知识点内容"
      :show-preview="true"
      current-path="/pages/upload/upload"
    >
      <template #preview>
        <view class="preview-item">
          <uni-icons type="checkmarkempty" size="16" color="#28a745" />
          <text>PDF文件智能解析</text>
        </view>
        <view class="preview-item">
          <uni-icons type="checkmarkempty" size="16" color="#28a745" />
          <text>题库批量导入</text>
        </view>
        <view class="preview-item">
          <uni-icons type="checkmarkempty" size="16" color="#28a745" />
          <text>上传历史管理</text>
        </view>
      </template>
    </AuthGuard>

    <!-- 已登录内容 -->
    <template v-else>
    <!-- 页面标题和描述 -->
    <view class="page-header">
      <view class="header-content">
        <text class="header-title">文件上传</text>
        <text class="header-desc">支持知识点和题库文件的上传与解析</text>
      </view>
    </view>

    <!-- 文件类型选择 -->
    <view class="file-type-section">
      <uni-section title="选择文件类型" type="line" padding>
        <view class="type-selector">
          <uni-segmented-control 
            :values="fileTypeOptions" 
            :current="currentFileType" 
            @clickItem="onTypeChange"
            styleType="text"
            activeColor="#007AFF"
          />
        </view>
        <view class="type-description">
          <text class="desc-text">{{ getTypeDescription() }}</text>
        </view>
      </uni-section>
    </view>

    <!-- 文件上传区域 -->
    <view class="upload-section">
      <uni-section title="选择文件" type="line" padding>
        <view class="upload-area">
          <uni-file-picker
            ref="filePickerRef"
            v-model="filesList"
            :file-mediatype="fileMediaType"
            :file-extname="allowedExtensions"
            :limit="maxFileCount"
            :auto-upload="false"
            mode="list"
            :title="`已选择文件 (${filesList.length}/${maxFileCount})`"
            @select="onFileSelect"
            @progress="onUploadProgress"
            @success="onUploadSuccess"
            @fail="onUploadFail"
          >
            <view class="upload-trigger">
              <view class="upload-icon">
                <uni-icons type="cloud-upload" size="32" color="#007AFF" />
              </view>
              <text class="upload-text">点击选择{{ getFileTypeText() }}文件</text>
              <text class="upload-hint">支持 {{ allowedExtensions.join(', ') }} 格式</text>
            </view>
          </uni-file-picker>
        </view>
      </uni-section>
    </view>

    <!-- 上传操作区域 -->
    <view class="action-section" v-if="filesList.length > 0">
      <view class="action-buttons">
        <button 
          class="btn-upload" 
          :disabled="uploading"
          @click="handleStartUpload"
        >
          <uni-icons v-if="uploading" type="spinner-cycle" size="16" color="#fff" />
          {{ uploading ? '上传中...' : '开始上传' }}
        </button>
        <button 
          class="btn-clear" 
          :disabled="uploading"
          @click="clearFiles"
        >
          清空文件
        </button>
      </view>
    </view>

    <!-- 上传进度显示 -->
    <view class="progress-section" v-if="uploadProgress.show">
      <uni-section title="上传进度" type="line" padding>
        <view class="progress-content">
          <view class="progress-info">
            <text class="progress-text">
              正在上传{{ getFileTypeText() }}文件... ({{ uploadProgress.current }}/{{ uploadProgress.total }})
            </text>
          </view>
          <uni-progress 
            :percent="uploadProgress.percent" 
            :show-info="true"
            color="#007AFF"
            stroke-width="8"
          />
        </view>
      </uni-section>
    </view>

    <!-- 上传历史记录 -->
    <view class="history-section">
      <uni-section title="上传记录" type="line" padding>
        <uni-list v-if="uploadHistory.length > 0">
          <uni-list-item
            v-for="(record, index) in uploadHistory"
            :key="index"
            :title="record.fileName"
            :note="`${record.fileType} | ${record.uploadTime}`"
            :rightText="record.status"
            clickable
            @click="viewUploadDetail(record)"
          >
            <template v-slot:header>
              <view class="history-icon" :class="`status-${getStatusClass(record.status)}`">
                <uni-icons 
                  :type="getStatusIcon(record.status)" 
                  size="18" 
                  :color="getStatusColor(record.status)" 
                />
              </view>
            </template>
          </uni-list-item>
        </uni-list>
        <view v-else class="empty-history">
          <uni-icons type="inbox" size="48" color="#ccc" />
          <text class="empty-text">暂无上传记录</text>
        </view>
      </uni-section>
    </view>

    <!-- 自定义底部导航栏 -->
    <CustomTabBar :current="4" @change="onTabChange" />
    </template>
  </view>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUploadStore } from '@/stores/upload'
import { useAuthStore } from '@/stores/auth.js'
import { PermissionChecker, RouteGuard } from '@/utils/auth.js'
import CustomTabBar from "@/components/CustomTabBar.vue"
import AuthGuard from "@/components/AuthGuard.vue"

// 使用状态管理
const uploadStore = useUploadStore()
const authStore = useAuthStore()

// 文件相关配置
const fileMediaType = 'all'

// 计算属性
const fileTypeOptions = computed(() => uploadStore.config.fileTypeOptions)
const currentFileType = computed(() => uploadStore.currentFileType)
const maxFileCount = computed(() => uploadStore.config.maxFileCount)
const filesList = computed(() => uploadStore.filesList)
const uploading = computed(() => uploadStore.uploadStatus.uploading)
const uploadProgress = computed(() => uploadStore.uploadStatus.progress)
const uploadHistory = computed(() => uploadStore.uploadHistory)
const allowedExtensions = computed(() => uploadStore.currentAllowedExtensions)

// 获取文件类型描述
const getTypeDescription = () => {
  return uploadStore.currentTypeDescription
}

// 获取文件类型文本
const getFileTypeText = () => {
  return uploadStore.currentFileTypeText
}

// 文件类型切换
const onTypeChange = (e) => {
  // 切换类型时检查是否有已选文件
  if (filesList.value.length > 0) {
    uni.showModal({
      title: '切换文件类型',
      content: '切换文件类型将清空当前已选文件，是否继续？',
      success: (res) => {
        if (res.confirm) {
          uploadStore.setFileType(e.currentIndex)
        }
        // 如果取消，不做任何操作，segmented-control会自动恢复
      }
    })
  } else {
    uploadStore.setFileType(e.currentIndex)
  }
}

// 文件选择回调
const onFileSelect = (e) => {
  console.log('选择文件:', e)
  const success = uploadStore.addFiles(e.tempFiles)
  if (success) {
    uni.showToast({
      title: `已选择 ${e.tempFiles.length} 个文件`,
      icon: 'success'
    })
  }
}

// 上传进度回调
const onUploadProgress = (e) => {
  console.log('上传进度:', e)
  // 这里可以处理单个文件的上传进度
}

// 上传成功回调
const onUploadSuccess = (e) => {
  console.log('上传成功:', e)
  // 在实际项目中，这个回调会由uni-file-picker触发
  // 当前使用store中的方法来处理上传逻辑
}

// 上传失败回调
const onUploadFail = (e) => {
  console.log('上传失败:', e)
  // 在实际项目中，这个回调会由uni-file-picker触发
  // 当前使用store中的方法来处理上传逻辑
}

// 开始上传
const startUpload = () => {
  uploadStore.startUpload()
}

// 清空文件
const clearFiles = () => {
  if (filesList.value.length === 0) return
  
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有已选文件吗？',
    success: (res) => {
      if (res.confirm) {
        uploadStore.clearFiles()
        uni.showToast({
          title: '已清空文件列表',
          icon: 'success'
        })
      }
    }
  })
}

// 查看上传详情
const viewUploadDetail = (record) => {
  uni.showModal({
    title: record.fileName,
    content: `文件类型：${record.fileType}\n上传时间：${record.uploadTime}\n文件大小：${record.fileSize}\n状态：${record.status}${record.errorMessage ? '\n错误信息：' + record.errorMessage : ''}${record.recordCount ? '\n解析记录数：' + record.recordCount : ''}`,
    confirmText: '确定'
  })
}

// 获取状态图标
const getStatusIcon = (status) => {
  return uploadStore.getStatusIcon(status)
}

// 获取状态颜色  
const getStatusColor = (status) => {
  return uploadStore.getStatusColor(status)
}

// 获取状态CSS类名（中文状态转英文类名）
const getStatusClass = (status) => {
  const statusMap = {
    '成功': 'success',
    '失败': 'failed', 
    '处理中': 'processing'
  }
  return statusMap[status] || 'unknown'
}

// 检查上传权限
const checkUploadPermission = () => {
  const permissionResult = PermissionChecker.checkFeatureAvailable('file_upload')
  
  if (!permissionResult.available) {
    uni.showModal({
      title: '需要登录',
      content: permissionResult.message,
      confirmText: '立即登录',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          // 保存当前路径
          RouteGuard.saveReturnPath('/pages/upload/upload')
          // 跳转到登录页
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
    return false
  }
  
  return true
}

// 重写开始上传函数，添加权限检查
const handleStartUpload = async () => {
  if (!checkUploadPermission()) {
    return
  }
  
  try {
    await uploadStore.startUpload()
  } catch (error) {
    console.error('上传失败:', error)
    uni.showToast({
      title: error.message || '上传失败',
      icon: 'error'
    })
  }
}

// 底部导航切换
const onTabChange = (index) => {
  console.log('切换到tab:', index)
}

// 页面初始化时检查登录状态
onMounted(() => {
  console.log('文件上传页面加载')
  
  // 如果未登录，显示登录提示
  if (!authStore.isAuthenticated) {
    uni.showToast({
      title: '建议登录后使用完整上传功能',
      icon: 'none',
      duration: 3000
    })
  }
})
</script>

<style lang="scss" scoped>
.upload-container {
  padding: 0 0 40rpx 0;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
  color: white;
}

.header-content {
  text-align: center;
}

.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 15rpx;
}

.header-desc {
  font-size: 26rpx;
  opacity: 0.9;
  line-height: 1.4;
}

.file-type-section,
.upload-section,
.action-section,
.progress-section,
.history-section {
  margin: 20rpx;
}

.type-selector {
  padding: 20rpx 0;
}

.type-description {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f0f7ff;
  border-radius: 12rpx;
  border-left: 4rpx solid #007AFF;
}

.desc-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

.upload-area {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.upload-trigger {
  padding: 60rpx 40rpx;
  text-align: center;
  border: 2rpx dashed #e0e0e0;
  border-radius: 12rpx;
  margin: 20rpx;
  background: #fafafa;
  transition: all 0.3s ease;
}

.upload-trigger:active {
  background: #f0f7ff;
  border-color: #007AFF;
}

.upload-icon {
  margin-bottom: 20rpx;
}

.upload-text {
  display: block;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 10rpx;
  font-weight: 500;
}

.upload-hint {
  font-size: 24rpx;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
}

.btn-upload,
.btn-clear {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

.btn-upload {
  background-color: #007AFF;
  color: white;
}

.btn-upload:disabled {
  background-color: #ccc;
  opacity: 0.6;
}

.btn-clear {
  background-color: #f8f9fa;
  color: #666;
  border: 1rpx solid #e0e0e0;
}

.btn-clear:disabled {
  opacity: 0.6;
}

.progress-content {
  background: white;
  padding: 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.progress-info {
  margin-bottom: 20rpx;
}

.progress-text {
  font-size: 28rpx;
  color: #333;
}

.history-section {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.history-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.status-success {
  background-color: #f0f9ff;
}

.status-failed {
  background-color: #fff5f5;
}

.status-processing {
  background-color: #f0f7ff;
}

.status-unknown {
  background-color: #f8f9fa;
}

.empty-history {
  padding: 80rpx;
  text-align: center;
}

.empty-text {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}

// AuthGuard预览项目样式
.preview-item {
  display: flex;
  align-items: center;
  padding: 15rpx 0;
  font-size: 26rpx;
  color: #666;
  
  uni-icons {
    margin-right: 15rpx;
  }
}
</style>
