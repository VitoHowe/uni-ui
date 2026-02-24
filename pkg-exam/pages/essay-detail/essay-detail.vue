<template>
  <view class="essay-detail-page">
    <view class="meta-card" v-if="essayDetail">
      <text class="essay-title">{{ essayDetail.title }}</text>
      <view class="meta-row">
        <text class="meta-item">机构：{{ essayDetail.org_name || '-' }}</text>
        <text class="meta-item">章节：{{ essayDetail.subject_chapter_name || '-' }}</text>
      </view>
      <text class="meta-time">更新时间：{{ formatDate(essayDetail.updated_at) }}</text>
    </view>

    <view class="content-card">
      <view v-if="loading" class="state-panel">
        <uni-icons type="spinner-cycle" size="34" color="#0f766e" />
        <text>正在加载论文内容...</text>
      </view>

      <view v-else-if="errorMessage" class="state-panel error">
        <text>{{ errorMessage }}</text>
        <button class="retry-btn" @click="loadEssay">重试</button>
      </view>

      <view v-else-if="!renderedContent" class="state-panel">
        <text>论文内容为空</text>
      </view>

      <view v-else class="content-wrap">
        <view class="media-tools">
          <button v-if="previewImageUrls.length > 0" class="media-preview-btn" @click="previewImage()">
            点击放大图表（{{ previewImageUrls.length }}）
          </button>
          <view class="scale-tool">
            <text class="scale-label">图表缩放：{{ Math.round(diagramScale * 100) }}%</text>
            <text v-if="diagramScale > DEFAULT_DIAGRAM_SCALE" class="scale-tip">已启用横向滑动</text>
            <view class="scale-actions">
              <button class="scale-btn" @click="adjustDiagramScale(-DIAGRAM_SCALE_STEP)">A-</button>
              <button class="scale-btn" @click="adjustDiagramScale(DIAGRAM_SCALE_STEP)">A+</button>
              <button class="scale-btn ghost" @click="resetDiagramScale">重置</button>
            </view>
          </view>
        </view>
        <rich-text class="essay-rich" :nodes="renderedContent" @itemclick="handleRichTextItemClick"></rich-text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { get } from '@/utils/request.js'
import { API_CONFIG, API_ENDPOINTS } from '@/utils/constants.js'
import { parseEssayMarkdown, extractEssayImageUrls } from '@/pkg-exam/utils/essayParser.js'

const essayId = ref(0)
const essayDetail = ref(null)
const markdownRaw = ref('')
const renderedContent = ref('')
const previewImageUrls = ref([])
const errorMessage = ref('')
const loading = ref(false)
const DEFAULT_DIAGRAM_SCALE = 1.3
const MIN_DIAGRAM_SCALE = 0.6
const MAX_DIAGRAM_SCALE = 2.4
const DIAGRAM_SCALE_STEP = 0.01
const diagramScale = ref(DEFAULT_DIAGRAM_SCALE)

const parseMarkdownResponse = (value) => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if (typeof value.content === 'string') return value.content
    if (typeof value.data === 'string') return value.data
    try {
      return JSON.stringify(value)
    } catch (error) {
      return String(value)
    }
  }
  return String(value)
}

const resolveContentUrl = (contentUrl) => {
  if (!contentUrl) return ''
  if (/^https?:\/\//i.test(contentUrl)) return contentUrl
  const origin = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '')
  return `${origin}${contentUrl.startsWith('/') ? '' : '/'}${contentUrl}`
}

const resolveAssetUrl = (url) => {
  const text = String(url || '').trim()
  if (!text) return ''
  if (/^https?:\/\//i.test(text)) return text
  if (/^\/\//.test(text)) return `https:${text}`
  if (/^data:/i.test(text)) return text
  const origin = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '')
  return `${origin}${text.startsWith('/') ? '' : '/'}${text}`
}

const requestMarkdown = (url) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      responseType: 'text',
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parseMarkdownResponse(res.data))
          return
        }
        reject(new Error(`论文内容加载失败（${res.statusCode}）`))
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '论文内容加载失败'))
      }
    })
  })
}

const renderMarkdown = () => {
  if (!markdownRaw.value) {
    renderedContent.value = ''
    return
  }
  const allowHorizontalScroll = diagramScale.value > DEFAULT_DIAGRAM_SCALE
  renderedContent.value = parseEssayMarkdown(markdownRaw.value, {
    preFontScale: diagramScale.value,
    tableFontScale: diagramScale.value,
    allowHorizontalScroll
  })
}

const loadEssay = async () => {
  if (!essayId.value) {
    errorMessage.value = '缺少 essayId 参数'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const detail = await get(API_ENDPOINTS.ESSAYS.DETAIL(essayId.value), {}, { showLoading: false })
    essayDetail.value = detail

    const fullContentUrl = resolveContentUrl(detail.content_url)
    if (!fullContentUrl) {
      throw new Error('论文内容地址无效')
    }

    const markdownText = await requestMarkdown(fullContentUrl)
    markdownRaw.value = markdownText
    const origin = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '')
    previewImageUrls.value = extractEssayImageUrls(markdownText, origin)
    renderMarkdown()
  } catch (error) {
    console.error('加载论文失败:', error)
    errorMessage.value = error.message || '加载论文失败'
    markdownRaw.value = ''
    renderedContent.value = ''
    previewImageUrls.value = []
  } finally {
    loading.value = false
  }
}

const previewImage = (current = '') => {
  if (!previewImageUrls.value.length) return
  const currentUrl = current && previewImageUrls.value.includes(current)
    ? current
    : previewImageUrls.value[0]
  uni.previewImage({
    urls: previewImageUrls.value,
    current: currentUrl
  })
}

const handleRichTextItemClick = (event) => {
  const node = event?.detail?.node || event?.detail || {}
  const nodeName = String(node?.name || '').toLowerCase()
  if (nodeName !== 'img') return
  const attrs = node?.attrs || {}
  const src = attrs.src || attrs['data-src'] || ''
  const resolvedSrc = resolveAssetUrl(src)
  if (resolvedSrc) {
    previewImage(resolvedSrc)
  }
}

const adjustDiagramScale = (step) => {
  const nextScale = Number((diagramScale.value + step).toFixed(2))
  diagramScale.value = Math.max(MIN_DIAGRAM_SCALE, Math.min(MAX_DIAGRAM_SCALE, nextScale))
  renderMarkdown()
}

const resetDiagramScale = () => {
  diagramScale.value = DEFAULT_DIAGRAM_SCALE
  renderMarkdown()
}

const formatDate = (value) => {
  if (!value) return '-'
  const text = String(value)
  if (text.length >= 16) {
    return text.slice(0, 16).replace('T', ' ')
  }
  return text.replace('T', ' ')
}

onLoad((options) => {
  essayId.value = Number(options.essayId || 0)
  if (options.essayTitle) {
    uni.setNavigationBarTitle({
      title: decodeURIComponent(options.essayTitle)
    })
  }
  loadEssay()
})

onPullDownRefresh(async () => {
  await loadEssay()
  uni.stopPullDownRefresh()
})
</script>

<style scoped lang="scss">
.essay-detail-page {
  min-height: 100vh;
  padding: 24rpx;
  background: linear-gradient(180deg, #ecfeff 0%, #f8fafc 40%, #f8fafc 100%);
}

.meta-card,
.content-card {
  border-radius: 20rpx;
  background: #ffffff;
  border: 1rpx solid #dbe7e4;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.06);
}

.meta-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.essay-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.45;
}

.meta-row {
  margin-top: 12rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #475569;
}

.meta-time {
  margin-top: 8rpx;
  display: block;
  font-size: 22rpx;
  color: #64748b;
}

.content-card {
  padding: 16rpx;
}

.content-wrap {
  padding: 8rpx;
}

.media-tools {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 16;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  padding: 10rpx 0 8rpx;
  margin-bottom: 12rpx;
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1rpx solid #eef2f7;
}

.media-preview-btn {
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 999rpx;
  border: 1rpx solid #99f6e4;
  padding: 0 20rpx;
  background: #ecfeff;
  color: #0f766e;
  font-size: 22rpx;
}

.scale-tool {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.scale-label {
  font-size: 22rpx;
  color: #0f766e;
}

.scale-tip {
  font-size: 20rpx;
  color: #475569;
}

.scale-actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.scale-btn {
  min-width: 72rpx;
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 14rpx;
  border-radius: 10rpx;
  border: 1rpx solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-size: 22rpx;
}

.scale-btn.ghost {
  min-width: 92rpx;
  border-color: #99f6e4;
  background: #ecfeff;
  color: #0f766e;
}

.state-panel {
  min-height: 320rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  font-size: 26rpx;
}

.state-panel.error {
  color: #dc2626;
}

.retry-btn {
  min-width: 200rpx;
  height: 74rpx;
  border-radius: 14rpx;
  background: #0f766e;
  color: #ffffff;
  border: none;
  font-size: 26rpx;
}

.essay-rich {
  font-size: 30rpx;
  color: #1f2937;
  line-height: 1.8;
  word-break: break-word;
  overflow-x: visible;
}
</style>
