'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { AddToHomeScreenTip } from '@/components/AddToHomeScreen'
import { CATEGORY_EMOJI, getAllCategoryEmoji, getMonthlyBudget } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

export default function HomePage() {
  const [monthTotal, setMonthTotal] = useState<number | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState(30000)
  const [emojiMap, setEmojiMap] = useState<Record<string, string>>(CATEGORY_EMOJI)

  useEffect(() => {
    setBudget(getMonthlyBudget())
    setEmojiMap(getAllCategoryEmoji())
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses?limit=50')
      const { data } = await res.json()
      if (!data) return

      const now = new Date()
      const thisMonth = data.filter((e: Expense) => {
        const ds: string = e.expense_date || (e.created_at ? e.created_at.split('T')[0] : '')
        if (!ds) return false
        const [y, m] = ds.split('-').map(Number)
        return y === now.getFullYear() && m === now.getMonth() + 1
      })
      const total = thisMonth.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)
      setMonthTotal(total)
      setRecentExpenses(data.slice(0, 3))
    } catch {
      setMonthTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const now = new Date()
  const monthName = `${now.getMonth() + 1}月`
  const spent = monthTotal ?? 0
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const isOver = spent > budget

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <p className="text-sm text-[#8B7355]">歡迎回來</p>
        <h1 className="text-xl font-bold text-[#2C2019] mt-0.5">AI 記帳助手</h1>
      </div>

      {/* Month Total Card */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5 border border-[#E8E0D5]">
          <p className="text-sm text-[#8B7355]">{monthName}已花費</p>
          {loading ? (
            <div className="mt-2 h-9 w-40 bg-[#FAF7F2] rounded animate-pulse" />
          ) : (
            <p className={`text-3xl font-bold mt-1 ${isOver ? 'text-[#E8736C]' : 'text-[#2C2019]'}`}>
              NT${spent.toLocaleString('zh-TW')}
            </p>
          )}
          <div className="mt-3 h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percent}%`,
                backgroundColor: isOver ? '#E8736C' : '#4CAF7D',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className={`text-xs font-medium ${isOver ? 'text-[#E8736C]' : 'text-[#8B7355]'}`}>
              {loading ? '讀取中...' : `已花 NT$${spent.toLocaleString('zh-TW')} ／ 預算 NT$${budget.toLocaleString('zh-TW')}`}
            </p>
            {isOver && !loading && (
              <span className="text-xs font-bold text-[#E8736C]">超支 {Math.round(percent - 100)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-5 mb-8">
        <Link
          href="/add"
          className="flex items-center justify-center gap-3 w-full bg-[#4CAF7D] text-white font-bold text-lg rounded-[12px] py-5 shadow-[0_4px_16px_rgba(76,175,125,0.35)] active:scale-95 transition-transform"
        >
          <span className="text-2xl">＋</span>
          快速記帳
        </Link>
      </div>

      {/* Recent Expenses */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#2C2019]">最近記錄</h2>
          <Link href="/records" className="text-sm text-[#4CAF7D] font-medium">查看全部</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[16px] p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 text-center border border-[#E8E0D5]">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-sm text-[#8B7355]">還沒有記帳，點上方按鈕開始記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white rounded-[16px] p-4 border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] flex items-center gap-3"
              >
                <span className="text-2xl flex-shrink-0">
                  {emojiMap[expense.category] || '💸'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#2C2019] text-sm truncate">{expense.description}</p>
                  <p className="text-xs text-[#8B7355] mt-0.5">
                    {expense.category} · {formatDate(expense.created_at)}
                  </p>
                </div>
                <span className="text-base font-bold text-[#2C2019] flex-shrink-0">
                  NT${Number(expense.amount).toLocaleString('zh-TW')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add to Home Screen tip — only shown if not PWA and not dismissed */}
      <div className="mt-6">
        <AddToHomeScreenTip />
      </div>

      <BottomNav />
    </div>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 60) return `${diffMins} 分鐘前`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} 小時前`
  return `${d.getMonth() + 1}/${d.getDate()}`
}
