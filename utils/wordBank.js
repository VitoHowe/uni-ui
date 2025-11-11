import rawWordBank from "@/mock/中高项单词词库.json"

const normalizedWordBank = (() => {
  const seen = new Set()
  return rawWordBank
    .filter((item) => item.english && item.chinese)
    .filter((item) => {
      const id = item.english.trim()
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((item) => ({
      id: item.english.trim(),
      english: item.english,
      chinese: item.chinese
    }))
})()

export const wordBank = normalizedWordBank
export const wordIds = normalizedWordBank.map((item) => item.id)
