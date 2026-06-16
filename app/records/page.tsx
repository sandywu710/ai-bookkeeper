'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { CATEGORY_EMOJI, getUserId } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function RecordsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const userId = getUserId()
      const res = await fetch(`/api/expenses?user_id=${userId}&limit=500`)
      const { data } = await res.json()
      if (data) setExpenses(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  // --- derived data ---
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.created_at || '')
    return d.getFullYear() === calendarYear && d.getMonth() === calendarMonth
  })
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const monthCount = monthExpenses.length

  // dates that have at least one expense (yyyy-mm-dd)
  const datesWithExpense = new Set(
    expenses
      .filter(e => {
        const d = new Date(e.created_at || '')
        return d.getFullYear() === calendarYear && d.getMonth() === calendarMonth
      })
      .map(e => toLocalDate(e.created_at || ''))
  )

  // selected day expenses
  const dayExpenses = expenses.filter(e => toLocalDate(e.created_at || '') === selectedDate)
  const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount), 0)

  // --- calendar grid ---
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to full rows
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  const todayStr = new Date().toISOString().split('T')[0]

  function cellDateStr(day: number) {
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  function prevMonth() {
    if (calendarMonth === 0) { setCalendarYear(y => y - 1); setCalendarMonth(11) }
    else setCalendarMonth(m => m - 1)
  }
  function nextMonth() {
    const now = new Date()
    if (calendarYear > now.getFullYear() || (calendarYear === now.getFullYear() && calendarMonth >= now.getMonth())) return
    if (calendarMonth === 11) { setCalendarYear(y => y + 1); setCalendarMonth(0) }
    else setCalendarMonth(m => m + 1)
  }

  const isNextDisabled = (() => {
    const now = new Date()
    return calendarYear > now.getFullYear() || (calendarYear === now.getFullYear() && calendarMonth >= now.getMonth())
  })()

  const selectedLabel = (() => {
    const d = new Date(selectedDate + 'T00:00:00')
    return `${d.getMonth() + 1}月${d.getDate()}日`
  })()

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* ── 月份統計小卡 ── */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#2C2019] mb-4">記帳記錄</h1>
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#8B7355]">{calendarYear}年{calendarMonth + 1}月</p>
            {loading
              ? <div className="h-8 w-32 bg-[#FAF7F2] rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-[#2C2019] mt-0.5">NT${monthTotal.toLocaleString('zh-TW')}</p>
            }
          </div>
          <div className="text-right">
            <p className="text-xs text-[#8B7355]">共</p>
            {loading
              ? <div className="h-8 w-12 bg-[#FAF7F2] rounded animate-pulse mt-1" />
              : <p className="text-2xl font-bold text-[#4CAF7D] mt-0.5">{monthCount}</p>
            }
            <p className="text-xs text-[#8B7355]">筆</p>
          </div>
        </div>
      </div>

      {/* ── 月曆區塊 ── */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF7F2] border border-[#E8E0D5] active:bg-[#E8E0D5] transition-colors"
            >
              <svg className="w-4 h-4 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-base font-bold text-[#2C2019]">{calendarYear}年{calendarMonth + 1}月</span>
            <button
              onClick={nextMonth}
              disabled={isNextDisabled}
              className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${
                isNextDisabled
                  ? 'bg-[#FAF7F2] border-[#E8E0D5] opacity-30 cursor-not-allowed'
                  : 'bg-[#FAF7F2] border-[#E8E0D5] active:bg-[#E8E0D5]'
              }`}
            >
              <svg className="w-4 h-4 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[10px] font-medium text-[#8B7355] py-1">{w}</div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={idx} />
              const dateStr = cellDateStr(day)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const hasExpense = datesWithExpense.has(dateStr)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(dateStr)}
                  className="flex flex-col items-center py-1 rounded-[8px] transition-colors active:bg-[#FAF7F2]"
                >
                  <span
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#4CAF7D] text-white'
                        : isToday
                        ? 'border-2 border-[#4CAF7D] text-[#4CAF7D]'
                        : 'text-[#2C2019]'
                    }`}
                  >
                    {day}
                  </span>
                  {hasExpense ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D] mt-0.5" />
                  ) : (
                    <span className="w-1.5 h-1.5 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 當天明細 ── */}
      <div className="px-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-[#2C2019]">{selectedLabel}</h2>
          {dayExpenses.length > 0 && (
            <span className="text-sm text-[#8B7355]">
              共花費 <span className="font-bold text-[#2C2019]">NT${dayTotal.toLocaleString('zh-TW')}</span>
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="bg-white rounded-[16px] h-16 animate-pulse" />)}
          </div>
        ) : dayExpenses.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] p-6 text-center">
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm text-[#8B7355]">這天還沒有記帳</p>
            <Link href="/add" className="mt-3 inline-block text-sm text-[#4CAF7D] font-medium">
              + 新增記帳
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {dayExpenses.map(expense => (
              <DayExpenseItem key={expense.id} expense={expense} onDeleted={loadExpenses} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DayExpenseItem({ expense, onDeleted }: { expense: Expense; onDeleted: () => void }) {
  const [swiped, setSwiped] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/expenses/delete?id=${expense.id}`, { method: 'DELETE' })
    onDeleted()
  }

  return (
    <div className="relative overflow-hidden rounded-[16px]">
      {swiped && (
        <div className="absolute inset-y-0 right-0 w-20 bg-[#E8736C] flex items-center justify-center z-10 rounded-r-[16px]">
          {deleting
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
            : <button onClick={handleDelete} className="text-white text-sm font-medium">刪除</button>
          }
        </div>
      )}
      <div
        className={`bg-white border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4 flex items-center gap-3 transition-transform ${swiped ? '-translate-x-16' : 'translate-x-0'}`}
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX
          let moved = false
          const el = e.currentTarget
          const onMove = (ev: TouchEvent) => {
            if (startX - ev.touches[0].clientX > 40) { moved = true; setSwiped(true) }
            else if (ev.touches[0].clientX - startX > 10) setSwiped(false)
          }
          const onEnd = () => {
            if (!moved) setSwiped(false)
            el.removeEventListener('touchmove', onMove)
            el.removeEventListener('touchend', onEnd)
          }
          el.addEventListener('touchmove', onMove)
          el.addEventListener('touchend', onEnd)
        }}
        onClick={() => { if (swiped) setSwiped(false) }}
      >
        <span className="text-2xl flex-shrink-0">{CATEGORY_EMOJI[expense.category] || '💸'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#2C2019] text-sm truncate">{expense.description}</p>
          <p className="text-xs text-[#8B7355] mt-0.5">{expense.category} · {formatTime(expense.created_at)}</p>
        </div>
        <span className="text-base font-bold text-[#2C2019] flex-shrink-0">
          NT${Number(expense.amount).toLocaleString('zh-TW')}
        </span>
      </div>
    </div>
  )
}

function toLocalDate(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
