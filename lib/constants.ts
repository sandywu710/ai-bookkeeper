export const CATEGORIES = [
  '餐飲',
  '交通',
  '購物',
  '娛樂',
  '醫療',
  '住居',
  '教育',
  '其他',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_EMOJI: Record<string, string> = {
  餐飲: '🍱',
  交通: '🚕',
  購物: '🛍️',
  娛樂: '🎬',
  醫療: '💊',
  住居: '🏠',
  教育: '📚',
  其他: '💸',
}

export function getUserId(): string {
  if (typeof window === 'undefined') return ''
  let userId = localStorage.getItem('ai-bookkeeper-user-id')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('ai-bookkeeper-user-id', userId)
  }
  return userId
}
