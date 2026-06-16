import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function POST(req: NextRequest) {
  try {
    const { expenses } = await req.json()

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({ insights: ['這個月還沒有記帳資料', '開始記帳就能看到消費分析', '點首頁的「快速記帳」開始吧'] })
    }

    const total = expenses.reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0)
    const prompt = `這個月的記帳資料如下：${JSON.stringify(expenses)}，總花費NT$${total}元。
請用繁體中文給出3條消費洞察，每條一句話，要具體有數字，語氣輕鬆不說教。
只回傳3條，用換行分隔，不要編號，不要符號，不要多餘文字。`

    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const lines = text.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 3)

    return NextResponse.json({ insights: lines })
  } catch (error) {
    console.error('Insights error:', error)
    return NextResponse.json({ insights: ['本月消費分析暫時無法取得', '請稍後再試', ''] }, { status: 500 })
  }
}
