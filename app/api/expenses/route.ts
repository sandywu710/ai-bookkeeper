import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await req.json()
    const { amount, category, description, raw_input, user_id, expense_date } = body

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        amount: Number(amount),
        category,
        description,
        raw_input,
        user_id,
        expense_date: expense_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Save expense error:', error)
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const limit = Number(searchParams.get('limit') || 50)

    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get expenses error:', error)
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 })
  }
}
