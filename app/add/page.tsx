'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FIXED_CATEGORIES, getAllCategories, getAllCategoryEmoji, getCustomCategories } from '@/lib/constants'

type ParsedExpense = {
  amount: number
  category: string
  description: string
  confidence: number
}

export default function AddPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedExpense | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [manualAmount, setManualAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date().toISOString().split('T')[0]
    const params = new URLSearchParams(window.location.search)
    return params.get('date') || new Date().toISOString().split('T')[0]
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [allCategories, setAllCategories] = useState<string[]>([...FIXED_CATEGORIES])
  const [emojiMap, setEmojiMap] = useState(getAllCategoryEmoji())

  useEffect(() => {
    setAllCategories(getAllCategories())
    setEmojiMap(getAllCategoryEmoji())
    inputRef.current?.focus()
  }, [])

  const parseExpense = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 2) {
      setParsed(null); setParseError(''); return
    }
    setIsParsing(true); setParseError('')
    try {
      const customCategories = getCustomCategories()
      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text, customCategories }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsed(data)
      setManualAmount(String(data.amount))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'AI 解析失敗')
      setParsed(null)
    } finally {
      setIsParsing(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => parseExpense(input), 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input, parseExpense])

  const handleSave = async () => {
    const finalAmount = Number(manualAmount || parsed?.amount)
    if (!finalAmount || finalAmount <= 0 || !parsed) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          category: parsed.category,
          description: parsed.description,
          raw_input: input,
          expense_date: expenseDate,
        }),
      })
      if (!res.ok) throw new Error('儲存失敗')
      const { data } = await res.json()
      router.push(`/add/success?amount=${finalAmount}&category=${encodeURIComponent(parsed.category)}&description=${encodeURIComponent(parsed.description)}&id=${data.id}`)
    } catch {
      setIsSaving(false)
    }
  }

  const canSave = parsed && Number(manualAmount) > 0 && !isParsing

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-[#FAF7F2]">
        <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E8E0D5] shadow-sm">
          <svg className="w-5 h-5 text-[#2C2019]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-[#2C2019]">快速記帳</h1>
      </div>

      <div className="flex-1 px-5 pb-32">
        {/* Input */}
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] overflow-hidden mb-5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'例：午餐便當85\n計程車230\n超市買菜480'}
            className="w-full p-4 text-base text-[#2C2019] bg-transparent resize-none outline-none placeholder-[#8B7355]/50 min-h-[100px]"
            rows={3}
          />
          {input && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#E8E0D5] bg-[#FAF7F2]/50">
              <span className="text-xs text-[#8B7355]">{isParsing ? 'AI 解析中...' : parsed ? '解析完成' : ''}</span>
              <button onClick={() => { setInput(''); setParsed(null); setParseError('') }} className="text-xs text-[#8B7355] underline">清除</button>
            </div>
          )}
        </div>

        {/* Parsing */}
        {isParsing && (
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] p-5 flex items-center gap-3 mb-4 slide-up">
            <div className="w-6 h-6 border-2 border-[#4CAF7D] border-t-transparent rounded-full spinner flex-shrink-0" />
            <p className="text-sm text-[#8B7355]">AI 正在解析你的支出...</p>
          </div>
        )}

        {/* Parse Error — show full category picker */}
        {parseError && !isParsing && (
          <div className="bg-[#E8736C]/10 rounded-[16px] border border-[#E8736C]/20 p-4 mb-4 slide-up">
            <p className="text-sm text-[#E8736C] font-medium mb-3">{parseError}</p>
            <div className="mb-3">
              <label className="text-xs text-[#8B7355] mb-1 block">金額</label>
              <input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="請輸入金額"
                className="w-full bg-white border border-[#E8E0D5] rounded-[8px] px-3 py-2 text-sm text-[#2C2019] outline-none"
              />
            </div>
            <label className="text-xs text-[#8B7355] mb-1.5 block">選擇分類</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setParsed({ amount: Number(manualAmount) || 0, category: cat, description: input, confidence: 0.5 })
                    setParseError('')
                    if (manualAmount) setManualAmount(manualAmount)
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-sm border transition-all ${
                    parsed?.category === cat ? 'bg-[#4CAF7D] text-white border-[#4CAF7D]' : 'bg-white text-[#8B7355] border-[#E8E0D5]'
                  }`}
                >
                  <span>{emojiMap[cat] || '💸'}</span>{cat}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-[#8B7355] mb-1 block">日期</label>
              <input
                type="date"
                value={expenseDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-white border border-[#E8E0D5] rounded-[8px] px-3 py-2 text-sm text-[#2C2019] outline-none"
              />
            </div>
          </div>
        )}

        {/* Parsed Result */}
        {parsed && !isParsing && (
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5 slide-up">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#4CAF7D]" />
              <span className="text-xs text-[#4CAF7D] font-medium">AI 解析完成</span>
            </div>
            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs text-[#8B7355] mb-1 block">金額</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#8B7355]">NT$</span>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="text-3xl font-bold text-[#2C2019] bg-[#FAF7F2] rounded-[8px] px-3 py-1.5 w-full outline-none border border-[#E8E0D5] focus:border-[#4CAF7D] transition-colors"
                />
              </div>
            </div>
            {/* Category */}
            <div className="mb-4">
              <label className="text-xs text-[#8B7355] mb-1.5 block">分類（點選修改）</label>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setParsed({ ...parsed, category: cat })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-medium border transition-all ${
                      parsed.category === cat ? 'bg-[#4CAF7D] text-white border-[#4CAF7D]' : 'bg-[#FAF7F2] text-[#8B7355] border-[#E8E0D5]'
                    }`}
                  >
                    <span>{emojiMap[cat] || '💸'}</span>{cat}
                  </button>
                ))}
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="text-xs text-[#8B7355] mb-1 block">備註</label>
              <input
                type="text"
                value={parsed.description}
                onChange={(e) => setParsed({ ...parsed, description: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E8E0D5] rounded-[8px] px-3 py-2 text-sm text-[#2C2019] outline-none focus:border-[#4CAF7D] transition-colors"
              />
            </div>
            {/* Date */}
            <div>
              <label className="text-xs text-[#8B7355] mb-1 block">日期</label>
              <input
                type="date"
                value={expenseDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E0D5] rounded-[8px] px-3 py-2 text-sm text-[#2C2019] outline-none focus:border-[#4CAF7D] transition-colors"
              />
            </div>
          </div>
        )}

        {!input && !isParsing && !parsed && (
          <div className="mt-8 text-center">
            <p className="text-4xl mb-3">✏️</p>
            <p className="text-sm text-[#8B7355]">在上方輸入支出內容</p>
            <p className="text-xs text-[#8B7355]/70 mt-1">AI 會自動識別金額和分類</p>
          </div>
        )}
      </div>

      {/* Bottom Save */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 py-4 bg-[#FAF7F2] border-t border-[#E8E0D5]">
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`w-full py-4 rounded-[12px] text-base font-bold transition-all ${
            canSave && !isSaving
              ? 'bg-[#4CAF7D] text-white shadow-[0_4px_16px_rgba(76,175,125,0.35)] active:scale-95'
              : 'bg-[#E8E0D5] text-[#8B7355] cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner" />
              儲存中...
            </span>
          ) : '確認記帳'}
        </button>
      </div>
    </div>
  )
}
