'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import type { Expense } from '@/lib/supabase'

// Import the entire chart section as one unit so recharts component types stay intact
const ReportCharts = dynamic(() => import('./ReportCharts'), { ssr: false })

export default function ReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsFetched, setInsightsFetched] = useState(false)

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    setInsightsFetched(false)
    setInsights([])
    try {
      const res = await fetch('/api/expenses?limit=500')
      const { data } = await res.json()
      if (data) setExpenses(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  // ---- month filter ----
  const monthExpenses = expenses.filter(e => {
    const ds = e.expense_date || toLocalDate(e.created_at || '')
    if (!ds) return false
    const [y, m] = ds.split('-').map(Number)
    return y === year && m === month + 1
  })
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)

  // ---- category stats ----
  const catMap: Record<string, { total: number; count: number }> = {}
  monthExpenses.forEach(e => {
    if (!catMap[e.category]) catMap[e.category] = { total: 0, count: 0 }
    catMap[e.category].total += Number(e.amount)
    catMap[e.category].count++
  })
  const catData = Object.entries(catMap)
    .map(([name, { total, count }]) => ({
      name, total, count,
      percent: monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // ---- daily bar data ----
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const total = monthExpenses
      .filter(e => (e.expense_date || toLocalDate(e.created_at || '')) === dayStr)
      .reduce((s, e) => s + Number(e.amount), 0)
    return { day: String(day), total }
  })

  // ---- month navigation ----
  const now = new Date()
  const isNextDisabled = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth())
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (isNextDisabled) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  // ---- category click (toggle) ----
  const handleCatClick = useCallback((name: string) => {
    setActiveCat(prev => prev === name ? null : name)
  }, [])

  const activeCatInfo = activeCat ? catMap[activeCat] ?? null : null

  // ---- AI insights ----
  const fetchInsights = useCallback(async () => {
    if (insightsFetched || insightsLoading) return
    setInsightsLoading(true)
    try {
      const payload = monthExpenses.map(e => ({
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: toLocalDate(e.created_at || ''),
      }))
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: payload }),
      })
      const data = await res.json()
      setInsights(data.insights || [])
      setInsightsFetched(true)
    } catch {
      setInsights(['本月消費分析暫時無法取得，請稍後再試'])
    } finally {
      setInsightsLoading(false)
    }
  }, [monthExpenses, insightsFetched, insightsLoading])

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* ── Header + Month Nav ── */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#2C2019] mb-4">月度報表</h1>
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E8E0D5] shadow-sm active:bg-[#FAF7F2]"
          >
            <svg className="w-4 h-4 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-bold text-[#2C2019]">{year}年{month + 1}月</span>
          <button
            onClick={nextMonth}
            disabled={isNextDisabled}
            className={`w-9 h-9 flex items-center justify-center rounded-full border shadow-sm transition-colors ${
              isNextDisabled ? 'bg-white border-[#E8E0D5] opacity-30 cursor-not-allowed' : 'bg-white border-[#E8E0D5] active:bg-[#FAF7F2]'
            }`}
          >
            <svg className="w-4 h-4 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Total Overview ── */}
      <div className="px-5 mb-5">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8B7355]">本月總花費</p>
            {loading
              ? <div className="h-9 w-36 bg-[#FAF7F2] rounded animate-pulse mt-1" />
              : <p className="text-3xl font-bold text-[#2C2019] mt-0.5">NT${monthTotal.toLocaleString('zh-TW')}</p>
            }
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8B7355]">共</p>
            {loading
              ? <div className="h-9 w-12 bg-[#FAF7F2] rounded animate-pulse mt-1" />
              : <p className="text-3xl font-bold text-[#4CAF7D] mt-0.5">{monthExpenses.length}</p>
            }
            <p className="text-xs text-[#8B7355]">筆記帳</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="px-5 space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-[16px] h-48 animate-pulse" />)}
        </div>
      ) : monthExpenses.length === 0 ? (
        <div className="px-5">
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] p-10 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm text-[#8B7355]">本月還沒有記帳記錄</p>
          </div>
        </div>
      ) : (
        <>
          {/* Charts: pie + bar — rendered as a single unit to preserve recharts types */}
          <ReportCharts
            catData={catData}
            dailyData={dailyData}
            activeCat={activeCat}
            activeCatInfo={activeCatInfo}
            onCatClick={handleCatClick}
            year={year}
            month={month}
            monthExpenses={monthExpenses}
          />

          {/* ── AI 洞察 ── */}
          <div className="px-5 mb-4">
            <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#2C2019]">AI 消費洞察</h2>
                {!insightsFetched && !insightsLoading && (
                  <button
                    onClick={fetchInsights}
                    className="text-xs text-white bg-[#4CAF7D] px-3 py-1 rounded-full font-medium active:opacity-80"
                  >
                    生成分析
                  </button>
                )}
                {insightsFetched && (
                  <button
                    onClick={() => { setInsightsFetched(false); setInsights([]) }}
                    className="text-xs text-[#8B7355] underline"
                  >
                    重新生成
                  </button>
                )}
              </div>

              {insightsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-2">
                      <span className="text-base">💡</span>
                      <div className="flex-1 h-4 bg-[#FAF7F2] rounded animate-pulse" />
                    </div>
                  ))}
                  <p className="text-xs text-[#8B7355] text-center mt-2">AI 分析中，請稍候...</p>
                </div>
              ) : insights.length > 0 ? (
                <div className="space-y-2">
                  {insights.filter(i => i.trim()).map((insight, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 bg-[#FAF7F2] rounded-[10px] px-3 py-2.5 slide-up"
                    >
                      <span className="text-base flex-shrink-0">💡</span>
                      <p className="text-sm text-[#2C2019] leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-[#8B7355]">點「生成分析」讓 AI 分析你本月的消費</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}

function toLocalDate(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
