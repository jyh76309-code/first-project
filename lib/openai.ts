import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

const SYSTEM_PROMPTS: Record<string, string> = {
  xiaohongshu: `你是小红书爆款文案专家，擅长写种草内容。

要求：
- 正文 300-500字
- 开头一句话吸引眼球
- 多用换行增加可读性
- 表情符号自然穿插
- 结尾带 3-5 个话题标签 #`,

  wechat: `你是公众号内容创作者，擅长写有深度有观点的长文。

要求：
- 正文 800-1200字
- 有标题感，分3-4个段落
- 每段有小标题
- 语言有深度有观点
- 结尾有一句引发思考或互动的话`,

  moments: `你是朋友圈文案高手。

要求：
- 正文 50-100字
- 简短有力，贴近生活
- 情感真实自然
- 不要表情符号
- 不要话题标签`,

  weibo: `你是微博爆款内容专家，擅长写引发转发讨论的内容。

要求：
- 正文 100-140字（微博字数限制）
- 观点鲜明，有话题感
- 容易引发转发
- 带 1-2 个话题标签 #`,

  zhihu: `你是知乎优质回答专家，擅长写有深度有条理的回答。

要求：
- 正文 600-1000字
- 先给结论再展开
- 分2-3个论点，每个论点有例子支撑
- 语言专业但口语化
- 结尾总结观点`,
}

export async function generateCopy(params: {
  platform: string
  topic: string
  style?: string
}): Promise<string[]> {
  const { platform, topic, style } = params

  const systemPrompt =
    SYSTEM_PROMPTS[platform] ?? SYSTEM_PROMPTS.xiaohongshu

  const userPrompt = `主题是"${topic}"${style ? `，风格偏向${style}` : ''}。生成3条风格各异的文案，用分隔符 === 分隔每条文案，直接给文案内容不要加序号。`

  const response = await client.chat.completions.create({
    model: 'deepseek-v4-pro',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 4000,
  })

  const raw = response.choices[0]?.message?.content ?? ''

  if (!raw.trim()) {
    throw new Error('AI 返回内容为空')
  }

  // 兼容模型可能使用的 ===、*** 或 --- 分隔
  const parts = raw
    .split(/\s*={3,}\s*|\s*\*{3,}\s*|\s*-{3,}\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

  // 如果分隔没生效（整个一段），当作单条返回
  return parts.length > 1 ? parts : [raw.trim()]
}

/** 流式版本 — 返回 ReadableStream<string>，前端边收边显示 */
export async function generateCopyStream(params: {
  platform: string
  topic: string
  style?: string
}): Promise<ReadableStream<string>> {
  const { platform, topic, style } = params

  const systemPrompt =
    SYSTEM_PROMPTS[platform] ?? SYSTEM_PROMPTS.xiaohongshu

  const userPrompt = `主题是"${topic}"${style ? `，风格偏向${style}` : ''}。生成3条风格各异的文案，用分隔符 === 分隔每条文案，直接给文案内容不要加序号。`

  const stream = await client.chat.completions.create({
    model: 'deepseek-v4-pro',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: true,
    temperature: 0.8,
    max_tokens: 4000,
  })

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          controller.enqueue(content)
        }
      }
      controller.close()
    },
  })
}

export default client
