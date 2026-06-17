import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-api'

export async function GET(req: NextRequest) {
  try {
    const supabase = createApiClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ data: [] })

    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createApiClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { name, emoji } = await req.json()
    if (!name || !emoji) return NextResponse.json({ error: '缺少參數' }, { status: 400 })

    const { data, error } = await supabase
      .from('custom_categories')
      .insert({ name, emoji, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createApiClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
