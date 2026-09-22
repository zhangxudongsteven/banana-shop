'use client'

import React, { useId, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/context'
import { readImageFile, IMAGE_MIME_TYPES } from '@/utils/imageInput'

export interface ImageUploaderProps {
  onImageSelect: (file: File, dataUrl: string) => void
  imageUrl: string | null
  onClear: () => void
  title?: string
  description?: string
  disabled?: boolean
  otherImageBytes?: number
  onBusyChange?: (busy: boolean) => void
}

export default function ImageUploader({
  onImageSelect,
  imageUrl,
  onClear,
  title,
  description,
  disabled = false,
  otherImageBytes = 0,
  onBusyChange,
}: ImageUploaderProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const requestRef = useRef(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const id = useId()
  const locked = disabled || busy

  const select = async (file?: File) => {
    if (!file || disabledRef.current || busy) return
    const request = ++requestRef.current
    setBusy(true)
    onBusyChange?.(true)
    setError(null)
    try {
      const dataUrl = await readImageFile(file, otherImageBytes)
      if (!disabledRef.current && request === requestRef.current) onImageSelect(file, dataUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'imageEditor.readFailed')
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!locked) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!locked) void select(event.dataTransfer.files[0])
        }}
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-[var(--bg-secondary)] ${dragging ? 'border-primary' : 'border-border'}`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={title || t('app.input')}
              className="size-full object-contain"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              disabled={locked}
              className="absolute right-2 top-2"
              aria-label={`${t('imageEditor.remove')} ${title || t('app.input')}`}
              onClick={() => {
                setError(null)
                onClear()
              }}
            >
              <X />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={locked}
            onClick={() => inputRef.current?.click()}
            aria-describedby={`${id}-hint`}
            className="h-auto w-full flex-col whitespace-normal p-4"
          >
            <ImagePlus />
            <span>{busy ? t('imageEditor.reading') : t('imageEditor.upload')}</span>
            <span className="text-xs text-muted-foreground">
              {description || t('imageEditor.dragAndDrop')}
            </span>
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          tabIndex={-1}
          className="hidden"
          accept={IMAGE_MIME_TYPES.join(',')}
          disabled={locked}
          aria-label={title || t('imageEditor.upload')}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            void select(file)
          }}
        />
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {t('imageEditor.limits')}
      </p>
      {error && (
        <p role="alert" className="text-sm text-[var(--text-error)]">
          {t(error)}
        </p>
      )}
    </div>
  )
}
