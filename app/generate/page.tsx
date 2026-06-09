'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ---------- 常量 ---------- */

const PLATFORMS = [
  { value: 'xiaohongshu', label: '小红书', emoji: '📕' },
  { value: 'wechat', label: '公众号', emoji: '📰' },
  { value: 'moments', label: '朋友圈', emoji: '💬' },
  { value: 'weibo', label: '微博', emoji: '🌐' },
  { value: 'zhihu', label: '知乎', emoji: '💡' },
] as const

const PLACEHOLDER: Record<string, string> = {
  xiaohongshu: '例：夏日防晒好物推荐 ☀️',
  wechat: '例：2025年AI行业深度分析',
  moments: '例：周末爬山记录',
  weibo: '例：今天发生了一件有趣的事...',
  zhihu: '例：如何看待AI对内容创作的影响',
}

const STYLES = [
  { value: 'lively', label: '活泼种草' },
  { value: 'serious', label: '专业严肃' },
  { value: 'warm', label: '温暖走心' },
] as const

const MAX_TOPIC_LENGTH = 50
const VISIBLE_LINES = 5
const REQUEST_TIMEOUT = 60_000

/* ---------- 组件 ---------- */

export default function GeneratePage() {
  /* state */
  const [platform, setPlatform] = useState('xiaohongshu')
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  /* Ctrl+Enter 快捷键 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        formRef.current?.requestSubmit()
      }
    },
    [],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  /* Toast 自动消失 */
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  /* 提交（流式） */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim() || loading) return

    setLoading(true)
    setResults([])
    setStreamingText('')
    setToast(null)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
      const res = await fetch('/api/generate', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          topic: topic.trim(),
          style: style || undefined,
        }),
      })
      clearTimeout(timer)

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || '生成失败')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法获取响应流')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setStreamingText(fullText)
      }

      // 流结束，分割得到各版本文案
      setStreamingText('')

      const parts = fullText
        .split(/\s*={3,}\s*|\s*\*{3,}\s*|\s*-{3,}\s*/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)

      setResults(parts.length > 0 ? parts : [fullText.trim()])
      setExpandedSet(new Set())
      setToast({ message: '✨ 文案生成成功！', type: 'success' })

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      clearTimeout(timer)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setToast({ message: '生成超时，请重试', type: 'error' })
      } else {
        const msg = err instanceof Error ? err.message : '出错了，请稍后重试'
        setToast({ message: msg, type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  /* 复制 */
  async function handleCopy(index: number) {
    try {
      await navigator.clipboard.writeText(results[index])
    } catch {
      const ta = document.createElement('textarea')
      ta.value = results[index]
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  /* 展开/收起 */
  function toggleExpand(index: number) {
    setExpandedSet((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  /* 重新生成 */
  function handleRegenerate() {
    setResults([])
    requestAnimationFrame(() => formRef.current?.requestSubmit())
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* ----- Toast 提示 ----- */}
        {toast && (
          <div
            className={`animate-fade-in rounded-xl border px-5 py-3 text-sm font-medium shadow-xs transition-all ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* ----- 平台选择 ----- */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            选择平台
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPlatform(p.value)}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
                  platform === p.value
                    ? 'border-2 border-[#7C3AED] bg-[#7C3AED]/5 text-[#7C3AED] shadow-xs'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ----- 主题输入 ----- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              输入主题关键词
            </label>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef as unknown as React.RefObject<HTMLTextAreaElement>}
              rows={3}
              maxLength={MAX_TOPIC_LENGTH}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={PLACEHOLDER[platform]}
              className="block w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-14 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
            <span
              className={`absolute bottom-3 right-3 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums ${
                topic.length > 45
                  ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-white/80 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {topic.length}/{MAX_TOPIC_LENGTH}
            </span>
          </div>
        </div>

        {/* ----- 风格选择 ----- */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            风格选择{' '}
            <span className="text-xs text-zinc-300 dark:text-zinc-600">（可选）</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStyle(style === s.value ? '' : s.value)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  style === s.value
                    ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ----- 生成按钮 ----- */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:bg-[#6D28D9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-purple-900/30"
          >
            <span>✨</span>
            {loading ? '生成中...' : '生成文案'}
            <span className="ml-1 rounded bg-white/20 px-2 py-0.5 text-[10px] opacity-80 transition-opacity group-hover:opacity-100">
              Ctrl+Enter
            </span>
          </button>
        </div>
      </form>

      {/* ----- 流式输出实时显示 ----- */}
      {streamingText && (
        <div className="mt-8 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-5 dark:border-purple-800/40 dark:bg-purple-900/10">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#7C3AED]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
              正在生成...
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {streamingText}
            <span className="inline-block h-4 w-0.5 animate-pulse bg-[#7C3AED] ml-0.5" />
          </div>
        </div>
      )}

      {/* ----- 分割线 ----- */}
      {results.length > 0 && (
        <hr className="my-8 border-zinc-100 dark:border-zinc-800" />
      )}

      {/* ----- 结果区 ----- */}
      {results.length > 0 && (
        <section ref={resultsRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">
              生成结果
            </h3>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex items-center gap-1 text-sm font-medium text-[#7C3AED] transition-colors hover:text-[#6D28D9] disabled:opacity-50"
            >
              <span>🔄</span> 重新生成
            </button>
          </div>

          <div className="space-y-4">
            {results.map((text, i) => {
              const isExpanded = expandedSet.has(i)
              const lines = text.split('\n').length
              const isLong = lines > VISIBLE_LINES

              return (
                <div
                  key={i}
                  className="group relative space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 transition-all hover:border-zinc-200 animate-fade-in dark:border-zinc-700 dark:bg-zinc-800/30"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* 版本号 */}
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-purple-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7C3AED] dark:bg-purple-900/40 dark:text-purple-300">
                      版本 {i + 1}
                    </span>
                  </div>

                  {/* 文案内容（折叠状态 + 渐变遮罩） */}
                  <div className="relative">
                    <div
                      className={`overflow-hidden text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 ${
                        !isExpanded && isLong ? 'max-h-24' : ''
                      }`}
                    >
                      {text.split('\n').map((line, j) => (
                        <p key={j} className="mb-1">
                          {line || ' '}
                        </p>
                      ))}
                    </div>
                    {!isExpanded && isLong && (
                      <div className="absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-zinc-50 to-transparent pb-1 dark:from-zinc-800/90">
                        <button
                          onClick={() => toggleExpand(i)}
                          className="rounded-full border border-zinc-100 bg-white px-3 py-1 text-xs font-semibold text-[#7C3AED] shadow-xs transition-all hover:text-[#6D28D9] dark:border-zinc-600 dark:bg-zinc-800"
                        >
                          展开全文 🔽
                        </button>
                      </div>
                    )}
                  </div>

                  {isExpanded && isLong && (
                    <button
                      onClick={() => toggleExpand(i)}
                      className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9]"
                    >
                      收起 ▲
                    </button>
                  )}

                  {/* 复制按钮 */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopy(i)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-xs transition-all ${
                        copiedIndex === i
                          ? 'border-green-200 bg-green-50 font-medium text-green-600 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {copiedIndex === i ? (
                        <>
                          <span>✓</span> 已复制
                        </>
                      ) : (
                        <>
                          <span>📋</span> 复制
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
