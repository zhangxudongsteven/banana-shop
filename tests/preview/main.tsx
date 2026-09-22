import { Toaster, toast } from 'sonner'
import React from 'react'
import { createRoot } from 'react-dom/client'
import GenerationPage from '@/app/dashboard/[style]/page'
import HistoryPanel from '@/components/HistoryPanel'
import { HistoryProvider, useHistory } from '@/contexts/HistoryContext'
import { LanguageProvider, useTranslation } from '@/i18n/context'
import { ThemeProvider, useTheme } from '@/theme/context'
import { Button } from '@/components/ui/button'
import { useRouter } from './navigation'
import { failNextGeneration } from './actions'
import { downloadImage } from '@/utils/fileUtils'
import '@/app/globals.css'
function Preview() {
  const history = useHistory()
  const router = useRouter()
  const { toggleTheme } = useTheme()
  const { language, changeLanguage } = useTranslation()
  return (
    <div className="darkroom-page min-h-screen text-foreground">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <strong>UI 测试预览（生成与历史均为模拟）</strong>
        <Button variant="secondary" onClick={toggleTheme}>
          切换明暗
        </Button>
        <Button variant="secondary" onClick={() => changeLanguage(language === 'zh' ? 'en' : 'zh')}>
          中 / EN
        </Button>
        <select
          aria-label="创作模式"
          className="rounded bg-background p-2"
          disabled={history.isGenerating}
          onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
        >
          <option value="customPrompt">自定义改图</option>
          <option value="glmImage">文生图</option>
          <option value="figurine">手办</option>
          <option value="colorPalette">两步生成</option>
        </select>
        <Button
          disabled={history.isGenerating}
          variant="secondary"
          onClick={() => {
            router.push('/dashboard/customPrompt')
            history.setPendingImageInput('/examples/fashion.jpg')
          }}
        >
          载入示例图片
        </Button>
        <Button variant="secondary" onClick={failNextGeneration}>
          下次模拟失败
        </Button>
        <Button variant="secondary" onClick={history.toggleHistoryPanel}>
          历史记录
        </Button>
      </div>
      <Toaster />
      <GenerationPage />
      <HistoryPanel
        isOpen={history.isHistoryPanelOpen}
        onClose={history.closeHistoryPanel}
        history={history.history}
        isLoading={history.isLoadingHistory}
        error={history.historyError}
        onRefresh={history.refreshHistory}
        onRetry={history.retryHistoryItem}
        canRetry={history.canRetryHistoryItem}
        disableUse={history.isGenerating}
        onUseImage={(url) => {
          if (!history.isGenerating) {
            history.setPendingImageInput(url)
            history.closeHistoryPanel()
            router.push('/dashboard/customPrompt')
          }
        }}
        onDownload={(url) => {
          void downloadImage(url, 'preview.png').catch(() => toast.error('图片下载失败'))
        }}
      />
    </div>
  )
}
createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <ThemeProvider>
      <HistoryProvider>
        <Preview />
      </HistoryProvider>
    </ThemeProvider>
  </LanguageProvider>
)
