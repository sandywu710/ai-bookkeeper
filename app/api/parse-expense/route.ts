import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const CATEGORIES = ['餐飲', '交通', '購物', '娛樂', '醫療', '住居', '教育', '其他']

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: '請輸入支出內容' }, { status: 400 })
    }

    const prompt = `請分析這筆支出：「${input}」
回傳 JSON 格式，包含：
- amount: 金額數字（純數字，不含符號）
- category: 從以下選一個：${CATEGORIES.join('、')}
- description: 簡短描述（10字以內）
- confidence: 解析信心度（0到1之間）

只回傳 JSON，不要其他文字。範例：{"amount":85,"category":"餐飲","description":"午餐便當","confidence":0.95}`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI 無法解析格式')
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.amount || !parsed.category || !CATEGORIES.includes(parsed.category)) {
      throw new Error('解析結果不完整')
    }

    return NextResponse.json({
      amount: Number(parsed.amount),
      category: parsed.category,
      description: parsed.description || input,
      confidence: parsed.confidence || 0.8,
    })
  } catch (error) {
    console.error('Parse error:', error)
    return NextResponse.json(
      { error: 'AI 解析失敗，請手動選擇分類' },
      { status: 500 }
    )
  }
}
