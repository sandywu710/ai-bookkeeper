import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'AI記帳助手',
  description: '用自然語言快速記帳',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FAF7F2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-[#FAF7F2]">
            <div className="mx-auto max-w-[430px] min-h-screen relative">
              {children}
              <p className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] text-center pb-1 pointer-events-none select-none z-40" style={{ fontSize: 11, color: '#B5A48A' }}>
                Made by Sandy
              </p>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
