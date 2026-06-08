import { NextRequest, NextResponse } from 'next/server'
import { generateCopy } from '@/lib/openai'
import { saveGeneration } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { platform, topic, style } = await req.json()

    if (!platform) {
      return NextResponse.json(
        { error: '请选择目标平台', success: false },
        { status: 400 },
      )
    }

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: '请输入文案主题', success: false },
        { status: 400 },
      )
    }

    if (topic.trim().length > 50) {
      return NextResponse.json(
        { error: '主题关键词不能超过50个字', success: false },
        { status: 400 },
      )
    }

    const results = await generateCopy({
      platform,
      topic: topic.trim(),
      style,
    })

    // 存库，失败不影响返回结果
    try {
      await saveGeneration({
        platform,
        topic: topic.trim(),
        style,
        results,
      })
    } catch (dbErr) {
      console.error('Supabase 存储失败:', dbErr)
    }

    return NextResponse.json({ results, success: true })
  } catch (error) {
    console.error('生成失败:', error)
    const message =
      error instanceof Error ? error.message : '生成失败，请稍后重试'
    return NextResponse.json({ error: message, success: false }, { status: 500 })
  }
}
