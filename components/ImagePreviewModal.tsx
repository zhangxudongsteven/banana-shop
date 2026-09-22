'use client'

import { toast } from 'sonner'
import { downloadImage } from '@/utils/fileUtils'
import React, { useEffect, useRef } from 'react'
import { Download, X } from 'lucide-react'
import { useTranslation } from '../i18n/context'
import { Button } from '@/components/ui/button'

interface ImagePreviewModalProps {
  imageUrl: string | null
  onClose: () => void
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
  const { t } = useTranslation()
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!imageUrl) return

    const previousActiveElement = document.activeElement
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus()
    }
  }, [imageUrl, onClose])

  if (!imageUrl) {
    return null
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent modal from closing
    if (!imageUrl) return
    void downloadImage(imageUrl, `generated-image-${Date.now()}.png`).catch(() =>
      toast.error(t('app.error.downloadFailed'))
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-preview-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <h2 id="image-preview-title" className="sr-only">
        Generated result preview
      </h2>
      <div
        className="relative max-w-4xl max-h-[85vh] w-full h-full flex-grow"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking on the image
      >
        <img
          src={imageUrl}
          alt="Generated result preview"
          className="w-full h-full object-contain rounded-lg shadow-2xl"
        />
        <Button
          ref={closeButtonRef}
          type="button"
          size="icon"
          variant="secondary"
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 rounded-full bg-black/70 text-white hover:bg-red-600"
          aria-label="Close preview"
        >
          <X data-icon="inline-start" />
        </Button>
      </div>
      <div className="flex-shrink-0 mt-4">
        <Button type="button" variant="secondary" onClick={handleDownload}>
          <Download data-icon="inline-start" />
          <span>{t('resultDisplay.actions.download')}</span>
        </Button>
      </div>
      <style>
        {`
          @keyframes fadeInFast {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in-fast {
            animation: fadeInFast 0.2s ease-out forwards;
          }
        `}
      </style>
    </div>
  )
}

export default ImagePreviewModal
