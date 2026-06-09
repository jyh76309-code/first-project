import { NextRequest } from 'next/server'
import { generateCopyStream } from '@/lib/openai'
import { createServerSupabaseClient, saveGeneration } from '@/lib/supabase-server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { platform, topic, style } = await req.json()

    if (!platform) {
      return new Response('请选择目标平台', { status: 400 })
    }

    if (!topic || !topic.trim()) {
      return new Response('请输入文案主题', { status: 400 })
    }

    if (topic.trim().length > 50) {
      return new Response('主题关键词不能超过50个字', { status: 400 })
    }

    // 获取当前登录用户
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('未登录', { status: 401 })
    }

    // 创建 AI 流
    const aiStream = await generateCopyStream({
      platform,
      topic: topic.trim(),
      style,
    })

    // 边流边收集完整文本，流结束后存库
    const encoder = new TextEncoder()
    let fullText = ''

    const body = new ReadableStream({
      async start(controller) {
        const reader = aiStream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            fullText += value
            controller.enqueue(encoder.encode(value))
          }
          controller.close()
        } catch (e) {
          controller.error(e)
          return
        }

        // 流结束后存库（不影响前端体验）
        const results = fullText
          .split(/\s*={3,}\s*|\s*\*{3,}\s*|\s*-{3,}\s*/)
          .map((s) => s.trim())
          .filter((s) => s.length > 10)

        if (results.length > 0) {
          try {
            await saveGeneration({
              platform,
              topic: topic.trim(),
              style,
              results,
              user_id: user.id,
            })
          } catch (dbErr) {
            console.error('Supabase 存储失败:', dbErr)
          }
        }
      },
    })

    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('生成失败:', error)
    const message =
      error instanceof Error ? error.message : '生成失败，请稍后重试'
    return new Response(message, { status: 500 })
  }
}
