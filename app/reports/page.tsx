'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import { CATEGORY_EMOJI } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

// Dynamic import for recharts (avoids SSR issues)
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })

const CATEGORY_COLORS: Record<string, string> = {
  餐飲: '#FF8C69',
  交通: '#4A90D9',
  購物: '#F5A623',
  娛樂: '#9B59B6',
  醫療: '#E8736C',
  住居: '#4CAF7D',
  教育: '#3AAFA9',
  其他: '#95A5A6',
}

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

  const activeCatInfo = activeCat ? catMap[activeCat] : null

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
          {/* ── 圓餅圖 ── */}
          <div className="px-5 mb-5">
            <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
              <h2 className="text-sm font-semibold text-[#2C2019] mb-3">分類占比</h2>
              <div className="flex items-center gap-2">
                {/* Pie */}
                <div className="w-40 h-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catData}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={64}
                        paddingAngle={2}
                        onClick={(d) => setActiveCat(prev => prev === (d.name as string) ? null : (d.name as string))}
                      >
                        {catData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={CATEGORY_COLORS[entry.name] || '#95A5A6'}
                            opacity={activeCat && activeCat !== entry.name ? 0.4 : 1}
                            stroke={activeCat === entry.name ? '#2C2019' : 'transparent'}
                            strokeWidth={activeCat === entry.name ? 2 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`NT$${Number(value).toLocaleString('zh-TW')}`, '']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D5', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  {catData.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => setActiveCat(prev => prev === cat.name ? null : cat.name)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-[6px] transition-colors ${
                        activeCat === cat.name ? 'bg-[#FAF7F2]' : ''
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[cat.name] || '#95A5A6' }}
                      />
                      <span className="text-xs text-[#2C2019] flex-1 text-left truncate">
                        {CATEGORY_EMOJI[cat.name]} {cat.name}
                      </span>
                      <span className="text-xs font-medium text-[#8B7355] flex-shrink-0">{cat.percent}%</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Active category detail */}
              {activeCat && activeCatInfo && (
                <div className="mt-3 pt-3 border-t border-[#E8E0D5] flex justify-between items-center slide-up">
                  <span className="text-sm font-medium text-[#2C2019]">
                    {CATEGORY_EMOJI[activeCat]} {activeCat}
                  </span>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#2C2019]">
                      NT${activeCatInfo.total.toLocaleString('zh-TW')}
                    </span>
                    <span className="text-xs text-[#8B7355] ml-2">{activeCatInfo.count} 筆</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 長條圖 ── */}
          <div className="px-5 mb-5">
            <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
              <h2 className="text-sm font-semibold text-[#2C2019] mb-3">每天花費</h2>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={6}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: '#8B7355' }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8B7355' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    />
                    <Tooltip
                      cursor={{ fill: '#FAF7F2' }}
                      formatter={(value) => [`NT$${Number(value).toLocaleString('zh-TW')}`, '花費']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D5', fontSize: 12 }}
                    />
                    <Bar dataKey="total" fill="#4CAF7D" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

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
