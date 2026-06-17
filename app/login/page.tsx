'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const supabase = getSupabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.replace('/')
    }
    checkUser()
  }, [router])

  const handleGoogleLogin = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('登入失敗，請重試')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#4CAF7D] rounded-[24px] flex items-center justify-center shadow-[0_8px_32px_rgba(76,175,125,0.3)] mb-5">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <path strokeLinecap="round" d="M2 10h20" />
              <circle cx="16" cy="15" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2C2019]">AI 記帳助手</h1>
          <p className="text-sm text-[#8B7355] mt-1.5">智慧記帳，掌握每一分錢</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(44,32,25,0.08)] border border-[#E8E0D5] p-6">
          <p className="text-sm text-[#8B7355] text-center mb-5">
            使用 Google 帳號登入，資料安全儲存在雲端
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E8E0D5] rounded-[12px] py-3.5 px-4 shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#4CAF7D] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium text-[#2C2019]">登入中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium text-[#2C2019]">用 Google 帳號登入</span>
              </>
            )}
          </button>

          <p className="mt-3 text-sm text-[#8B7355] text-center">
            請使用 Safari 或 Chrome 開啟，避免登入失敗
          </p>

          {error && (
            <p className="mt-2 text-xs text-[#E8736C] text-center">{error}</p>
          )}
        </div>

        <p className="text-xs text-[#8B7355]/60 text-center mt-6 leading-relaxed">
          登入即代表您同意我們使用您的帳號資訊
          <br />來提供個人化記帳服務
        </p>
      </div>
    </div>
  )
}
