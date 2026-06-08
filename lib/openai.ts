import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

const SYSTEM_PROMPTS: Record<string, string> = {
  xiaohongshu:
    '你是小红书爆款文案专家，擅长写有表情符号、话题标签的种草内容，口语化有感染力，200-300字。',
  gzh:
    '你是公众号内容创作者，擅长写有深度有观点适合转发的内容，专业且有温度，300-500字。',
  moments:
    '你是朋友圈文案高手，简短有力引发共鸣，100字以内，不要表情符号。',
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
    max_tokens: 2000,
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

export default client
