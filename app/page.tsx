import Link from "next/link";

const features = [
  {
    title: "多平台适配",
    desc: "支持小红书、抖音、公众号、微博等主流平台，自动匹配风格和字数要求。",
    icon: "📱",
  },
  {
    title: "智能生成",
    desc: "只需输入主题和关键词，AI 自动生成吸睛标题、正文和号召性用语。",
    icon: "🤖",
  },
  {
    title: "历史记录",
    desc: "所有生成的文案自动保存，随时回顾、复制和复用你的爆款内容。",
    icon: "📚",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* 主视觉区 */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
        <div className="mx-auto max-w-2xl">
          <h1 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            AI 文案生成器
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            选择平台，输入主题，10秒生成爆款文案
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/generate"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95"
            >
              开始生成
            </Link>
            <Link
              href="/history"
              className="rounded-xl border border-zinc-300 px-8 py-3.5 text-base font-semibold text-zinc-700 transition-all hover:bg-zinc-100 active:scale-95 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              查看历史
            </Link>
          </div>
        </div>
      </section>

      {/* 功能亮点 */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            为什么选择我们？
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xs transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="text-4xl">{f.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
