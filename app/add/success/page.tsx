'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CATEGORY_EMOJI } from '@/lib/constants'

function SuccessContent() {
  const params = useSearchParams()
  const amount = params.get('amount') || '0'
  const category = params.get('category') || '其他'
  const description = params.get('description') || ''

  const [todayTotal, setTodayTotal] = useState<number | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchTodayTotal = async () => {
      try {
        const res = await fetch('/api/expenses?limit=100')
        const { data } = await res.json()
        if (!data) return

        const today = new Date().toISOString().split('T')[0]
        const todayExpenses = data.filter((e: { expense_date?: string; created_at?: string }) => {
          const d = (e.expense_date || e.created_at || '').split('T')[0]
          return d === today
        })
        const total = todayExpenses.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0)
        setTodayTotal(total)
      } catch {
        setTodayTotal(null)
      }
    }
    fetchTodayTotal()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      {/* Check Animation */}
      <div
        className={`transition-all duration-500 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        <div className="relative w-24 h-24 mb-6">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="#4CAF7D"
              className="check-circle"
            />
            <polyline
              points="28,52 44,68 72,35"
              fill="none"
              stroke="white"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-mark"
            />
          </svg>
        </div>
      </div>

      <div
        className={`transition-all duration-500 delay-300 ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-2xl font-bold text-[#2C2019] mb-2">記帳完成！</h1>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl">{CATEGORY_EMOJI[category] || '💸'}</span>
          <span className="text-xl font-bold text-[#4CAF7D]">
            NT${Number(amount).toLocaleString('zh-TW')}
          </span>
          <span className="text-base text-[#8B7355]">· {category}</span>
        </div>
        {description && (
          <p className="text-sm text-[#8B7355] mb-6">{description}</p>
        )}

        {/* Today Total */}
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] px-6 py-4 mb-8">
          <p className="text-sm text-[#8B7355]">今天已花費</p>
          {todayTotal === null ? (
            <div className="h-8 w-32 bg-[#FAF7F2] rounded animate-pulse mt-1 mx-auto" />
          ) : (
            <p className="text-2xl font-bold text-[#2C2019] mt-0.5">
              NT${todayTotal.toLocaleString('zh-TW')}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <Link
            href="/add"
            className="flex items-center justify-center gap-2 w-full bg-[#4CAF7D] text-white font-bold text-base rounded-[12px] py-4 shadow-[0_4px_16px_rgba(76,175,125,0.35)] active:scale-95 transition-transform"
          >
            <span>＋</span> 再記一筆
          </Link>
          <Link
            href="/records"
            className="flex items-center justify-center w-full bg-white text-[#2C2019] font-medium text-base rounded-[12px] py-4 border border-[#E8E0D5] shadow-sm active:scale-95 transition-transform"
          >
            查看今日記錄
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-[#4CAF7D] border-t-transparent rounded-full spinner" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
