import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type GenerationRecord = {
  id: string
  platform: string
  topic: string
  style: string | null
  results: string[]
  created_at: string
  user_id: string
}

/** 浏览器端客户端（用于前端组件） */
export const createClient = () =>
  createSupabaseClient(supabaseUrl, supabaseAnonKey)
