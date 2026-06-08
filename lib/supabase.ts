import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type GenerationRecord = {
  id: string
  platform: string
  topic: string
  style: string | null
  results: string[]
  created_at: string
}

/** 插入一条生成记录 */
export async function saveGeneration(params: {
  platform: string
  topic: string
  style?: string
  results: string[]
}) {
  const { error } = await supabase.from('generations').insert({
    platform: params.platform,
    topic: params.topic,
    style: params.style ?? null,
    results: params.results,
  })

  if (error) throw error
}

/** 查询最近 20 条记录，按创建时间倒序 */
export async function getHistory(): Promise<GenerationRecord[]> {
  const { data, error } = await supabase
    .from('generations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data ?? []
}

/** 删除一条生成记录 */
export async function deleteGeneration(id: string) {
  const { error } = await supabase.from('generations').delete().eq('id', id)
  if (error) throw error
}

export default supabase
