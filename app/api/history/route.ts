import { NextResponse } from 'next/server'
import { getHistory } from '@/lib/supabase'

export async function GET() {
  try {
    const data = await getHistory()
    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('获取历史记录失败:', error)
    return NextResponse.json(
      { error: '获取历史记录失败', success: false },
      { status: 500 },
    )
  }
}
