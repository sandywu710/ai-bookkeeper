'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { FIXED_CATEGORIES, CATEGORY_EMOJI } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function getExpenseDate(e: { expense_date?: string; created_at?: string }): string {
  if (e.expense_date) return e.expense_date
  if (!e.created_at) return ''
  const d = new Date(e.created_at)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function RecordsPageContent() {
  const searchParams = useSearchParams()
  const urlDate = searchParams.get('date')
  const today = new Date().toISOString().split('T')[0]
  const initialDate = urlDate || today

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [calendarYear, setCalendarYear] = useState(() => {
    const d = new Date(initialDate + 'T00:00:00')
    return d.getFullYear()
  })
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(initialDate + 'T00:00:00')
    return d.getMonth()
  })
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [allCategories, setAllCategories] = useState<string[]>([...FIXED_CATEGORIES])
  const [emojiMap, setEmojiMap] = useState<Record<string, string>>(CATEGORY_EMOJI)

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/expenses?limit=500')
      const { data } = await res.json()
      if (data) setExpenses(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExpenses()
    fetch('/api/custom-categories')
      .then(r => r.json())
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAllCategories([...FIXED_CATEGORIES, ...data.map((c: { name: string }) => c.name)])
          const extra: Record<string, string> = {}
          data.forEach((c: { name: string; emoji: string }) => { extra[c.name] = c.emoji })
          setEmojiMap({ ...CATEGORY_EMOJI, ...extra })
        }
      })
      .catch(() => {})
  }, [loadExpenses])

  const monthExpenses = expenses.filter(e => {
    const ds = getExpenseDate(e)
    if (!ds) return false
    const [y, m] = ds.split('-').map(Number)
    return y === calendarYear && m === calendarMonth + 1
  })
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const monthCount = monthExpenses.length

  const datesWithExpense = new Set(monthExpenses.map(e => getExpenseDate(e)))
  const dayExpenses = expenses.filter(e => getExpenseDate(e) === selectedDate)
  const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
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
    <div className="flex flex-col min-h-screen pb-20">
      {/* 月份統計小卡 */}
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

      {/* 月曆 */}
      <div className="px-5 mb-4">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF7F2] border border-[#E8E0D5] active:bg-[#E8E0D5]">
              <svg className="w-4 h-4 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-base font-bold text-[#2C2019]">{calendarYear}年{calendarMonth + 1}月</span>
            <button onClick={nextMonth} disabled={isNextDisabled} className={`w-8 h-8 flex items-center justify-center rounded-full border ${isNextDisabled ? 'opacity-30 cursor-not-allowed bg-[#FAF7F2] border-[#E8E0D5]' : 'bg-[#FAF7F2] border-[#E8E0D5] active:bg-[#E8E0D5]'}`}>
              <svg className="w-4 h-4 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(w => <div key={w} className="text-center text-[10px] font-medium text-[#8B7355] py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calendarCells.map((day, idx) => {
              if (day === null) return <div key={idx} />
              const dateStr = cellDateStr(day)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const hasExpense = datesWithExpense.has(dateStr)
              return (
                <button key={idx} onClick={() => setSelectedDate(dateStr)} className="flex flex-col items-center py-1 rounded-[8px] active:bg-[#FAF7F2]">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${isSelected ? 'bg-[#4CAF7D] text-white' : isToday ? 'border-2 border-[#4CAF7D] text-[#4CAF7D]' : 'text-[#2C2019]'}`}>
                    {day}
                  </span>
                  {hasExpense ? <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D] mt-0.5" /> : <span className="w-1.5 h-1.5 mt-0.5" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 當天明細 */}
      <div className="px-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-[#2C2019]">{selectedLabel}</h2>
          {dayExpenses.length > 0 && (
            <span className="text-sm text-[#8B7355]">共 <span className="font-bold text-[#2C2019]">NT${dayTotal.toLocaleString('zh-TW')}</span></span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="bg-white rounded-[16px] h-16 animate-pulse" />)}</div>
        ) : dayExpenses.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] p-6 text-center">
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm text-[#8B7355]">這天還沒有記帳</p>
            <Link href={`/add?date=${selectedDate}`} className="mt-3 inline-block text-sm text-[#4CAF7D] font-medium">+ 新增記帳</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {dayExpenses.map(expense => (
              <DayExpenseItem
                key={expense.id}
                expense={expense}
                emojiMap={emojiMap}
                onEdit={() => setEditingExpense(expense)}
                onDeleted={loadExpenses}
              />
            ))}
            <Link
              href={`/add?date=${selectedDate}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-[14px] border border-[#4CAF7D] text-sm font-medium text-[#4CAF7D] bg-transparent active:bg-[#4CAF7D]/5 transition-colors mt-1"
            >
              <span className="text-base leading-none">＋</span>
              在這天新增記帳
            </Link>
          </div>
        )}
      </div>

      <BottomNav />

      {editingExpense && (
        <EditModal
          expense={editingExpense}
          allCategories={allCategories}
          emojiMap={emojiMap}
          onClose={() => setEditingExpense(null)}
          onSaved={() => { setEditingExpense(null); loadExpenses() }}
        />
      )}
    </div>
  )
}

export default function RecordsPage() {
  return (
    <Suspense fallback={null}>
      <RecordsPageContent />
    </Suspense>
  )
}

// ── Swipe Item ──────────────────────────────────────────────
function DayExpenseItem({
  expense,
  emojiMap,
  onEdit,
  onDeleted,
}: {
  expense: Expense
  emojiMap: Record<string, string>
  onEdit: () => void
  onDeleted: () => void
}) {
  const [swipedPx, setSwipedPx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const SNAP = 160
  const THRESHOLD = 60

  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/expenses/delete?id=${expense.id}`, { method: 'DELETE' })
    onDeleted()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const startX = e.touches[0].clientX
    const startSwipe = swipedPx
    const el = e.currentTarget as HTMLDivElement
    let dx = 0

    const onMove = (ev: Event) => {
      const t = ev as TouchEvent
      dx = startX - t.touches[0].clientX
      if (dx > 0) setSwipedPx(Math.min(startSwipe + dx, SNAP))
      else if (dx < 0) setSwipedPx(Math.max(startSwipe + dx, 0))
    }
    const onEnd = () => {
      if (startSwipe < SNAP / 2 && dx > THRESHOLD) setSwipedPx(SNAP)
      else if (dx < -THRESHOLD / 2) setSwipedPx(0)
      else setSwipedPx(startSwipe >= SNAP / 2 ? SNAP : 0)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd)
  }

  return (
    <>
      {/* Outer container: overflow-hidden clips the sliding action buttons */}
      <div
        className="relative rounded-[16px] overflow-hidden"
        onTouchStart={handleTouchStart}
        onClick={() => { if (swipedPx > 0) setSwipedPx(0) }}
      >
        {/* Card — STATIC, never moves. Amount is always visible on the right. */}
        <div className="bg-white border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4 flex items-center gap-3">
          <span className="text-2xl flex-shrink-0">{emojiMap[expense.category] || '💸'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#2C2019] text-sm truncate">{expense.description}</p>
            <p className="text-xs text-[#8B7355] mt-0.5">{expense.category} · {formatTime(expense.created_at)}</p>
          </div>
          <span className="text-base font-bold text-[#2C2019] flex-shrink-0">NT${Number(expense.amount).toLocaleString('zh-TW')}</span>
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="p-1.5 rounded-[6px] text-[#4A90D9] hover:bg-[#4A90D9]/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }} className="p-1.5 rounded-[6px] text-[#E8736C] hover:bg-[#E8736C]/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        {/* Action buttons — slides in from the right as an overlay.
            Starts at translateX(SNAP) = fully hidden; slides to translateX(0) = fully visible. */}
        <div
          className="absolute inset-y-0 right-0 flex z-10 rounded-r-[16px] overflow-hidden transition-transform duration-150"
          style={{ width: SNAP, transform: `translateX(${Math.max(0, SNAP - swipedPx)}px)` }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setSwipedPx(0); onEdit() }}
            className="flex-1 bg-[#4A90D9] flex flex-col items-center justify-center text-white text-xs font-medium gap-0.5 active:brightness-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            編輯
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSwipedPx(0); setConfirmDelete(true) }}
            className="flex-1 bg-[#E8736C] flex flex-col items-center justify-center text-white text-xs font-medium gap-0.5 rounded-r-[16px] active:brightness-90"
          >
            {deleting
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spinner" />
              : <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  刪除
                </>
            }
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-[20px] p-6 w-full max-w-[320px] shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-[#E8736C]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#E8736C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-[#2C2019] mb-1">確定要刪除？</h3>
              <p className="text-sm text-[#8B7355]">{expense.description} · NT${Number(expense.amount).toLocaleString('zh-TW')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-[12px] border border-[#E8E0D5] text-sm font-medium text-[#8B7355]">取消</button>
              <button onClick={() => { setConfirmDelete(false); handleDelete() }} className="flex-1 py-3 rounded-[12px] bg-[#E8736C] text-white text-sm font-bold">刪除</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Edit Modal ──────────────────────────────────────────────
function EditModal({
  expense,
  allCategories,
  emojiMap,
  onClose,
  onSaved,
}: {
  expense: Expense
  allCategories: string[]
  emojiMap: Record<string, string>
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] = useState(String(expense.amount))
  const [category, setCategory] = useState(expense.category)
  const [description, setDescription] = useState(expense.description)
  const [expenseDate, setExpenseDate] = useState(
    expense.expense_date || toLocalDate(expense.created_at || '') || new Date().toISOString().split('T')[0]
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/expenses/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expense.id, amount: Number(amount), category, description, expense_date: expenseDate }),
      })
      if (!res.ok) throw new Error('更新失敗')
      onSaved()
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-[24px] sm:rounded-[20px] w-full max-w-[430px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#2C2019]">編輯記帳</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF7F2] border border-[#E8E0D5]">
            <svg className="w-4 h-4 text-[#8B7355]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#8B7355] mb-1.5 block">金額</label>
            <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8E0D5] rounded-[12px] px-4 py-3 focus-within:border-[#4CAF7D] transition-colors">
              <span className="text-sm text-[#8B7355]">NT$</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1 text-2xl font-bold text-[#2C2019] bg-transparent outline-none" autoFocus />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8B7355] mb-1.5 block">分類</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-sm border transition-all ${category === cat ? 'bg-[#4CAF7D] text-white border-[#4CAF7D]' : 'bg-[#FAF7F2] text-[#8B7355] border-[#E8E0D5]'}`}>
                  <span>{emojiMap[cat] || '💸'}</span>{cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#8B7355] mb-1.5 block">描述</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#FAF7F2] border border-[#E8E0D5] rounded-[12px] px-4 py-3 text-sm text-[#2C2019] outline-none focus:border-[#4CAF7D] transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8B7355] mb-1.5 block">日期</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full bg-[#FAF7F2] border border-[#E8E0D5] rounded-[12px] px-4 py-3 text-sm text-[#2C2019] outline-none focus:border-[#4CAF7D] transition-colors" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-[12px] border border-[#E8E0D5] text-sm font-medium text-[#8B7355]">取消</button>
          <button onClick={handleSave} disabled={saving || !amount || Number(amount) <= 0}
            className={`flex-1 py-3.5 rounded-[12px] text-sm font-bold transition-all ${saving || !amount || Number(amount) <= 0 ? 'bg-[#E8E0D5] text-[#8B7355] cursor-not-allowed' : 'bg-[#4CAF7D] text-white active:scale-95'}`}>
            {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />儲存中...</span> : '儲存'}
          </button>
        </div>
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
