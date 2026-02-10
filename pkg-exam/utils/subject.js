import { STORAGE_KEYS } from '@/utils/constants.js'

export const normalizeSubject = (subject) => {
  if (!subject) return null
  return {
    id: Number(subject.id),
    name: subject.name || '',
    code: subject.code || null
  }
}

export const SubjectStorage = {
  get() {
    return uni.getStorageSync(STORAGE_KEYS.SELECTED_SUBJECT) || null
  },
  set(subject) {
    if (!subject) {
      uni.removeStorageSync(STORAGE_KEYS.SELECTED_SUBJECT)
      return
    }
    uni.setStorageSync(STORAGE_KEYS.SELECTED_SUBJECT, subject)
  },
  clear() {
    uni.removeStorageSync(STORAGE_KEYS.SELECTED_SUBJECT)
  }
}
