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
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
