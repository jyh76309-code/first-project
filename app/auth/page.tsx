'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Tab = 'login' | 'register'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): string | null {
    if (!username.trim()) return '请输入用户名'
    if (!USERNAME_REGEX.test(username.trim()))
      return '用户名必须是 3-20 个字符，只能包含字母、数字、下划线'

    if (!password) return '请输入密码'
    if (password.length < 6) return '密码至少需要 6 位字符'

    if (tab === 'register' && password !== confirmPassword)
      return '两次输入的密码不一致'

    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const supabase = createClient()
    let success = false

    try {
      if (tab === 'register') {
        console.log('【注册】开始注册', username)

        // 随机邮箱，彻底避开速率限制
        const randomStr = Math.random().toString(36).substring(2, 8)
        const fakeEmail = `u_${randomStr}_${Date.now()}@tmp.email`
        console.log('【注册】生成的假邮箱', fakeEmail)

        // 加 15 秒超时，避免 signUp 请求卡死
        const signUpPromise = supabase.auth.signUp({
          email: fakeEmail,
          password,
        })
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('注册请求超时，请检查网络')), 15000),
        )
        const { data, error: signUpError } = await Promise.race([
          signUpPromise,
          timeoutPromise,
        ])
        console.log('【注册】signUp 结果', {
          hasUser: !!data?.user,
          hasSession: !!data?.session,
          error: signUpError?.message,
        })

        if (signUpError) throw signUpError
        if (!data?.user) throw new Error('注册失败，请重试')

        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, username: username.trim() })
        console.log('【注册】存入 profiles 结果', { error: profileError?.message, code: profileError?.code })

        if (profileError) {
          // 区分不同类型的错误
          if (profileError.code === '23505') {
            throw new Error('用户名已被占用')
          }
          throw new Error(profileError.message)
        }

        success = true
      } else {
        console.log('【登录】开始登录', username)

        const fakeEmail = `${username.trim().toLowerCase()}@fake.com`
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password,
        })

        if (signInError) throw new Error('用户名或密码错误')
        console.log('【登录】成功')

        success = true
      }
    } catch (err) {
      console.error('【错误】', err)
      const msg = err instanceof Error ? err.message : '操作失败，请重试'
      setError(msg)
    } finally {
      setLoading(false)
    }

    if (success) {
      router.push('/generate')
      router.refresh()
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-sm flex-col justify-center px-6 py-10">
      {/* 标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          欢迎使用文案助手
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          用用户名登录，无需手机号和邮箱
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => {
            setTab('login')
            setError(null)
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === 'login'
              ? 'bg-white text-[#7C3AED] shadow-xs dark:bg-zinc-700 dark:text-purple-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          登录
        </button>
        <button
          onClick={() => {
            setTab('register')
            setError(null)
          }}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === 'register'
              ? 'bg-white text-[#7C3AED] shadow-xs dark:bg-zinc-700 dark:text-purple-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          注册
        </button>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700 shadow-xs dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 用户名 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="3-20位字母、数字或下划线"
            autoComplete={tab === 'login' ? 'username' : 'username'}
            autoFocus
            className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>

        {/* 密码 */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6位密码"
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
          />
        </div>

        {/* 确认密码（注册时显示） */}
        {tab === 'register' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              autoComplete="new-password"
              className="block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-100"
            />
          </div>
        )}

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:bg-[#6D28D9] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-purple-900/30"
        >
          {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
        </button>
      </form>
    </div>
  )
}
