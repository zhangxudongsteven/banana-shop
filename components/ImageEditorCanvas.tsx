import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser, ImagePlus, Undo2, X } from 'lucide-react'
import { useTranslation } from '../i18n/context'
import { Button } from '@/components/ui/button'

interface ImageEditorCanvasProps {
  onImageSelect: (file: File, dataUrl: string) => void
  initialImageUrl: string | null
  onMaskChange: (dataUrl: string | null) => void
  onClearImage: () => void
  isMaskToolActive: boolean
}

const ImageEditorCanvas: React.FC<ImageEditorCanvasProps> = ({
  onImageSelect,
  initialImageUrl,
  onMaskChange,
  onClearImage,
  isMaskToolActive,
}) => {
  const { t } = useTranslation()
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [image, setImage] = useState<HTMLImageElement | null>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)
  const [brushSize, setBrushSize] = useState(20)
  const [history, setHistory] = useState<ImageData[]>([])

  const [isDragging, setIsDragging] = useState(false) // For file drop

  const getCanvasContexts = useCallback(() => {
    const imageCanvas = imageCanvasRef.current
    const maskCanvas = maskCanvasRef.current
    const imageCtx = imageCanvas?.getContext('2d')
    const maskCtx = maskCanvas?.getContext('2d')
    return { imageCanvas, maskCanvas, imageCtx, maskCtx }
  }, [])

  const draw = useCallback(() => {
    const { imageCtx, imageCanvas, maskCanvas } = getCanvasContexts()
    const container = containerRef.current

    if (!imageCtx || !imageCanvas || !image || !container) return

    const contRatio = container.clientWidth / container.clientHeight
    const imgRatio = image.width / image.height

    let displayW, displayH, displayX, displayY
    if (contRatio > imgRatio) {
      displayH = container.clientHeight
      displayW = displayH * imgRatio
    } else {
      displayW = container.clientWidth
      displayH = displayW / imgRatio
    }
    displayX = (container.clientWidth - displayW) / 2
    displayY = (container.clientHeight - displayH) / 2
    ;[imageCanvas, maskCanvas].forEach((canvas) => {
      if (canvas) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    })

    imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height)
    imageCtx.drawImage(image, displayX, displayY, displayW, displayH)
  }, [image, getCanvasContexts])

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      setHistory([])
      const { maskCtx, maskCanvas } = getCanvasContexts()
      if (maskCtx && maskCanvas) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
        onMaskChange(null)
      }
    }
    if (initialImageUrl) {
      img.src = initialImageUrl
    } else {
      setImage(null)
    }
  }, [initialImageUrl, getCanvasContexts, onMaskChange])

  useEffect(() => {
    draw()
    const handleResize = () => draw()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [draw, image])

  const saveToHistory = useCallback(() => {
    const { maskCtx, maskCanvas } = getCanvasContexts()
    if (maskCtx && maskCanvas) {
      setHistory((prev) => [
        ...prev,
        maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
      ])
    }
  }, [getCanvasContexts])

  const clearMask = useCallback(() => {
    const { maskCtx, maskCanvas } = getCanvasContexts()
    if (maskCtx && maskCanvas) {
      saveToHistory()
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
      onMaskChange(null)
      setHistory((prev) => [
        ...prev,
        maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height),
      ])
    }
  }, [getCanvasContexts, onMaskChange, saveToHistory])

  const handleUndo = useCallback(() => {
    const { maskCtx, maskCanvas } = getCanvasContexts()
    if (!maskCtx || !maskCanvas || history.length === 0) return

    const newHistory = history.slice(0, -1)
    setHistory(newHistory)
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)

    if (newHistory.length > 0) {
      maskCtx.putImageData(newHistory[newHistory.length - 1], 0, 0)
      onMaskChange(maskCanvas.toDataURL())
    } else {
      onMaskChange(null)
    }
  }, [getCanvasContexts, onMaskChange, history])

  const getMaskCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = maskCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top
    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getMaskCoordinates(e)
    if (!coords) return
    saveToHistory()
    setIsDrawing(true)
    setLastPos(coords)
  }

  const doDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const coords = getMaskCoordinates(e)
    if (!coords || !lastPos) return
    const { maskCtx } = getCanvasContexts()
    if (maskCtx) {
      maskCtx.beginPath()
      const accentColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-primary')
        .trim()
      maskCtx.strokeStyle = `${accentColor}b3` // 70% opacity
      maskCtx.lineWidth = brushSize
      maskCtx.lineCap = 'round'
      maskCtx.lineJoin = 'round'
      maskCtx.moveTo(lastPos.x, lastPos.y)
      maskCtx.lineTo(coords.x, coords.y)
      maskCtx.stroke()
    }
    setLastPos(coords)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPos(null)
    onMaskChange(maskCanvasRef.current?.toDataURL() ?? null)
  }

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        onImageSelect(file, e.target?.result as string)
      }
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

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-full aspect-square bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center transition-colors duration-200 select-none ${
          isDragging
            ? 'outline-dashed outline-2 outline-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)]'
            : ''
        } ${initialImageUrl ? 'p-0' : 'p-4 border-2 border-dashed border-[var(--border-primary)]'}`}
      >
        {!initialImageUrl ? (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center text-[var(--text-tertiary)] cursor-pointer w-full h-full"
          >
            <ImagePlus className="mb-3 h-10 w-10" strokeWidth={1.5} />
            <p className="mb-2 text-sm">
              <span className="font-semibold text-[var(--text-secondary)]">
                {t('imageEditor.upload')}
              </span>{' '}
              {t('imageEditor.dragAndDrop')}
            </p>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*"
            />
          </label>
        ) : (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={onClearImage}
              className="absolute top-2 right-2 z-30 size-8 rounded-full bg-black/50 text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              <X data-icon="inline-start" />
            </Button>
            <canvas ref={imageCanvasRef} className="absolute top-0 left-0" style={{ zIndex: 1 }} />
            <canvas
              ref={maskCanvasRef}
              className="absolute top-0 left-0"
              style={{
                zIndex: 3,
                touchAction: 'none',
                cursor: isMaskToolActive ? 'crosshair' : 'default',
              }}
              onMouseDown={isMaskToolActive ? startDrawing : undefined}
              onMouseMove={isMaskToolActive ? doDraw : undefined}
              onMouseUp={isMaskToolActive ? stopDrawing : undefined}
              onMouseLeave={isMaskToolActive ? stopDrawing : undefined}
              onTouchStart={isMaskToolActive ? startDrawing : undefined}
              onTouchMove={isMaskToolActive ? doDraw : undefined}
              onTouchEnd={isMaskToolActive ? stopDrawing : undefined}
            />
          </>
        )}
      </div>
      {initialImageUrl && isMaskToolActive && (
        <div className="p-3 bg-black/60 backdrop-blur-md rounded-lg flex flex-col gap-4 border border-[var(--border-primary)] animate-fade-in-fast">
          <p className="text-xs text-[var(--text-secondary)] -mb-2">
            {t('imageEditor.maskPanelInfo')}
          </p>
          <div className="flex items-center gap-4">
            <label
              htmlFor="brush-size"
              className="text-sm font-medium text-[var(--text-primary)] whitespace-nowrap"
            >
              {t('imageEditor.brushSize')}
            </label>
            <input
              id="brush-size"
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-[var(--text-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              variant="secondary"
            >
              <Undo2 data-icon="inline-start" />
              {t('imageEditor.undo')}
            </Button>
            <Button
              type="button"
              onClick={clearMask}
              disabled={history.length === 0}
              variant="secondary"
            >
              <Eraser data-icon="inline-start" />
              {t('imageEditor.clearMask')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageEditorCanvas
