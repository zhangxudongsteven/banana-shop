import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronsLeftRight,
  Download,
  History,
  ImagePlus,
  Layers3,
  Sparkles,
  Wand2,
} from 'lucide-react'

const workflowSteps = [
  { label: '导入素材', detail: '主图、参考图、历史结果', icon: ImagePlus },
  { label: '选择工艺', detail: '风格、蒙版、比例、Provider', icon: Layers3 },
  { label: '对比复用', detail: '滑杆检视、下载、继续编辑', icon: ChevronsLeftRight },
]

const filmFrames = [
  { label: 'Funko', src: '/examples/funko.jpg' },
  { label: 'LEGO', src: '/examples/lego.jpg' },
  { label: 'Fashion', src: '/examples/fashion.jpg' },
]

export default function HomePage() {
  return (
    <div className="darkroom-page min-h-screen text-foreground">
      <header className="sticky top-0 z-50 border-b border-[var(--border-primary)] bg-[var(--bg-card-alpha)] backdrop-blur-xl">
        <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="film-rail flex size-9 items-center justify-center rounded-md border border-[var(--border-strong)]">
              <span className="text-lg">🍌</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Banana Shop</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                进入工作台
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4">
        <section className="grid min-h-[calc(100vh-72px)] items-center gap-8 py-8 lg:grid-cols-[0.88fr_1.12fr] lg:py-12">
          <div className="flex flex-col gap-7">
            <div className="process-pill inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <Sparkles className="size-4" />
              <span>AI 创作暗房</span>
            </div>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
                把上传、生成、对比和继续编辑放进同一张工作台
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
                Banana Shop 面向图片创作者，把参考图、Prompt、转换风格、历史结果和滑杆对比组织成连续的改图流程。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-base">
                <Link href="/dashboard">
                  开始创作
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link href="/dashboard/customPrompt">
                  打开自定义改图
                  <Wand2 data-icon="inline-end" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {workflowSteps.map(({ label, detail, icon: Icon }) => (
                <div key={label} className="studio-surface rounded-lg p-4">
                  <Icon className="mb-3 size-5 text-[var(--accent-primary)]" />
                  <div className="font-semibold">{label}</div>
                  <div className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="studio-surface overflow-hidden rounded-lg">
            <div className="film-rail flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Layers3 className="size-4 text-[var(--accent-secondary)]" />
                <span>Live studio preview</span>
              </div>
              <span className="cyan-pill rounded-full px-3 py-1 text-xs">auto saved</span>
            </div>
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="flex flex-col gap-4 border-b border-[var(--border-primary)] p-5 lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-secondary)]">INPUT</h2>
                  <span className="process-pill rounded-full px-2.5 py-1 text-xs">Funko Pop</span>
                </div>
                <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-primary)]/70 p-3">
                  <img
                    src="/examples/fashion.jpg"
                    alt="上传图片示例"
                    className="aspect-[4/5] w-full rounded-md object-cover"
                  />
                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <ImagePlus className="size-4 text-[var(--accent-primary)]" />
                    主图已锁定，参考图可选
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/70 p-3">
                  <div className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">PROMPT</div>
                  <p className="text-sm leading-relaxed">
                    保留人物姿态，生成玩具收藏品包装，使用柔和棚拍光线。
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--text-secondary)]">OUTPUT</h2>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <History className="size-3.5" />
                    历史可复用
                  </span>
                </div>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]">
                  <img
                    src="/examples/fashion.jpg"
                    alt="原图预览"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-y-0 right-0 w-[56%] overflow-hidden border-l-2 border-[var(--accent-primary)]">
                    <img
                      src="/examples/funko.jpg"
                      alt="生成结果预览"
                      className="h-full w-[180%] max-w-none -translate-x-[44%] object-cover"
                    />
                  </div>
                  <div className="absolute left-[44%] top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--bg-primary)] bg-[var(--accent-primary)] text-[var(--text-on-accent)] shadow-lg">
                    <ChevronsLeftRight className="size-4" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-md border border-white/10 bg-black/55 px-3 py-2 text-xs text-white">
                    <span>Before</span>
                    <span>Slider compare</span>
                    <span>After</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {filmFrames.map((frame) => (
                    <div
                      key={frame.label}
                      className="overflow-hidden rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1"
                    >
                      <img
                        src={frame.src}
                        alt={`${frame.label} 示例`}
                        className="aspect-square w-full rounded-sm object-cover"
                      />
                      <div className="mt-1 truncate px-1 text-xs text-[var(--text-tertiary)]">
                        {frame.label}
                      </div>
                    </div>
                  ))}
                </div>
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    进入完整工作台
                    <Download data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-20 md:grid-cols-3">
          {[
            ['多图参考', '用主图和参考图一起控制姿态、色板或语义。'],
            ['暗房对比', '生成后用滑杆、并排和网格检视变化。'],
            ['历史闭环', '把结果保存为下一次创作输入。'],
          ].map(([title, detail]) => (
            <div key={title} className="studio-surface rounded-lg p-6">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{detail}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
