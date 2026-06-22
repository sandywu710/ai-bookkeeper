'use client'

import BottomNav from '@/components/BottomNav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AddToHomeScreenModal } from '@/components/AddToHomeScreen'
import {
  getMonthlyBudget, saveMonthlyBudget,
  CATEGORY_EMOJI, FIXED_CATEGORIES,
} from '@/lib/constants'
import type { CustomCategory } from '@/lib/constants'
import { useAuth } from '@/components/AuthProvider'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

const COMMON_EMOJIS = ['🎯','🎁','🏋️','🐶','🌸','🍺','🎵','🚀','💻','📷','🧘','✈️','🎀','🌊','☕','🍕','🏠','💼','🛒','🎮']

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [budgetInput, setBudgetInput] = useState('30000')
  const [budgetSaved, setBudgetSaved] = useState(false)
  const [customCats, setCustomCats] = useState<CustomCategory[]>([])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🎯')
  const [loggingOut, setLoggingOut] = useState(false)
  const [showAddToHome, setShowAddToHome] = useState(false)

  useEffect(() => {
    setBudgetInput(String(getMonthlyBudget()))
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/custom-categories')
      const { data } = await res.json()
      const cloudCats: CustomCategory[] = data || []

      if (cloudCats.length === 0) {
        // Migration: move localStorage categories to Supabase
        const raw = typeof window !== 'undefined' ? localStorage.getItem('customCategories') : null
        const localCats: CustomCategory[] = raw ? JSON.parse(raw) : []
        if (localCats.length > 0) {
          const migrated: CustomCategory[] = []
          for (const cat of localCats) {
            const r = await fetch('/api/custom-categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cat.name, emoji: cat.emoji }),
            })
            if (r.ok) {
              const { data: d } = await r.json()
              migrated.push(d)
            }
          }
          setCustomCats(migrated)
          localStorage.removeItem('customCategories')
          return
        }
      }

      setCustomCats(cloudCats)
    } catch {
      try {
        const raw = localStorage.getItem('customCategories')
        setCustomCats(raw ? JSON.parse(raw) : [])
      } catch {}
    }
  }

  const saveBudget = () => {
    const v = Number(budgetInput)
    if (!v || v <= 0) return
    saveMonthlyBudget(v)
    setBudgetSaved(true)
    setTimeout(() => setBudgetSaved(false), 2000)
  }

  const addCustomCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    const allFixed = [...FIXED_CATEGORIES as unknown as string[]]
    const allCustom = customCats.map(c => c.name)
    if (allFixed.includes(name) || allCustom.includes(name)) return

    try {
      const res = await fetch('/api/custom-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji: newCatEmoji }),
      })
      if (!res.ok) throw new Error('新增失敗')
      const { data } = await res.json()
      setCustomCats(prev => [...prev, data])
    } catch {
      setCustomCats(prev => [...prev, { name, emoji: newCatEmoji }])
    }

    setNewCatName('')
    setNewCatEmoji('🎯')
    setShowAddCat(false)
  }

  const deleteCustomCategory = async (cat: CustomCategory) => {
    setCustomCats(prev => prev.filter(c => c.name !== cat.name))
    if (cat.id) {
      await fetch(`/api/custom-categories?id=${cat.id}`, { method: 'DELETE' })
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#2C2019]">設定</h1>
      </div>

      <div className="px-5 space-y-4">

        {/* ── 帳號資訊 ── */}
        {user && (
          <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5">
            <h2 className="text-sm font-semibold text-[#8B7355] mb-3">登入帳號</h2>
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="頭貼"
                  className="w-12 h-12 rounded-full object-cover border border-[#E8E0D5]"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#4CAF7D]/20 flex items-center justify-center">
                  <span className="text-xl text-[#4CAF7D]">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {user.user_metadata?.full_name && (
                  <p className="text-sm font-semibold text-[#2C2019] truncate">{user.user_metadata.full_name}</p>
                )}
                <p className="text-xs text-[#8B7355] truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 月預算 ── */}
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5">
          <h2 className="text-sm font-semibold text-[#8B7355] mb-3">月預算設定</h2>
          <p className="text-xs text-[#8B7355] mb-3">設定後首頁進度條會依此計算，超過預算會變紅色。</p>
          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#E8E0D5] rounded-[12px] px-4 py-3 mb-3 focus-within:border-[#4CAF7D] transition-colors">
            <span className="text-sm text-[#8B7355]">NT$</span>
            <input
              type="number"
              value={budgetInput}
              onChange={e => { setBudgetInput(e.target.value); setBudgetSaved(false) }}
              className="flex-1 text-xl font-bold text-[#2C2019] bg-transparent outline-none"
              placeholder="30000"
            />
          </div>
          <button
            onClick={saveBudget}
            className={`w-full py-3 rounded-[12px] text-sm font-bold transition-all ${
              budgetSaved ? 'bg-[#FAF7F2] text-[#4CAF7D] border border-[#4CAF7D]' : 'bg-[#4CAF7D] text-white active:scale-95'
            }`}
          >
            {budgetSaved ? '✓ 已儲存' : '儲存預算'}
          </button>
        </div>

        {/* ── 自訂分類 ── */}
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#8B7355]">分類管理</h2>
            <button
              onClick={() => setShowAddCat(v => !v)}
              className="flex items-center gap-1 text-xs text-[#4CAF7D] font-medium bg-[#4CAF7D]/10 px-3 py-1.5 rounded-full"
            >
              <span className="text-base leading-none">＋</span> 新增分類
            </button>
          </div>

          {showAddCat && (
            <div className="bg-[#FAF7F2] rounded-[12px] p-4 mb-3 border border-[#E8E0D5]">
              <p className="text-xs text-[#8B7355] font-medium mb-2">分類名稱</p>
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="例：寵物、旅遊..."
                maxLength={8}
                className="w-full bg-white border border-[#E8E0D5] rounded-[8px] px-3 py-2 text-sm text-[#2C2019] outline-none focus:border-[#4CAF7D] mb-3"
              />
              <p className="text-xs text-[#8B7355] font-medium mb-2">選擇 Emoji</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewCatEmoji(emoji)}
                    className={`w-9 h-9 text-lg flex items-center justify-center rounded-[8px] border transition-all ${
                      newCatEmoji === emoji ? 'border-[#4CAF7D] bg-[#4CAF7D]/10' : 'border-[#E8E0D5] bg-white'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAddCat(false); setNewCatName('') }} className="flex-1 py-2.5 rounded-[10px] border border-[#E8E0D5] text-sm text-[#8B7355]">取消</button>
                <button
                  onClick={addCustomCategory}
                  disabled={!newCatName.trim()}
                  className={`flex-1 py-2.5 rounded-[10px] text-sm font-bold ${newCatName.trim() ? 'bg-[#4CAF7D] text-white' : 'bg-[#E8E0D5] text-[#8B7355] cursor-not-allowed'}`}
                >
                  新增
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-[#8B7355] mb-2">固定分類</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {(FIXED_CATEGORIES as unknown as string[]).map(cat => (
              <span key={cat} className="flex items-center gap-1 px-2.5 py-1 bg-[#FAF7F2] rounded-[8px] text-xs text-[#8B7355] border border-[#E8E0D5]">
                {CATEGORY_EMOJI[cat] || '💸'} {cat}
              </span>
            ))}
          </div>

          {customCats.length > 0 && (
            <>
              <p className="text-xs text-[#8B7355] mb-2">自訂分類</p>
              <div className="space-y-2">
                {customCats.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between bg-[#FAF7F2] rounded-[10px] px-3 py-2.5 border border-[#E8E0D5]">
                    <span className="text-sm text-[#2C2019]">{cat.emoji} {cat.name}</span>
                    <button
                      onClick={() => deleteCustomCategory(cat)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-[#E8736C] hover:bg-[#E8736C]/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {customCats.length === 0 && !showAddCat && (
            <p className="text-xs text-[#8B7355]/60 text-center py-2">還沒有自訂分類</p>
          )}
        </div>

        {/* ── 加入主畫面 ── */}
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] overflow-hidden">
          <button
            onClick={() => setShowAddToHome(true)}
            className="w-full flex items-center gap-4 px-5 py-4 active:bg-[#FAF7F2] transition-colors"
          >
            <span className="text-xl flex-shrink-0">📱</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-[#2C2019]">如何加入主畫面</p>
              <p className="text-xs text-[#8B7355] mt-0.5">像 APP 一樣使用本網站</p>
            </div>
            <svg className="w-4 h-4 text-[#8B7355] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── 登出 ── */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full py-4 text-sm font-medium text-[#E8736C] disabled:opacity-50"
        >
          {loggingOut ? '登出中...' : '登出'}
        </button>
      </div>

      {showAddToHome && <AddToHomeScreenModal onClose={() => setShowAddToHome(false)} />}

      <BottomNav />
    </div>
  )
}
