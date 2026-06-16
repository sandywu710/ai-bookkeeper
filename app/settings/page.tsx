'use client'

import BottomNav from '@/components/BottomNav'
import { useEffect, useState } from 'react'
import { getUserId } from '@/lib/constants'

export default function SettingsPage() {
  const [userId, setUserId] = useState('')

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-[#2C2019]">設定</h1>
      </div>

      <div className="px-5 space-y-3">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5">
          <h2 className="text-sm font-semibold text-[#2C2019] mb-3">關於 AI 記帳助手</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8B7355]">版本</span>
              <span className="text-[#2C2019]">1.0.0 MVP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B7355]">AI 模型</span>
              <span className="text-[#2C2019]">Gemini 2.5 Flash</span>
            </div>
            <div className="flex flex-col gap-0.5 text-sm">
              <span className="text-[#8B7355]">裝置 ID</span>
              <span className="text-[#2C2019] text-xs font-mono break-all">{userId.slice(0, 16)}...</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-5">
          <h2 className="text-sm font-semibold text-[#2C2019] mb-1">資料說明</h2>
          <p className="text-xs text-[#8B7355] leading-relaxed">
            你的記帳資料存儲在雲端資料庫（Supabase），以裝置 ID 識別，無需登入帳號。
            換裝置後需重新記錄，後續版本將支援帳號登入與跨裝置同步。
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('確定要清除所有本機資料嗎？（雲端資料不受影響）')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
          className="w-full bg-white rounded-[16px] border border-[#E8E0D5] p-4 text-sm text-[#E8736C] font-medium text-left shadow-[0_2px_12px_rgba(44,32,25,0.06)]"
        >
          清除本機暫存資料
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
