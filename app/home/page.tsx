import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Image as ImageIcon, BarChart3, Sparkles, Wand2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-950/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <span className="text-lg">🍌</span>
            </div>
            <span className="font-bold text-xl">Banana Shop</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/editor">
              <Button>开始使用</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 max-w-7xl">
        <section className="py-20 md:py-32">
          <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>强大的 AI 图片编辑平台</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
              让每一张图片
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
                充满创意
              </span>
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl leading-relaxed">
              使用 AI 技术转换、编辑和创造令人惊叹的图片。支持多种风格，让您的创意无限延伸。
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Link href="/editor">
                <Button size="lg" className="text-base px-8">
                  免费开始
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base px-8 bg-transparent">
                查看演示
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-orange-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6">
                <Wand2 className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI 智能转换</h3>
              <p className="text-muted-foreground leading-relaxed">
                一键将图片转换为各种风格，Funko Pop、LEGO、动漫风格等数十种效果等你来体验。
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-orange-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6">
                <ImageIcon className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">精确编辑</h3>
              <p className="text-muted-foreground leading-relaxed">
                支持局部编辑和图片融合，使用画笔工具精确控制修改区域，实现完美的创作效果。
              </p>
            </Card>

            <Card className="p-8 bg-card/50 backdrop-blur border-border/50 hover:border-orange-500/50 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">历史记录</h3>
              <p className="text-muted-foreground leading-relaxed">
                自动保存创作历史，随时查看和重用之前的生成结果，让创作流程更加高效便捷。
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <Card className="p-12 md:p-16 bg-gradient-to-br from-orange-500/10 to-yellow-500/5 border-orange-500/20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              准备好开始创作了吗？
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-balance">
              立即体验专业的 AI 图片编辑服务，释放您的创意潜能
            </p>
            <Link href="/editor">
              <Button size="lg" className="text-base px-8">
                免费开始
              </Button>
            </Link>
          </Card>
        </section>
      </main>

      {/* Footer */}
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
