import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  ChevronsLeftRight,
  Copy,
  Download,
  Edit3,
  Eye,
  SlidersHorizontal,
  ZoomIn,
} from 'lucide-react'
import type { GeneratedContent } from '../types'
import { useTranslation } from '../i18n/context'
import { downloadImage } from '../utils/fileUtils'
import { Button } from '@/components/ui/button'

interface ResultDisplayProps {
  content: GeneratedContent
  onUseImageAsInput: (imageUrl: string) => void
  onImageClick: (imageUrl: string) => void
  originalImageUrl: string | null
}

type ViewMode = 'result' | 'side-by-side' | 'slider'
type TwoStepViewMode = 'result' | 'grid' | 'slider'
type ImageSelection = 'Original' | 'Line Art' | 'Final Result'

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  content,
  onUseImageAsInput,
  onImageClick,
  originalImageUrl,
}) => {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('result')
  const [twoStepViewMode, setTwoStepViewMode] = useState<TwoStepViewMode>('result')

  const sliderContainerRef = useRef<HTMLDivElement>(null)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  const [sliderLeft, setSliderLeft] = useState<ImageSelection>('Original')
  const [sliderRight, setSliderRight] = useState<ImageSelection>('Final Result')

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderContainerRef.current) return
      const rect = sliderContainerRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percent = (x / rect.width) * 100
      setSliderPosition(percent)
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = () => setIsDragging(true)

  const handleDownload = () => {
    if (!content.imageUrl) return
    const fileExtension = content.imageUrl.split(';')[0].split('/')[1] || 'png'
    downloadImage(content.imageUrl, `generated-image-${Date.now()}.${fileExtension}`)
  }

  const handleDownloadBoth = () => {
    if (content.secondaryImageUrl) {
      downloadImage(content.secondaryImageUrl, `line-art-${Date.now()}.png`)
    }
    if (content.imageUrl) {
      downloadImage(content.imageUrl, `final-result-${Date.now()}.png`)
    }
  }

  const handleDownloadComparison = useCallback(async () => {
    const imagesToLoad: { url: string | null; img: HTMLImageElement }[] = [
      { url: originalImageUrl, img: new Image() },
    ]
    if (content.secondaryImageUrl && content.imageUrl) {
      imagesToLoad.push({ url: content.secondaryImageUrl, img: new Image() })
      imagesToLoad.push({ url: content.imageUrl, img: new Image() })
    } else if (content.imageUrl) {
      imagesToLoad.push({ url: content.imageUrl, img: new Image() })
    }

    const validImages = imagesToLoad.filter((item) => item.url)
    if (validImages.length < 2) return

    const loadPromises = validImages.map((item) => {
      item.img.crossOrigin = 'anonymous'
      item.img.src = item.url!
      return new Promise((resolve) => (item.img.onload = resolve))
    })

    await Promise.all(loadPromises)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const totalWidth = validImages.reduce((sum, item) => sum + item.img.width, 0)
    const maxHeight = Math.max(...validImages.map((item) => item.img.height))

    canvas.width = totalWidth
    canvas.height = maxHeight

    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary')
      .trim()
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let currentX = 0
    for (const item of validImages) {
      ctx.drawImage(item.img, currentX, (maxHeight - item.img.height) / 2)
      currentX += item.img.width
    }

    downloadImage(canvas.toDataURL('image/png'), `comparison-image-${Date.now()}.png`)
  }, [originalImageUrl, content.imageUrl, content.secondaryImageUrl])

  const ActionButton: React.FC<{
    onClick: () => void
    children: React.ReactNode
    isPrimary?: boolean
    className?: string
  }> = ({ onClick, children, isPrimary, className }) => (
    <Button
      type="button"
      onClick={onClick}
      variant={isPrimary ? 'default' : 'secondary'}
      className={`flex-1 min-w-[150px] ${className || ''}`}
    >
      {children}
    </Button>
  )

  const ViewSwitcherButton: React.FC<{
    mode: TwoStepViewMode | ViewMode
    currentMode: TwoStepViewMode | ViewMode
    onClick: () => void
    children: React.ReactNode
  }> = ({ mode, currentMode, onClick, children }) => (
    <Button
      type="button"
      size="sm"
      variant={currentMode === mode ? 'default' : 'ghost'}
      onClick={onClick}
      aria-pressed={currentMode === mode}
      className="h-7 px-3 text-xs"
    >
      {children}
    </Button>
  )

  // Special view for video results
  if (content.videoUrl) {
    const handleDownloadVideo = () => {
      downloadImage(content.videoUrl!, `generated-video-${Date.now()}.mp4`)
    }

    return (
      <div className="w-full h-full flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-full flex-grow relative bg-[var(--bg-primary)] rounded-lg overflow-hidden shadow-inner border border-[var(--border-primary)] flex items-center justify-center">
          <video src={content.videoUrl} controls className="max-w-full max-h-full object-contain" />
        </div>
        <div className="w-full flex flex-col md:flex-row gap-3 mt-2">
          <ActionButton onClick={handleDownloadVideo} isPrimary>
            <Download data-icon="inline-start" />
            <span>{t('resultDisplay.actions.download')}</span>
          </ActionButton>
        </div>
      </div>
    )
  }

  // Special view for text results (e.g. Vision API analysis)
  if (!content.imageUrl && content.text) {
    return (
      <div className="w-full h-full flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-full flex-grow bg-[var(--bg-primary)] rounded-lg shadow-inner border border-[var(--border-primary)] p-6 overflow-auto">
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              {t('resultDisplay.labels.analysisResult')}
            </h3>
            <p className="whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
              {content.text}
            </p>
          </div>
        </div>
        <div className="w-full flex flex-col md:flex-row gap-3 mt-2">
          <ActionButton onClick={() => navigator.clipboard.writeText(content.text!)} isPrimary>
            <Copy data-icon="inline-start" />
            <span>{t('resultDisplay.actions.copyText')}</span>
          </ActionButton>
        </div>
      </div>
    )
  }

  // Special view for two-step results
  if (content.secondaryImageUrl && content.imageUrl && originalImageUrl) {
    const imageMap: Record<ImageSelection, string> = {
      Original: originalImageUrl,
      'Line Art': content.secondaryImageUrl,
      'Final Result': content.imageUrl,
    }
    const imageOptions: ImageSelection[] = ['Original', 'Line Art', 'Final Result']
    const leftImageSrc = imageMap[sliderLeft]
    const rightImageSrc = imageMap[sliderRight]

    return (
      <div className="w-full h-full flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-full flex justify-center">
          <div className="p-1 bg-[var(--bg-secondary)] rounded-lg flex items-center gap-1">
            {(['result', 'grid', 'slider'] as TwoStepViewMode[]).map((mode) => (
              <ViewSwitcherButton
                key={mode}
                mode={mode}
                currentMode={twoStepViewMode}
                onClick={() => setTwoStepViewMode(mode)}
              >
                {t(`resultDisplay.viewModes.${mode}`)}
              </ViewSwitcherButton>
            ))}
          </div>
        </div>

        {twoStepViewMode === 'result' && (
          <div className="w-full h-full flex flex-col items-center gap-4 flex-grow">
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 flex-grow">
              {[
                { src: content.secondaryImageUrl, label: t('resultDisplay.labels.lineArt') },
                { src: content.imageUrl, label: t('resultDisplay.labels.finalResult') },
              ].map(({ src, label }) => (
                <button
                  type="button"
                  key={label}
                  className="relative rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-center flex-col p-1 aspect-square md:aspect-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  onClick={() => onImageClick(src!)}
                  aria-label={`${t('resultDisplay.actions.preview')} ${label}`}
                >
                  <img
                    src={src!}
                    alt={label}
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-2 py-1 rounded">
                    {label}
                  </div>
                </button>
              ))}
            </div>
            <div className="w-full flex flex-col md:flex-row flex-wrap gap-3 mt-auto">
              <ActionButton onClick={() => onImageClick(content.imageUrl!)}>
                <Eye data-icon="inline-start" />
                {t('resultDisplay.actions.preview')}
              </ActionButton>
              <ActionButton onClick={handleDownloadBoth}>
                <Download data-icon="inline-start" />
                {t('resultDisplay.actions.downloadBoth')}
              </ActionButton>
              <ActionButton onClick={handleDownload}>
                <Download data-icon="inline-start" />
                {t('resultDisplay.actions.download')}
              </ActionButton>
              <ActionButton onClick={() => onUseImageAsInput(content.secondaryImageUrl!)}>
                <Edit3 data-icon="inline-start" />
                {t('resultDisplay.actions.useLineArtAsInput')}
              </ActionButton>
              <ActionButton onClick={() => onUseImageAsInput(content.imageUrl!)} isPrimary>
                <Edit3 data-icon="inline-start" />
                {t('resultDisplay.actions.useFinalAsInput')}
              </ActionButton>
            </div>
          </div>
        )}

        {twoStepViewMode === 'grid' && (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-3 gap-2 flex-grow">
            {[
              { src: originalImageUrl, label: t('resultDisplay.labels.original') },
              { src: content.secondaryImageUrl, label: t('resultDisplay.labels.lineArt') },
              { src: content.imageUrl, label: t('resultDisplay.labels.finalResult') },
            ].map(({ src, label }) => (
              <div
                key={label}
                className="relative rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-center flex-col p-1 aspect-square md:aspect-auto"
              >
                <img src={src} alt={label} className="max-w-full max-h-full object-contain" />
                <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-2 py-1 rounded">
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {twoStepViewMode === 'slider' && (
          <div className="w-full flex-grow flex flex-col gap-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <select
                value={sliderLeft}
                onChange={(e) => setSliderLeft(e.target.value as ImageSelection)}
                className="bg-[var(--bg-secondary)] border-[var(--border-primary)] border text-[var(--text-primary)] rounded p-1"
              >
                {imageOptions
                  .filter((o) => o !== sliderRight)
                  .map((o) => (
                    <option key={o} value={o}>
                      {t(
                        `resultDisplay.labels.${o.charAt(0).toLowerCase() + o.slice(1).replace(/\s+/g, '')}`
                      )}
                    </option>
                  ))}
              </select>
              <span>{t('resultDisplay.sliderPicker.vs')}</span>
              <select
                value={sliderRight}
                onChange={(e) => setSliderRight(e.target.value as ImageSelection)}
                className="bg-[var(--bg-secondary)] border-[var(--border-primary)] border text-[var(--text-primary)] rounded p-1"
              >
                {imageOptions
                  .filter((o) => o !== sliderLeft)
                  .map((o) => (
                    <option key={o} value={o}>
                      {t(
                        `resultDisplay.labels.${o.charAt(0).toLowerCase() + o.slice(1).replace(/\s+/g, '')}`
                      )}
                    </option>
                  ))}
              </select>
            </div>
            <div
              ref={sliderContainerRef}
              onMouseDown={handleMouseDown}
              className="relative w-full h-full overflow-hidden rounded-lg cursor-ew-resize border border-[var(--border-primary)] select-none bg-[var(--bg-primary)]"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={leftImageSrc}
                  alt={sliderLeft}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={rightImageSrc}
                  alt={sliderRight}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div
                className="absolute top-0 bottom-0 bg-[var(--accent-primary)] w-1 cursor-ew-resize"
                style={{ left: `calc(${sliderPosition}% - 2px)` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 bg-[var(--accent-primary)] h-8 w-8 rounded-full border-2 border-[var(--bg-primary)] flex items-center justify-center text-[var(--text-on-accent)]">
                  <ChevronsLeftRight className="h-4 w-4" strokeWidth={3} />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(event) => setSliderPosition(Number(event.target.value))}
                aria-label={`${sliderLeft} ${t('resultDisplay.sliderPicker.vs')} ${sliderRight}`}
                className="absolute bottom-4 left-4 right-4 z-10 accent-[var(--accent-primary)]"
              />
            </div>
          </div>
        )}

        {twoStepViewMode !== 'result' && (
          <div className="w-full flex flex-col md:flex-row flex-wrap gap-3 mt-auto">
            <ActionButton onClick={() => onImageClick(content.imageUrl!)}>
              <Eye data-icon="inline-start" />
              <span>{t('resultDisplay.actions.preview')}</span>
            </ActionButton>
            <ActionButton onClick={handleDownloadComparison}>
              <SlidersHorizontal data-icon="inline-start" />
              <span>{t('resultDisplay.actions.downloadComparison')}</span>
            </ActionButton>
            <ActionButton onClick={handleDownload}>
              <Download data-icon="inline-start" />
              <span>{t('resultDisplay.actions.download')}</span>
            </ActionButton>
            <ActionButton onClick={() => onUseImageAsInput(content.secondaryImageUrl!)}>
              <Edit3 data-icon="inline-start" />
              <span>{t('resultDisplay.actions.useLineArtAsInput')}</span>
            </ActionButton>
            <ActionButton onClick={() => onUseImageAsInput(content.imageUrl!)} isPrimary>
              <Edit3 data-icon="inline-start" />
              <span>{t('resultDisplay.actions.useFinalAsInput')}</span>
            </ActionButton>
          </div>
        )}
      </div>
    )
  }

  const ViewSwitcher = () => (
    <div className="w-full flex justify-center">
      <div className="p-1 bg-[var(--bg-secondary)] rounded-lg flex items-center gap-1">
        {(['result', 'side-by-side', 'slider'] as ViewMode[]).map((mode) => (
          <ViewSwitcherButton
            key={mode}
            mode={mode}
            currentMode={viewMode}
            onClick={() => setViewMode(mode)}
          >
            {t(
              `resultDisplay.viewModes.${mode.replace(/-(\w)/g, (all, letter) => letter.toUpperCase())}`
            )}
          </ViewSwitcherButton>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 animate-fade-in">
      {content.imageUrl && originalImageUrl && <ViewSwitcher />}

      <div className="w-full flex-grow relative">
        {viewMode === 'result' && content.imageUrl && (
          <button
            type="button"
            className="w-full h-full relative bg-[var(--bg-primary)] rounded-lg overflow-hidden shadow-inner cursor-pointer group border border-[var(--border-primary)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            onClick={() => onImageClick(content.imageUrl!)}
            aria-label={t('resultDisplay.actions.preview')}
          >
            <img
              src={content.imageUrl}
              alt="Generated result"
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <ZoomIn className="h-10 w-10 text-white" />
            </div>
          </button>
        )}

        {viewMode === 'side-by-side' && content.imageUrl && originalImageUrl && (
          <div className="w-full h-full grid grid-cols-2 gap-2">
            <div className="relative rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-center">
              <img
                src={originalImageUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-2 py-1 rounded">
                {t('resultDisplay.labels.original')}
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-center">
              <img
                src={content.imageUrl}
                alt="Generated"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-2 py-1 rounded">
                {t('resultDisplay.labels.generated')}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'slider' && content.imageUrl && originalImageUrl && (
          <div
            ref={sliderContainerRef}
            onMouseDown={handleMouseDown}
            className="relative w-full h-full overflow-hidden rounded-lg cursor-ew-resize border border-[var(--border-primary)] select-none bg-[var(--bg-primary)]"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={originalImageUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={content.imageUrl}
                alt="Generated"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div
              className="absolute top-0 bottom-0 bg-[var(--accent-primary)] w-1 cursor-ew-resize"
              style={{ left: `calc(${sliderPosition}% - 2px)` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -left-3.5 bg-[var(--accent-primary)] h-8 w-8 rounded-full border-2 border-[var(--bg-primary)] flex items-center justify-center text-[var(--text-on-accent)]">
                <ChevronsLeftRight className="h-4 w-4" strokeWidth={3} />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(event) => setSliderPosition(Number(event.target.value))}
              aria-label={`${t('resultDisplay.labels.original')} ${t('resultDisplay.sliderPicker.vs')} ${t('resultDisplay.labels.generated')}`}
              className="absolute bottom-4 left-4 right-4 z-10 accent-[var(--accent-primary)]"
            />
          </div>
        )}
      </div>

      <div className="w-full flex flex-col md:flex-row flex-wrap gap-3 mt-2">
        {content.imageUrl && (
          <>
            <ActionButton onClick={() => onImageClick(content.imageUrl!)}>
              <Eye data-icon="inline-start" />
              <span>{t('resultDisplay.actions.preview')}</span>
            </ActionButton>
            {originalImageUrl && (
              <ActionButton onClick={handleDownloadComparison}>
                <SlidersHorizontal data-icon="inline-start" />
                <span>{t('resultDisplay.actions.downloadComparison')}</span>
              </ActionButton>
            )}
            <ActionButton onClick={handleDownload}>
              <Download data-icon="inline-start" />
              <span>{t('resultDisplay.actions.download')}</span>
            </ActionButton>
            <ActionButton onClick={() => onUseImageAsInput(content.imageUrl!)} isPrimary>
              <Edit3 data-icon="inline-start" />
              <span>{t('resultDisplay.actions.useAsInput')}</span>
            </ActionButton>
          </>
        )}
      </div>

      {content.text && (
        <p className="w-full text-center text-[var(--text-secondary)] bg-[var(--bg-secondary)] p-3 rounded-md italic mt-4">
          "{content.text}"
        </p>
      )}
    </div>
  )
}

const style = document.createElement('style')
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`
document.head.appendChild(style)

export default ResultDisplay
