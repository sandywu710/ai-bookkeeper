'use client'

import { useState, useEffect } from 'react'

type DeviceType = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'other'

function detectDevice(): DeviceType {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isChrome = /CriOS/.test(ua) // Chrome on iOS uses CriOS
  const isAndroid = /Android/.test(ua)
  const isAndroidChrome = isAndroid && /Chrome/.test(ua)

  if (isIOS && isChrome) return 'ios-chrome'
  if (isIOS) return 'ios-safari'
  if (isAndroidChrome) return 'android-chrome'
  return 'other'
}

function isPWAMode(): boolean {
  if (typeof window === 'undefined') return false
  if ((window.navigator as { standalone?: boolean }).standalone === true) return true
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return false
}

function getDeviceLabel(device: DeviceType): string {
  switch (device) {
    case 'ios-safari': return 'iPhone Safari'
    case 'ios-chrome': return 'iPhone Chrome'
    case 'android-chrome': return 'Android Chrome'
    default: return '其他裝置'
  }
}

type Step = { text: string; img: string }

function getSteps(device: DeviceType): Step[] {
  switch (device) {
    case 'ios-safari':
      return [
        { text: '點擊畫面下方工具列的「分享」圖示（方框＋箭頭）', img: '/onboarding/ios-safari-step1.png' },
        { text: '往下滑動選單，找到「加入主畫面」', img: '/onboarding/ios-safari-step2.png' },
        { text: '點擊右上角「新增」即完成', img: '/onboarding/ios-safari-step3.png' },
      ]
    case 'ios-chrome':
      return [
        { text: '點擊畫面右上角的「分享」圖示', img: '/onboarding/ios-chrome-step1.png' },
        { text: '選擇「加入主畫面」', img: '/onboarding/ios-chrome-step2.png' },
        { text: '確認名稱後點擊「新增」', img: '/onboarding/ios-chrome-step3.png' },
      ]
    case 'android-chrome':
      return [
        { text: '點擊畫面右上角「⋮」三個點選單', img: '/onboarding/android-step1.png' },
        { text: '選擇「加到主畫面」或「安裝應用程式」', img: '/onboarding/android-step2.png' },
        { text: '點擊「新增」或「安裝」即完成', img: '/onboarding/android-step3.png' },
      ]
    default:
      return []
  }
}

// ── Step image with placeholder fallback ──────────────────────
function StepImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? (
    <div className="h-28 flex flex-col items-center justify-center gap-1 bg-[#FAF7F2] border border-[#E8E0D5] rounded-[12px]">
      <span className="text-2xl">🖼️</span>
      <span className="text-xs text-[#8B7355]/60">截圖說明（即將上傳）</span>
      <span className="font-mono text-[9px] text-[#8B7355]/40 break-all px-2 text-center">{src}</span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      className="w-full rounded-[12px] border border-[#E8E0D5] object-cover"
      onError={() => setFailed(true)}
    />
  )
}

// ── Modal ──────────────────────────────────────────────────────
export function AddToHomeScreenModal({ onClose }: { onClose: () => void }) {
  const [device, setDevice] = useState<DeviceType>('other')

  useEffect(() => {
    setDevice(detectDevice())
  }, [])

  const steps = getSteps(device)
  const deviceTabs: DeviceType[] = ['ios-safari', 'ios-chrome', 'android-chrome']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-[24px] sm:rounded-[20px] w-full max-w-[430px] max-h-[88vh] flex flex-col shadow-2xl">

        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#E8E0D5] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#2C2019]">📱 加入主畫面教學</h2>
            <p className="text-xs text-[#8B7355] mt-0.5">已偵測到：{getDeviceLabel(device)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#FAF7F2] border border-[#E8E0D5]"
          >
            <svg className="w-4 h-4 text-[#8B7355]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Device tabs */}
        <div className="px-5 pt-3 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
          {deviceTabs.map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`flex-none px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                device === d
                  ? 'bg-[#4CAF7D] text-white border-[#4CAF7D]'
                  : 'bg-white text-[#8B7355] border-[#E8E0D5]'
              }`}
            >
              {getDeviceLabel(d)}
            </button>
          ))}
        </div>

        {/* Scrollable steps */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {device === 'other' ? (
            <div className="bg-[#FAF7F2] rounded-[16px] p-6 text-center">
              <p className="text-5xl mb-4">🌐</p>
              <p className="text-sm font-semibold text-[#2C2019] mb-2">請使用手機瀏覽器開啟本網站</p>
              <p className="text-xs text-[#8B7355] leading-relaxed">
                建議使用 iPhone 的 Safari 或 Android 的 Chrome，即可將本網站加入主畫面，像 APP 一樣使用。
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => setDevice('ios-safari')}
                  className="text-xs text-[#4CAF7D] font-medium border border-[#4CAF7D] px-3 py-1.5 rounded-full"
                >
                  看 iPhone 教學
                </button>
                <button
                  onClick={() => setDevice('android-chrome')}
                  className="text-xs text-[#4CAF7D] font-medium border border-[#4CAF7D] px-3 py-1.5 rounded-full"
                >
                  看 Android 教學
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#4CAF7D] text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2019] mb-2 leading-relaxed">{step.text}</p>
                    <StepImage src={step.img} alt={`步驟 ${i + 1}`} />
                  </div>
                </div>
              ))}
              <div className="bg-[#4CAF7D]/10 rounded-[12px] p-3 flex items-start gap-2 mt-2">
                <span className="text-base flex-shrink-0">✅</span>
                <p className="text-xs text-[#4CAF7D] font-medium leading-relaxed">
                  加入主畫面後，從主畫面開啟就像 APP 一樣，全螢幕且不會有瀏覽器工具列！
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-[12px] bg-[#4CAF7D] text-white text-sm font-bold active:scale-95 transition-transform"
          >
            了解了！
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Homepage tip card ──────────────────────────────────────────
export function AddToHomeScreenTip() {
  const [visible, setVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isPWAMode()) return
    const dismissed = localStorage.getItem('hideAddToHomeScreenTip')
    if (!dismissed) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('hideAddToHomeScreenTip', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div className="mx-5 mb-4 bg-white rounded-[16px] border border-[#4CAF7D]/30 shadow-[0_2px_12px_rgba(76,175,125,0.12)] p-4 relative">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 w-7 h-7 flex items-center justify-center rounded-full text-[#8B7355] hover:bg-[#FAF7F2] transition-colors"
          aria-label="關閉"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 pr-6 mb-3">
          <span className="text-2xl flex-shrink-0">📱</span>
          <div>
            <p className="text-sm font-semibold text-[#2C2019]">把我加到主畫面，像 APP 一樣使用！</p>
            <p className="text-xs text-[#8B7355] mt-0.5">免下載・快速開啟・全螢幕體驗</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2.5 rounded-[10px] bg-[#4CAF7D] text-white text-sm font-bold active:scale-95 transition-transform"
        >
          查看教學
        </button>
      </div>

      {showModal && <AddToHomeScreenModal onClose={() => setShowModal(false)} />}
    </>
  )
}
