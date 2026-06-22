'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts'
import { useRouter } from 'next/navigation'
import { CATEGORY_EMOJI } from '@/lib/constants'
import type { Expense } from '@/lib/supabase'

// Predefined colors for known categories
const CATEGORY_COLORS: Record<string, string> = {
  餐飲: '#FF8C69',
  交通: '#4A90D9',
  購物: '#F5A623',
  娛樂: '#9B59B6',
  醫療: '#E8736C',
  住居: '#4CAF7D',
  教育: '#3AAFA9',
  感情支出: '#E91E8C',
  其他: '#95A5A6',
  投資理財: '#2E86AB',
  'AI/影視訂閱': '#6C5CE7',
  友誼社交: '#FFB347',
}

// Fallback palette for any custom categories not listed above
const FALLBACK_COLORS = ['#00B894', '#FD79A8', '#FDCB6E', '#E17055', '#74B9FF', '#A29BFE']

export function getCategoryColor(name: string, index: number): string {
  return CATEGORY_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

type CatEntry = { name: string; total: number; count: number; percent: number }

type Props = {
  catData: CatEntry[]
  dailyData: { day: string; total: number }[]
  activeCat: string | null
  activeCatInfo: { total: number; count: number } | null
  onCatClick: (name: string) => void
  year: number
  month: number
  monthExpenses: Expense[]
}

export default function ReportCharts({ catData, dailyData, activeCat, activeCatInfo, onCatClick, year, month, monthExpenses }: Props) {
  const router = useRouter()
  return (
    <>
      {/* ── 圓餅圖 ── */}
      <div className="px-5 mb-5">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
          <h2 className="text-sm font-semibold text-[#2C2019] mb-3">分類占比</h2>
          <div className="flex items-center gap-2">
            {/* Pie — Cell imported alongside Pie in the same module, type check works */}
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={64}
                    paddingAngle={2}
                    onClick={(d) => onCatClick(d.name as string)}
                  >
                    {catData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={getCategoryColor(entry.name, i)}
                        opacity={activeCat && activeCat !== entry.name ? 0.4 : 1}
                        stroke={activeCat === entry.name ? '#2C2019' : 'transparent'}
                        strokeWidth={activeCat === entry.name ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`NT$${Number(value).toLocaleString('zh-TW')}`, '']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D5', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend — same color function, guaranteed to match the pie */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {catData.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => onCatClick(cat.name)}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded-[6px] transition-colors ${
                    activeCat === cat.name ? 'bg-[#FAF7F2]' : ''
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: getCategoryColor(cat.name, i) }}
                  />
                  <span className="text-xs text-[#2C2019] flex-1 text-left truncate">
                    {CATEGORY_EMOJI[cat.name] || ''} {cat.name}
                  </span>
                  <span className="text-xs font-medium text-[#8B7355] flex-shrink-0">{cat.percent}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active category detail — expense list */}
          {activeCat && activeCatInfo && (() => {
            const items = monthExpenses
              .filter(e => e.category === activeCat)
              .sort((a, b) => {
                const da = a.expense_date || a.created_at || ''
                const db = b.expense_date || b.created_at || ''
                return db.localeCompare(da)
              })
            return (
              <div className="mt-3 pt-3 border-t border-[#E8E0D5] slide-up">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#2C2019]">
                    {CATEGORY_EMOJI[activeCat] || ''} {activeCat}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-[#2C2019]">NT${activeCatInfo.total.toLocaleString('zh-TW')}</span>
                    <span className="text-xs text-[#8B7355] ml-2">{activeCatInfo.count} 筆</span>
                  </div>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {items.map((e, i) => {
                    const ds = e.expense_date || (e.created_at ? e.created_at.slice(0, 10) : '')
                    const [, , dd] = ds ? ds.split('-') : ['', '', '']
                    const dateLabel = ds ? `${month + 1}/${parseInt(dd, 10)}` : ''
                    return (
                      <div key={e.id ?? i} className="flex items-center justify-between px-2 py-1.5 rounded-[8px] bg-[#FAF7F2]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-[#8B7355] flex-shrink-0 w-9">{dateLabel}</span>
                          <span className="text-xs text-[#2C2019] truncate">{e.description || e.raw_input || '－'}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#2C2019] flex-shrink-0 ml-2">NT${Number(e.amount).toLocaleString('zh-TW')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── 長條圖 ── */}
      <div className="px-5 mb-5">
        <div className="bg-white rounded-[16px] border border-[#E8E0D5] shadow-[0_2px_12px_rgba(44,32,25,0.06)] p-4">
          <h2 className="text-sm font-semibold text-[#2C2019] mb-1">每天花費</h2>
          <p className="text-xs text-[#8B7355] mb-3">點擊長條查看當天明細</p>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                barSize={6}
              >
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#8B7355' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#8B7355' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  cursor={{ fill: '#FAF7F2' }}
                  formatter={(value) => [`NT$${Number(value).toLocaleString('zh-TW')}`, '花費']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E8E0D5', fontSize: 12 }}
                />
                <Bar
                  dataKey="total"
                  fill="#4CAF7D"
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onClick={(data: any) => {
                    const day = data?.day as string | undefined
                    const total = data?.total as number | undefined
                    if (!day || !total) return
                    const mm = String(month + 1).padStart(2, '0')
                    const dd = String(day).padStart(2, '0')
                    router.push(`/records?date=${year}-${mm}-${dd}`)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  )
}
