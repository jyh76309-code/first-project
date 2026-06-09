import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getHistory } from '@/lib/supabase-server'

export async function GET() {
  try {
    // 获取当前登录用户
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: '未登录', success: false },
        { status: 401 },
      )
    }

    const data = await getHistory(user.id)
    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('获取历史记录失败:', error)
    return NextResponse.json(
      { error: '获取历史记录失败', success: false },
      { status: 500 },
    )
  }
}
