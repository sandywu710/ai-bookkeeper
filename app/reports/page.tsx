'use client'

import BottomNav from '@/components/BottomNav'
import { useEffect, useState, useCallback } from 'react'
import { CATEGORY_EMOJI, getUserId } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

type CategoryStat = { category: string; total: number; count: number; percent: number }

export default function ReportsPage() {
  const [stats, setStats] = useState<CategoryStat[]>([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const userId = getUserId()
      const res = await fetch(`/api/expenses?user_id=${userId}&limit=200`)
      const { data } = await res.json()
      if (!data) return

      const now = new Date()
      const thisMonth = data.filter((e: Expense) => {
        const d = new Date(e.created_at || '')
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })

      const total = thisMonth.reduce((sum: number, e: Expense) => sum + Number(e.amount), 0)
      setMonthTotal(total)

      const catMap: Record<string, { total: number; count: number }> = {}
      thisMonth.forEach((e: Expense) => {
        if (!catMap[e.category]) catMap[e.category] = { total: 0, count: 0 }
        catMap[e.category].total += Number(e.amount)
        catMap[e.category].count += 1
      })

      const result = Object.entries(catMap)
        .map(([category, { total, count }]) => ({
          category,
          total,
          count,
          percent: total > 0 && total > 0 ? Math.round((total / (total || 1)) * 100) : 0,
        }))
        .map((item) => ({ ...item, percent: Math.round((item.total / (total || 1)) * 100) }))
        .sort((a, b) => b.total - a.total)

      setStats(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const now = new Date()
  const monthName = `${now.getMonth() + 1}月`

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#2C2019]">月度報表</h1>
        <p className="text-sm text-[#8B7355] mt-0.5">{monthName}支出分析</p>
      </div>

      {/* Total */}
      <div className="px-5 mb-5">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5">
          <p className="text-sm text-[#8B7355]">{monthName}總支出</p>
          {loading ? (
            <div className="h-9 w-40 bg-[#FAF7F2] rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl font-bold text-[#2C2019] mt-1">
              NT${monthTotal.toLocaleString('zh-TW')}
            </p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-5">
        <h2 className="text-base font-semibold text-[#2C2019] mb-3">分類明細</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-[16px] h-16 animate-pulse" />
            ))}
          </div>
        ) : stats.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] p-8 text-center">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm text-[#8B7355]">本月還沒有記帳記錄</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.map((stat) => (
              <div
                key={stat.category}
                className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{CATEGORY_EMOJI[stat.category] || '💸'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-[#2C2019]">{stat.category}</span>
                      <span className="text-sm font-bold text-[#2C2019]">
                        NT${stat.total.toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-[#8B7355]">{stat.count} 筆</span>
                      <span className="text-xs text-[#8B7355]">{stat.percent}%</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-[#FAF7F2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4CAF7D] rounded-full transition-all duration-700"
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
