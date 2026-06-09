'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // 获取初始用户状态
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setLoggedIn(true)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()
        setUsername(profile?.username || '')
      } else {
        setLoggedIn(false)
        setUsername(null)
      }
    }
    getUser()

    // 监听登录/退出状态变化，自动更新
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setLoggedIn(true)
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single()
          setUsername(profile?.username || '')
        } else {
          setLoggedIn(false)
          setUsername(null)
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  const navLinks = [
    { href: '/generate', label: '生成文案' },
    { href: '/history', label: '历史记录' },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUsername(null)
    setLoggedIn(false)
    setMenuOpen(false)
    router.push('/auth')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100"
        >
          <span>✨</span>
          <span>文案助手</span>
        </Link>

        {/* 导航 + 用户信息 */}
        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#7C3AED]/10 text-[#7C3AED]'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* 未登录：显示登录/注册入口 */}
          {!loggedIn && (
            <Link
              href="/auth"
              className="ml-2 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#6D28D9]"
            >
              登录 / 注册
            </Link>
          )}

          {/* 已登录：显示用户名 */}
          {loggedIn && username && (
            <div className="relative ml-2">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {username}
                </span>
                <span className="text-xs">▼</span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="border-b border-zinc-100 px-3 py-2 text-xs text-zinc-400 dark:border-zinc-700 sm:hidden">
                      {username}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
