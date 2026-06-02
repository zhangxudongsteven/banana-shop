import React, { useState } from 'react'
import {
  CheckCircle2,
  CloudOff,
  Download,
  Edit3,
  Eye,
  ImageIcon,
  Loader2,
  Paperclip,
  RefreshCw,
  Video,
  X,
} from 'lucide-react'
import type { GenerationHistoryAttachment, GenerationHistoryItem, HistorySyncStatus } from '../types'
import { useTranslation } from '../i18n/context'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  history: GenerationHistoryItem[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onUseImage: (imageUrl: string) => void
  onDownload: (url: string, type: string) => void
}

const getStatusConfig = (status: HistorySyncStatus) => {
  if (status === 'syncing') {
    return {
      key: 'history.status.syncing',
      className: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      icon: Loader2,
      spin: true,
    }
  }

  if (status === 'sync_failed') {
    return {
      key: 'history.status.failed',
      className: 'text-red-500 bg-red-500/10 border-red-500/30',
      icon: CloudOff,
      spin: false,
    }
  }

  if (status === 'synced') {
    return {
      key: 'history.status.synced',
      className: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      icon: CheckCircle2,
      spin: false,
    }
  }

  return {
    key: 'history.status.local',
    className: 'text-[var(--text-secondary)] bg-[rgba(107,114,128,0.16)] border-[var(--border-primary)]',
    icon: ImageIcon,
    spin: false,
  }
}

const getKindLabelKey = (kind: GenerationHistoryItem['kind']) => {
  if (!kind) return 'history.kind.unknown'
  return `history.kind.${kind}`
}

const getAttachmentRoleLabelKey = (role: GenerationHistoryAttachment['role']) =>
  `history.attachments.roles.${role}`

const isImageAttachment = (attachment: GenerationHistoryAttachment) =>
  attachment.mimeType?.startsWith('image/') || attachment.role !== 'video'

const isVideoAttachment = (attachment: GenerationHistoryAttachment) =>
  attachment.mimeType?.startsWith('video/') || attachment.role === 'video'

const formatCreatedAt = (createdAt: string) => {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const ActionButton: React.FC<{
  onClick: () => void
  children: React.ReactNode
  isPrimary?: boolean
  disabled?: boolean
}> = ({ onClick, children, isPrimary, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
      isPrimary
        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] shadow-sm shadow-[var(--accent-shadow)] hover:from-[var(--accent-primary-hover)] hover:to-[var(--accent-secondary-hover)]'
        : 'bg-[rgba(107,114,128,0.2)] hover:bg-[rgba(107,114,128,0.4)] text-[var(--text-primary)]'
    }`}
  >
    {children}
  </button>
)

const AttachmentPreviewModal: React.FC<{
  attachment: GenerationHistoryAttachment | null
  onClose: () => void
}> = ({ attachment, onClose }) => {
  if (!attachment?.url) return null

  const isVideo = isVideoAttachment(attachment)
  const title = attachment.fileName || attachment.role

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[85vh] w-full h-full flex-grow flex items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        {isVideo ? (
          <video src={attachment.url} controls className="max-h-full max-w-full rounded-lg shadow-2xl" />
        ) : (
          <img
            src={attachment.url}
            alt={title}
            className="h-full w-full object-contain rounded-lg shadow-2xl"
          />
        )}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-600 transition-colors"
          aria-label="Close preview"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="mt-4 max-w-4xl text-center text-sm font-medium text-white/90 truncate">
        {title}
      </div>
    </div>
  )
}

const AttachmentList: React.FC<{
  attachments?: GenerationHistoryAttachment[]
  onPreview: (attachment: GenerationHistoryAttachment) => void
}> = ({ attachments, onPreview }) => {
  const { t } = useTranslation()
  const visibleAttachments = attachments?.filter((attachment) => attachment.url) || []

  if (visibleAttachments.length === 0) return null

  const handleBrowse = (attachment: GenerationHistoryAttachment) => {
    if (!attachment.url) return

    if (isImageAttachment(attachment) || isVideoAttachment(attachment)) {
      onPreview(attachment)
      return
    }

    window.open(attachment.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mt-3 rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] p-2">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
        <Paperclip className="h-3.5 w-3.5" />
        {t('history.attachments.title')}
      </div>
      <div className="space-y-1.5">
        {visibleAttachments.map((attachment) => (
          <div
            key={`${attachment.role}-${attachment.attachmentId || attachment.url}`}
            className="flex items-center justify-between gap-2 rounded-md bg-[var(--bg-secondary)] px-2 py-1.5"
          >
            <div className="min-w-0">
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                {attachment.fileName || t(getAttachmentRoleLabelKey(attachment.role))}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">
                {t(getAttachmentRoleLabelKey(attachment.role))}
              </div>
            </div>
            <button
              onClick={() => handleBrowse(attachment)}
              className="flex flex-shrink-0 items-center gap-1 rounded-md bg-[rgba(107,114,128,0.2)] px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[rgba(107,114,128,0.4)]"
            >
              <Eye className="h-3.5 w-3.5" />
              {t('history.attachments.browse')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const Thumb: React.FC<{ src?: string | null; label: string }> = ({ src, label }) => {
  if (!src) return null

  return (
    <div className="min-w-0">
      <div className="aspect-square rounded-md overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-center">
        <img src={src} alt={label} className="w-full h-full object-cover" />
      </div>
      <div className="mt-1 text-[10px] text-center text-[var(--text-tertiary)] truncate">{label}</div>
    </div>
  )
}

const HistoryItem: React.FC<{
  item: GenerationHistoryItem
  onUseImage: (url: string) => void
  onDownload: (url: string, type: string) => void
  onPreviewAttachment: (attachment: GenerationHistoryAttachment) => void
}> = ({ item, onUseImage, onDownload, onPreviewAttachment }) => {
  const { t } = useTranslation()
  const statusConfig = getStatusConfig(item.historyStatus)
  const StatusIcon = statusConfig.icon
  const title = item.transformationTitle || t('history.untitled')
  const createdAt = formatCreatedAt(item.createdAt)
  const outputImageUrl = item.imageUrl
  const outputVideoUrl = item.videoUrl
  const canUseImage = Boolean(outputImageUrl)
  const canDownload = Boolean(outputImageUrl || outputVideoUrl)

  return (
    <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{title}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
            <span>{t(getKindLabelKey(item.kind))}</span>
            {createdAt && <span>{createdAt}</span>}
          </div>
        </div>
        <div
          className={`flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusConfig.className}`}
        >
          <StatusIcon className={`h-3 w-3 ${statusConfig.spin ? 'animate-spin' : ''}`} />
          <span>{t(statusConfig.key)}</span>
        </div>
      </div>

      {item.prompt && (
        <p className="mt-2 line-clamp-2 text-xs text-[var(--text-secondary)]">{item.prompt}</p>
      )}

      {item.historyError && (
        <p className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-500">
          {item.historyError}
        </p>
      )}

      {(item.inputImageUrl || item.referenceImageUrl || item.maskImageUrl) && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Thumb src={item.inputImageUrl} label={t('history.inputImage')} />
          <Thumb src={item.referenceImageUrl} label={t('history.referenceImage')} />
          <Thumb src={item.maskImageUrl} label={t('history.maskImage')} />
        </div>
      )}

      <div className="mt-3">
        {outputVideoUrl ? (
          <div className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden">
            <video src={outputVideoUrl} controls className="w-full max-h-56 object-contain" />
          </div>
        ) : outputImageUrl ? (
          item.secondaryImageUrl ? (
            <div className="grid grid-cols-2 gap-3">
              <Thumb src={item.secondaryImageUrl} label={t('history.lineArt')} />
              <Thumb src={outputImageUrl} label={t('history.finalResult')} />
            </div>
          ) : (
            <div className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] overflow-hidden">
              <img
                src={outputImageUrl}
                className="w-full max-h-72 object-contain"
                alt={t('history.outputImage')}
              />
            </div>
          )
        ) : (
          <div className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 text-center text-sm text-[var(--text-tertiary)]">
            <ImageIcon className="mx-auto mb-2 h-6 w-6" />
            {t('history.noPreview')}
          </div>
        )}
      </div>

      <AttachmentList attachments={item.attachments} onPreview={onPreviewAttachment} />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ActionButton
          onClick={() => onDownload(outputVideoUrl || outputImageUrl || '', outputVideoUrl ? 'video-result' : 'image-result')}
          disabled={!canDownload}
        >
          <Download className="h-4 w-4" />
          {t('history.save')}
        </ActionButton>
        <ActionButton onClick={() => outputImageUrl && onUseImage(outputImageUrl)} isPrimary disabled={!canUseImage}>
          <Edit3 className="h-4 w-4" />
          {t('history.use')}
        </ActionButton>
      </div>
    </div>
  )
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  isLoading,
  error,
  onRefresh,
  onUseImage,
  onDownload,
}) => {
  const { t } = useTranslation()
  const [previewAttachment, setPreviewAttachment] = useState<GenerationHistoryAttachment | null>(null)

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`absolute top-0 right-0 h-full w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-[var(--accent-primary)]">{t('history.title')}</h2>
            <p className="text-xs text-[var(--text-tertiary)]">{t('history.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[rgba(107,114,128,0.2)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              aria-label={t('history.refresh')}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[var(--text-secondary)] hover:bg-[rgba(107,114,128,0.2)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={t('history.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {isLoading && history.length === 0 ? (
            <div className="text-center text-[var(--text-tertiary)] pt-10 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p>{t('history.loading')}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-[var(--text-tertiary)] pt-10 flex flex-col items-center gap-4">
              <Video className="h-10 w-10" />
              <p>{t('history.empty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onUseImage={onUseImage}
                  onDownload={onDownload}
                  onPreviewAttachment={setPreviewAttachment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </div>
  )
}

export default HistoryPanel
