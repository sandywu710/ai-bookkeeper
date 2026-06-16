import { createClient } from '@supabase/supabase-js'

export type Expense = {
  id?: string
  user_id?: string
  amount: number
  category: string
  description: string
  raw_input?: string
  expense_date?: string
  created_at?: string
}

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase 環境變數未設定，請檢查 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}
