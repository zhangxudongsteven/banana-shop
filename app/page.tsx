import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  History,
  ImagePlus,
  Sparkles,
  Wand2,
} from 'lucide-react'

const previewSteps = [
  { label: '上传图片', detail: '拖入照片或选择历史结果', icon: ImagePlus },
  { label: '选择风格', detail: 'Funko Pop / LEGO / 写实增强', icon: Wand2 },
  { label: '生成并复用', detail: '下载、对比、继续编辑', icon: History },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-950/20 text-foreground">
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <span className="text-lg">🍌</span>
            </div>
            <span className="font-bold text-xl">Banana Shop</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button asChild>
              <Link href="/dashboard">
                开始使用
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-7xl">
        <section className="grid min-h-[calc(100vh-73px)] items-center gap-10 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:py-14">
          <div className="flex flex-col gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm text-orange-400">
              <Sparkles className="h-4 w-4" />
              <span>AI 图片创作工作台</span>
            </div>
            <div className="flex flex-col gap-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
                上传图片，选择风格，直接生成可继续编辑的结果
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Banana Shop 把图片上传、风格转换、多图参考、结果对比和历史复用放进一个受保护的创作工作流。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/dashboard">
                  免费开始
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8 bg-transparent">
                <Link href="/dashboard">查看演示</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {previewSteps.map(({ label, detail, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-lg border border-border/50 bg-card/45 p-4 backdrop-blur"
                >
                  <Icon className="mb-3 h-5 w-5 text-orange-400" />
                  <div className="font-semibold">{label}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-border/60 bg-card/70 p-0 shadow-2xl shadow-orange-950/20 backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">Dashboard preview</div>
            </div>
            <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border-b border-border/60 p-5 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">输入</h2>
                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-400">
                    已选择 Funko Pop
                  </span>
                </div>
                <div className="rounded-lg border border-dashed border-border bg-background/50 p-3">
                  <img
                    src="/examples/fashion.jpg"
                    alt="上传图片示例"
                    className="aspect-square w-full rounded-md object-cover"
                  />
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-orange-400" />
                    原图已准备
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-border/70 bg-background/45 p-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Prompt</div>
                  <p className="text-sm leading-relaxed">
                    保留人物姿态，转换成玩具收藏品风格，使用柔和棚拍光线。
                  </p>
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href="/dashboard">
                    进入工作台
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">结果</h2>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    自动保存到历史
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/70 bg-background/45 p-2">
                    <img
                      src="/examples/funko.jpg"
                      alt="Funko Pop 风格生成示例"
                      className="aspect-square w-full rounded-md object-cover"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">Funko Pop</div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/45 p-2">
                    <img
                      src="/examples/lego.jpg"
                      alt="LEGO 风格生成示例"
                      className="aspect-square w-full rounded-md object-cover"
                    />
                    <div className="mt-2 text-xs text-muted-foreground">LEGO</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
                  <div className="mb-1 font-semibold">继续编辑闭环</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    生成结果可以预览、下载、对比，也可以作为下一次输入继续改图。
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="pb-20">
          <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-yellow-500/5 p-8 text-center md:p-12">
            <h2 className="text-3xl font-bold text-balance">准备开始创作了吗？</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              进入受保护的 Dashboard，上传图片并选择一个转换能力开始。
            </p>
            <Button asChild size="lg" className="mt-7 text-base px-8">
              <Link href="/dashboard">
                免费开始
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <span className="text-xs">🍌</span>
              </div>
              <span className="font-semibold">Banana Shop</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Banana Shop. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
