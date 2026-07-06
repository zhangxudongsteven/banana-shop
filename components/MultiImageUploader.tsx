import React, { useCallback, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from '../i18n/context'
import { Button } from '@/components/ui/button'

interface UploaderBoxProps {
  onImageSelect: (file: File, dataUrl: string) => void
  imageUrl: string | null
  onClear: () => void
  title: string
  description: string
}

const UploaderBox: React.FC<UploaderBoxProps> = ({
  onImageSelect,
  imageUrl,
  onClear,
  title,
  description,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const { t } = useTranslation()

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => onImageSelect(file, e.target?.result as string)
      reader.readAsDataURL(file)
    },
    [onImageSelect]
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) handleFile(event.target.files[0])
  }
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)
      if (event.dataTransfer.files?.[0]) handleFile(event.dataTransfer.files[0])
    },
    [handleFile]
  )
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const inputId = `file-upload-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex aspect-square w-full items-center justify-center rounded-lg bg-[var(--bg-secondary)] transition-colors duration-200 select-none ${
          isDragging
            ? 'outline-dashed outline-2 outline-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)]'
            : ''
        } ${imageUrl ? 'p-0' : 'film-rail border-2 border-dashed border-[var(--border-primary)] p-4'}`}
      >
        {!imageUrl ? (
          <label
            htmlFor={inputId}
            className="flex flex-col items-center justify-center text-[var(--text-tertiary)] cursor-pointer w-full h-full text-center"
          >
            <ImagePlus className="mb-2 h-8 w-8" strokeWidth={1.5} />
            <p className="mb-1 text-xs font-semibold text-[var(--text-secondary)]">
              {t('imageEditor.upload')}
            </p>
            <p className="text-xs">{description}</p>
            <input
              id={inputId}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
          </label>
        ) : (
          <>
            <img src={imageUrl} alt={title} className="w-full h-full object-contain rounded-lg" />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={onClear}
              className="absolute top-2 right-2 z-10 size-8 rounded-full bg-black/50 text-white hover:bg-red-600"
              aria-label={`Remove ${title} image`}
            >
              <X data-icon="inline-start" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

interface MultiImageUploaderProps {
  onPrimarySelect: (file: File, dataUrl: string) => void
  onSecondarySelect: (file: File, dataUrl: string) => void
  primaryImageUrl: string | null
  secondaryImageUrl: string | null
  onClearPrimary: () => void
  onClearSecondary: () => void
  primaryTitle?: string
  primaryDescription?: string
  secondaryTitle?: string
  secondaryDescription?: string
}

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  onPrimarySelect,
  onSecondarySelect,
  primaryImageUrl,
  secondaryImageUrl,
  onClearPrimary,
  onClearSecondary,
  primaryTitle,
  primaryDescription,
  secondaryTitle,
  secondaryDescription,
}) => {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UploaderBox
        title={primaryTitle ?? t('transformations.pose.uploader1Title')}
        description={primaryDescription ?? t('transformations.pose.uploader1Desc')}
        imageUrl={primaryImageUrl}
        onImageSelect={onPrimarySelect}
        onClear={onClearPrimary}
      />
      <UploaderBox
        title={secondaryTitle ?? t('transformations.pose.uploader2Title')}
        description={secondaryDescription ?? t('transformations.pose.uploader2Desc')}
        imageUrl={secondaryImageUrl}
        onImageSelect={onSecondarySelect}
        onClear={onClearSecondary}
      />
    </div>
  )
}

export default MultiImageUploader
