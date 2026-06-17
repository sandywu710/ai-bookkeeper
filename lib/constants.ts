export const FIXED_CATEGORIES = [
  '餐飲',
  '交通',
  '購物',
  '娛樂',
  '醫療',
  '住居',
  '教育',
  '感情支出',
  '其他',
] as const

export const CATEGORIES = FIXED_CATEGORIES

export type Category = (typeof FIXED_CATEGORIES)[number]

export const CATEGORY_EMOJI: Record<string, string> = {
  餐飲: '🍱',
  交通: '🚕',
  購物: '🛍️',
  娛樂: '🎬',
  醫療: '💊',
  住居: '🏠',
  教育: '📚',
  感情支出: '💕',
  其他: '💸',
}

export type CustomCategory = { id?: string; name: string; emoji: string }

export function getUserId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let userId = localStorage.getItem('ai-bookkeeper-user-id')
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem('ai-bookkeeper-user-id', userId)
    }
    return userId
  } catch {
    return ''
  }
}

export function getCustomCategories(): CustomCategory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('customCategories')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCustomCategories(cats: CustomCategory[]): void {
  try {
    localStorage.setItem('customCategories', JSON.stringify(cats))
  } catch {}
}

export function getAllCategories(): string[] {
  const custom = getCustomCategories().map(c => c.name)
  return [...FIXED_CATEGORIES, ...custom]
}

export function getAllCategoryEmoji(): Record<string, string> {
  const custom = getCustomCategories()
  const extra: Record<string, string> = {}
  custom.forEach(c => { extra[c.name] = c.emoji })
  return { ...CATEGORY_EMOJI, ...extra }
}

export function getMonthlyBudget(): number {
  if (typeof window === 'undefined') return 30000
  try {
    const v = localStorage.getItem('monthlyBudget')
    return v ? Number(v) : 30000
  } catch {
    return 30000
  }
}

export function saveMonthlyBudget(amount: number): void {
  try {
    localStorage.setItem('monthlyBudget', String(amount))
  } catch {}
}
