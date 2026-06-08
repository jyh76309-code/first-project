'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { GenerationRecord } from '@/lib/supabase'

/* ---------- 平台颜色映射 ---------- */

const PLATFORM_COLORS: Record<string, string> = {
  小红书: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400',
  公众号: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  朋友圈: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

/* ---------- 工具 ---------- */

function formatDate(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/* ---------- 组件 ---------- */

export default function HistoryPage() {
  const [records, setRecords] = useState<GenerationRecord[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  /* Toast 自动消失 */
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  /* 加载数据 */
  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error || '获取失败')
        setRecords(json.data)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败')
      })
      .finally(() => setLoading(false))
  }, [])

  /* ---------- 选中逻辑 ---------- */

  const allSelected = records.length > 0 && selectedIds.size === records.length

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)))
    }
  }

  /* ---------- 复制 ---------- */

  async function handleCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedMap((prev) => ({ ...prev, [key]: true }))
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [key]: false }))
    }, 2000)
  }

  /* ---------- 展开/收起 ---------- */

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  /* ---------- 单条删除 ---------- */

  async function handleDelete(id: string) {
    if (deletingIds.has(id)) return

    setDeletingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || '删除失败')
      setRecords((prev) => prev.filter((r) => r.id !== id))
      if (expandedId === id) setExpandedId(null)
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
    } catch {
      setToast('删除失败，请重试')
    } finally {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  /* ---------- 批量删除 ---------- */

  async function handleBatchDelete() {
    if (batchDeleting || selectedIds.size === 0) return

    if (!window.confirm(`确认删除选中的 ${selectedIds.size} 条记录？`)) return

    setBatchDeleting(true)
    const ids = [...selectedIds]
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/history/${id}`, { method: 'DELETE' }).then((r) => r.json()),
      ),
    )

    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
    ).length

    // 从列表中移除成功删除的记录
    const succeededIds = new Set(ids)
    setRecords((prev) => prev.filter((r) => !succeededIds.has(r.id)))
    if (expandedId && succeededIds.has(expandedId)) setExpandedId(null)
    setSelectedIds(new Set())

    if (failed > 0) {
      setToast(`部分记录删除失败，请重试`)
    }
    setBatchDeleting(false)
  }

  /* ---------- 渲染辅助 ---------- */

  const renderToast = useCallback(
    () =>
      toast && (
        <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 shadow-xs dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {toast}
        </div>
      ),
    [toast],
  )

  /* ----- Loading ----- */
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/generate"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← 生成文案
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          历史记录
        </h1>
        <div className="mt-24 flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-[#7C3AED]" />
          <p className="text-sm text-zinc-400">加载中...</p>
        </div>
      </div>
    )
  }

  /* ----- 空状态 ----- */
  if (!error && records.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/generate"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← 生成文案
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          历史记录
        </h1>
        <div className="mt-24 flex flex-col items-center gap-5 text-center">
          <span className="text-5xl">📭</span>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            还没有生成记录
          </p>
          <Link
            href="/generate"
            className="rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:bg-[#6D28D9] dark:shadow-purple-900/30"
          >
            去生成文案 →
          </Link>
        </div>
      </div>
    )
  }

  /* ----- 错误状态 ----- */
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/generate"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← 生成文案
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          历史记录
        </h1>
        <div className="mt-24 flex flex-col items-center gap-5 text-center">
          <span className="text-5xl">⚠️</span>
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:bg-[#6D28D9] dark:shadow-purple-900/30"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  /* ----- 列表视图 ----- */
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/generate"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← 生成文案
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        历史记录
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        共 {records.length} 条记录
      </p>

      {renderToast()}

      {/* ----- 操作栏 ----- */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-xs dark:border-zinc-700 dark:bg-zinc-800/50">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="h-4 w-4 rounded border-zinc-300 text-[#7C3AED] accent-[#7C3AED] focus:ring-[#7C3AED]"
          />
          全选
        </label>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-xs text-zinc-500">
              已选 {selectedIds.size} 条
            </span>
          )}
          <button
            onClick={handleBatchDelete}
            disabled={selectedIds.size === 0 || batchDeleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            {batchDeleting ? '删除中...' : '删除所选'}
          </button>
        </div>
      </div>

      {/* ----- 记录列表 ----- */}
      <div className="mt-3 space-y-3">
        {records.map((r) => {
          const isOpen = expandedId === r.id
          const isDeleting = deletingIds.has(r.id)
          const isSelected = selectedIds.has(r.id)
          const colorClass =
            PLATFORM_COLORS[r.platform] ??
            'border-zinc-300 bg-zinc-50 text-zinc-700'

          return (
            <div
              key={r.id}
              className={`rounded-xl border bg-white shadow-xs transition-all dark:bg-zinc-800/50 ${
                isSelected
                  ? 'border-[#7C3AED]/40 dark:border-[#7C3AED]/60'
                  : 'border-zinc-100 dark:border-zinc-700'
              }`}
            >
              {/* ===== 上半部分：标题行（可点击展开） ===== */}
              <button
                onClick={() => toggleExpand(r.id)}
                disabled={isDeleting}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
              >
                {/* 左边：平台标签 + 主题 + 时间 */}
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${colorClass}`}
                  >
                    {r.platform}
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {r.topic}
                  </span>
                  <span className="hidden shrink-0 text-xs text-zinc-400 sm:block">
                    {formatDate(r.created_at)}
                  </span>
                </div>

                {/* 右边：展开/收起箭头 */}
                <span
                  className={`shrink-0 text-xs text-zinc-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* ===== 下半部分：操作行（始终显示） ===== */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-2.5 dark:border-zinc-700">
                {/* 左边：勾选框 */}
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(r.id)}
                    disabled={isDeleting}
                    className="h-4 w-4 rounded border-zinc-300 text-[#7C3AED] accent-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  选择
                </label>

                {/* 右边：删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(r.id)
                  }}
                  disabled={isDeleting}
                  className="flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-zinc-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:border-red-800 dark:hover:bg-red-900/30"
                >
                  {isDeleting ? '删除中...' : '🗑️ 删除'}
                </button>
              </div>

              {/* ===== 展开的文案内容 ===== */}
              {isOpen && (
                <div className="border-t border-zinc-100 px-5 pb-5 pt-4 dark:border-zinc-700">
                  <p className="mb-3 text-xs text-zinc-400 sm:hidden">
                    {formatDate(r.created_at)}
                  </p>

                  <div className="space-y-3">
                    {r.results.map((text, i) => {
                      const copyKey = `${r.id}-${i}`
                      const isCopied = copiedMap[copyKey]

                      return (
                        <div
                          key={i}
                          className="group relative space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all hover:border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800/30"
                        >
                          <span className="inline-block rounded bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] dark:bg-purple-900/40 dark:text-purple-300">
                            版本 {i + 1}
                          </span>

                          <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {text.split('\n').map((line, j) => (
                              <p key={j} className="mb-1">
                                {line || ' '}
                              </p>
                            ))}
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleCopy(text, copyKey)}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs shadow-xs transition-all ${
                                isCopied
                                  ? 'border-green-200 bg-green-50 font-medium text-green-600 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}
                            >
                              {isCopied ? (
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
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
