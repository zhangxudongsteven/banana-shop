'use client'

import { toast } from 'sonner'
import { useTranslation } from '@/i18n/context'
import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HistoryProvider, useHistory } from '../../contexts/HistoryContext'
import DashboardHeader from '../../components/DashboardHeader'
import { downloadImage } from '../../utils/fileUtils'
import { useAuth } from '../../components/AuthProvider'
import LoadingSpinner from '../../components/LoadingSpinner'

const HistoryPanel = dynamic(() => import('../../components/HistoryPanel'), { ssr: false })

const DashboardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const {
    history,
    isLoadingHistory,
    historyError,
    refreshHistory,
    isHistoryPanelOpen,
    closeHistoryPanel,
    setPendingImageInput,
    retryHistoryItem,
    canRetryHistoryItem,
    isGenerating,
  } = useHistory()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      refreshHistory()
    }
  }, [isAuthenticated, authLoading, refreshHistory])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <LoadingSpinner message="验证身份中..." />
      </div>
    )
  }

  // Show message if not authenticated (though middleware should redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">需要登录</h1>
          <p className="text-[var(--text-secondary)] mb-6">请登录后访问编辑器</p>
          <Link
            href="/login?redirect=/dashboard"
            className="px-6 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] rounded-lg font-semibold"
          >
            前往登录
          </Link>
        </div>
      </div>
    )
  }

  const handleDownloadFromHistory = (url: string, type: string) => {
    void downloadImage(url, `image-result-${Date.now()}.png`).catch(() =>
      toast.error(t('app.error.downloadFailed'))
    )
  }

  const handleUseHistoryImageAsInput = (imageUrl: string) => {
    if (isGenerating) return
    setPendingImageInput(imageUrl)
    closeHistoryPanel()
    router.push('/dashboard/customPrompt')
  }

  return (
    <div className="darkroom-page min-h-screen text-[var(--text-primary)] font-sans">
      <DashboardHeader />
      <main>{children}</main>
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={closeHistoryPanel}
        history={history}
        isLoading={isLoadingHistory}
        error={historyError}
        onRefresh={refreshHistory}
        onRetry={retryHistoryItem}
        canRetry={canRetryHistoryItem}
        disableUse={isGenerating}
        onUseImage={handleUseHistoryImageAsInput}
        onDownload={handleDownloadFromHistory}
      />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <HistoryProvider>
      <DashboardContent>{children}</DashboardContent>
    </HistoryProvider>
  )
}
