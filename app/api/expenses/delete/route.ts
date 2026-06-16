import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase-api'

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createApiClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
