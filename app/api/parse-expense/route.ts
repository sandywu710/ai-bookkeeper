import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createApiClient } from '@/lib/supabase-api'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' } as Record<string, unknown>,
})

const FIXED_CATEGORIES = ['餐飲', '交通', '購物', '娛樂', '醫療', '住居', '教育', '感情支出', '其他']

// Strip markdown fences, extract first complete JSON object
function extractJson(raw: string): string | null {
  const stripped = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  return stripped.slice(start, end + 1)
}

async function callWithRetry(prompt: string, maxAttempts = 2): Promise<{ jsonStr: string; raw: string }> {
  let lastRaw = ''
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[parse-expense] === ATTEMPT ${attempt}/${maxAttempts} ===`)
      const result = await model.generateContent(prompt)
      const raw = result.response.text().trim()
      lastRaw = raw
      console.log(`[parse-expense] GEMINI RAW RESPONSE (attempt ${attempt}):`)
      console.log(JSON.stringify(raw)) // JSON.stringify shows escape chars clearly
      const jsonStr = extractJson(raw)
      if (jsonStr) {
        console.log(`[parse-expense] EXTRACTED JSON: ${jsonStr}`)
        return { jsonStr, raw }
      }
      console.log(`[parse-expense] extractJson returned null — no JSON found in response`)
    } catch (err) {
      console.log(`[parse-expense] Gemini API error on attempt ${attempt}:`, err)
      if (attempt === maxAttempts) throw err
    }
  }
  throw new Error(`JSON 解析失敗，Gemini 原始回傳：${lastRaw.slice(0, 200)}`)
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()
    console.log(`[parse-expense] INPUT: "${input}"`)

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: '請輸入支出內容' }, { status: 400 })
    }

    // Server-side fetch of user's custom categories
    let customCatNames: string[] = []
    try {
      const supabase = createApiClient(req)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('custom_categories').select('name')
        if (data) customCatNames = data.map((c: { name: string }) => c.name)
      }
    } catch {
      // Non-fatal: fall back to fixed categories only
    }

    const allCategories = [...FIXED_CATEGORIES, ...customCatNames]

    const prompt = `你是記帳助理。分析以下支出描述，只回傳 JSON，不要任何其他文字。

支出描述：「${input}」

回傳格式（嚴格遵守，只有 JSON）：
{"amount":<金額數字>,"category":"<分類>","description":"<10字以內>","confidence":<0到1>}

可用分類（只能選這些）：
${allCategories.map((c, i) => `${i + 1}. ${c}`).join('\n')}

分類判斷規則：
- 感情支出：約會、禮物、花束、情人節、紀念日、送花、求婚等情侶相關
- 餐飲：吃飯、飲料、咖啡、便當、外送
- 交通：計程車、Uber、捷運、公車、停車、油費
- 購物：衣服、3C、日用品、超市、網購
- 娛樂：電影、KTV、遊戲、展覽
- 醫療：看診、藥局、健檢
- 住居：房租、水電、修繕
- 教育：課程、書籍、補習
- 其他：無法歸類時使用`

    console.log(`[parse-expense] PROMPT SENT TO GEMINI:`)
    console.log(prompt)

    const { jsonStr, raw } = await callWithRetry(prompt)

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonStr)
      console.log(`[parse-expense] JSON.parse SUCCESS:`, parsed)
    } catch (e) {
      console.error(`[parse-expense] JSON.parse FAILED. jsonStr was: "${jsonStr}"`)
      console.error(`[parse-expense] JSON.parse error:`, e)
      throw new Error('JSON 格式錯誤')
    }

    const amount = Number(parsed.amount)
    console.log(`[parse-expense] amount parsed: ${amount}, raw value: ${parsed.amount}`)
    if (!amount || amount <= 0) throw new Error('金額無效')

    const category = typeof parsed.category === 'string' && allCategories.includes(parsed.category)
      ? parsed.category
      : '其他'
    console.log(`[parse-expense] category: "${parsed.category}" → final: "${category}"`)

    return NextResponse.json({
      amount,
      category,
      description: typeof parsed.description === 'string' ? parsed.description : input,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    })
  } catch (error) {
    console.error('[parse-expense] FINAL ERROR:', error)
    return NextResponse.json({ error: 'AI 解析失敗，請手動選擇分類' }, { status: 500 })
  }
}
