import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** 服务端客户端（用于 API 路由，能读取用户 session） */
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        )
      },
    },
  })
}

/** 插入一条生成记录 */
export async function saveGeneration(params: {
  platform: string
  topic: string
  style?: string
  results: string[]
  user_id: string
}) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('generations').insert({
    platform: params.platform,
    topic: params.topic,
    style: params.style ?? null,
    results: params.results,
    user_id: params.user_id,
  })

  if (error) throw error
}

/** 查询最近 20 条记录（只查当前用户的数据） */
export async function getHistory(userId: string) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data ?? []
}

/** 删除一条生成记录 */
export async function deleteGeneration(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('generations').delete().eq('id', id)
  if (error) throw error
}
