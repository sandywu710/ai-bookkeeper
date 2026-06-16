'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { CATEGORY_EMOJI, getUserId } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

type GroupedExpenses = {
  date: string
  label: string
  total: number
  items: Expense[]
}

export default function RecordsPage() {
  const [grouped, setGrouped] = useState<GroupedExpenses[]>([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [swipedId, setSwipedId] = useState<string | null>(null)

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const userId = getUserId()
      const res = await fetch(`/api/expenses?user_id=${userId}&limit=200`)
      const { data } = await res.json()
      if (!data) return

      const now = new Date()
      const thisMonthExpenses = data.filter((e: Expense) => {
        const d = new Date(e.created_at || '')
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const total = thisMonthExpenses.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)
      setMonthTotal(total)

      const groups: Record<string, Expense[]> = {}
      data.forEach((e: Expense) => {
        const dateKey = (e.expense_date || (e.created_at || '').split('T')[0])
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(e)
      })

      const result = Object.entries(groups)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, items]) => ({
          date,
          label: formatDateLabel(date),
          total: items.reduce((sum, e) => sum + Number(e.amount), 0),
          items,
        }))

      setGrouped(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/expenses/delete?id=${id}`, { method: 'DELETE' })
      await loadExpenses()
    } finally {
      setDeletingId(null)
      setSwipedId(null)
    }
  }

  const now = new Date()
  const monthName = `${now.getMonth() + 1}月`

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#2C2019]">記帳記錄</h1>
        <p className="text-sm text-[#8B7355] mt-0.5">{monthName} 共花費 NT${monthTotal.toLocaleString('zh-TW')}</p>
      </div>

      {loading ? (
        <div className="px-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-[#E8E0D5] rounded animate-pulse" />
              <div className="bg-white rounded-[16px] h-16 animate-pulse" />
              <div className="bg-white rounded-[16px] h-16 animate-pulse" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-base font-medium text-[#2C2019] mb-2">還沒有記帳記錄</p>
          <p className="text-sm text-[#8B7355] mb-6">開始記錄你的第一筆支出吧！</p>
          <Link
            href="/add"
            className="bg-[#4CAF7D] text-white font-bold px-8 py-3 rounded-[12px] shadow-[0_4px_16px_rgba(76,175,125,0.3)]"
          >
            + 快速記帳
          </Link>
        </div>
      ) : (
        <div className="px-5 space-y-5">
          {grouped.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#8B7355]">{group.label}</span>
                <span className="text-sm font-medium text-[#2C2019]">
                  NT${group.total.toLocaleString('zh-TW')}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((expense) => (
                  <div
                    key={expense.id}
                    className="relative overflow-hidden rounded-[16px]"
                    onTouchStart={() => {}}
                  >
                    {/* Delete background */}
                    {swipedId === expense.id && (
                      <div className="absolute inset-y-0 right-0 w-20 bg-[#E8736C] flex items-center justify-center rounded-r-[16px] z-10">
                        {deletingId === expense.id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
                        ) : (
                          <button
                            onClick={() => handleDelete(expense.id!)}
                            className="text-white text-sm font-medium"
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    )}

                    <div
                      className={`bg-white border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4 flex items-center gap-3 transition-transform ${
                        swipedId === expense.id ? '-translate-x-16' : 'translate-x-0'
                      }`}
                      onTouchStart={(e) => {
                        const startX = e.touches[0].clientX
                        const el = e.currentTarget
                        let moved = false

                        const handleMove = (ev: TouchEvent) => {
                          const dx = startX - ev.touches[0].clientX
                          if (dx > 40) {
                            moved = true
                            setSwipedId(expense.id!)
                          } else if (dx < -10) {
                            setSwipedId(null)
                          }
                        }

                        const handleEnd = () => {
                          if (!moved) setSwipedId(null)
                          el.removeEventListener('touchmove', handleMove)
                          el.removeEventListener('touchend', handleEnd)
                        }

                        el.addEventListener('touchmove', handleMove)
                        el.addEventListener('touchend', handleEnd)
                      }}
                      onClick={() => {
                        if (swipedId === expense.id) {
                          setSwipedId(null)
                        }
                      }}
                    >
                      <span className="text-2xl flex-shrink-0">
                        {CATEGORY_EMOJI[expense.category] || '💸'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2C2019] text-sm truncate">{expense.description}</p>
                        <p className="text-xs text-[#8B7355] mt-0.5">
                          {expense.category} · {formatTime(expense.created_at)}
                        </p>
                      </div>
                      <span className="text-base font-bold text-[#2C2019] flex-shrink-0">
                        NT${Number(expense.amount).toLocaleString('zh-TW')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const toKey = (dt: Date) => dt.toISOString().split('T')[0]
  if (dateStr === toKey(today)) return '今天'
  if (dateStr === toKey(yesterday)) return '昨天'

  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
