import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-api'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createApiClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { id, amount, category, description, expense_date } = await req.json()
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    const { data, error } = await supabase
      .from('expenses')
      .update({ amount: Number(amount), category, description, expense_date })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
