import React, { useMemo, useRef, useState } from 'react'
import { ArrowLeft, Grip, ImageIcon, Layers3, Lock, PencilRuler, Video } from 'lucide-react'
import type { Transformation } from '../types'
import { useTranslation } from '../i18n/context'
import { Button } from '@/components/ui/button'

interface TransformationSelectorProps {
  transformations: Transformation[]
  onSelect: (transformation: Transformation) => void
  hasPreviousResult: boolean
  onOrderChange: (newOrder: Transformation[]) => void
  activeCategory: Transformation | null
  setActiveCategory: (category: Transformation | null) => void
}

const getPreviewImage = (transformation: Transformation) => {
  if (transformation.exampleImage) return transformation.exampleImage
  return transformation.items?.find((item) => item.exampleImage)?.exampleImage
}

const getInputTags = (transformation: Transformation) => {
  if (transformation.items?.length) return ['category']

  const tags: string[] = []
  if (transformation.isTextToImage) tags.push('textToImage')
  if (transformation.isVideo) tags.push('video')
  if (transformation.isTwoStep) tags.push('twoStep')
  if (transformation.supportsMask) tags.push('mask')
  if (transformation.isMultiImage) {
    tags.push(transformation.isSecondaryOptional ? 'optionalReference' : 'doubleImage')
  } else if (!transformation.isTextToImage && !transformation.isVideo) {
    tags.push('singleImage')
  }

  return tags.slice(0, 3)
}

const TransformationSelector: React.FC<TransformationSelectorProps> = ({
  transformations,
  onSelect,
  hasPreviousResult,
  onOrderChange,
  activeCategory,
  setActiveCategory,
}) => {
  const { t } = useTranslation()
  const dragItemIndex = useRef<number | null>(null)
  const dragOverItemIndex = useRef<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [isOrganizing, setIsOrganizing] = useState(false)

  const visibleItems = useMemo(
    () => activeCategory?.items || transformations,
    [activeCategory, transformations]
  )

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    dragItemIndex.current = index
    setDragging(true)
    const target = e.currentTarget
    setTimeout(() => {
      target.classList.add('opacity-40', 'scale-[0.98]')
    }, 0)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    dragOverItemIndex.current = index
  }

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    setDragging(false)
    e.currentTarget.classList.remove('opacity-40', 'scale-[0.98]')

    if (
      dragItemIndex.current !== null &&
      dragOverItemIndex.current !== null &&
      dragItemIndex.current !== dragOverItemIndex.current
    ) {
      const newTransformations = [...transformations]
      const draggedItemContent = newTransformations.splice(dragItemIndex.current, 1)[0]
      newTransformations.splice(dragOverItemIndex.current, 0, draggedItemContent)
      onOrderChange(newTransformations)
    }

    dragItemIndex.current = null
    dragOverItemIndex.current = null
  }

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  const handleItemClick = (item: Transformation) => {
    if (isOrganizing) return

    if (item.items && item.items.length > 0) {
      setActiveCategory(item)
    } else {
      onSelect(item)
    }
  }

  const renderPreview = (transformation: Transformation) => {
    const previewImage = getPreviewImage(transformation)

    if (previewImage) {
      return (
        <img
          src={previewImage}
          alt={t(transformation.titleKey)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )
    }

    return (
      <div className="film-rail flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[var(--text-tertiary)]">
          {transformation.isVideo ? (
            <Video className="size-8 text-[var(--accent-secondary)]" />
          ) : transformation.isTextToImage ? (
            <PencilRuler className="size-8 text-[var(--accent-primary)]" />
          ) : (
            <ImageIcon className="size-8 text-[var(--accent-primary)]" />
          )}
          <span className="text-4xl">{transformation.emoji}</span>
        </div>
      </div>
    )
  }

  const renderGrid = (items: Transformation[]) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((trans, index) => {
        const tags = getInputTags(trans)
        const canDrag = !activeCategory && isOrganizing

        return (
          <Button
            type="button"
            key={trans.key}
            variant="ghost"
            draggable={canDrag}
            onDragStart={(e) => canDrag && handleDragStart(e, index)}
            onDragEnter={(e) => canDrag && handleDragEnter(e, index)}
            onDragEnd={(e) => canDrag && handleDragEnd(e)}
            onDragOver={(e) => canDrag && handleDragOver(e)}
            onClick={() => handleItemClick(trans)}
            className={`group studio-surface h-auto min-h-[290px] flex-col items-stretch overflow-hidden rounded-lg p-0 text-left whitespace-normal transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] ${
              canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
            } ${dragging && !activeCategory ? 'border-dashed' : ''}`}
          >
            <div className="relative aspect-[4/3] overflow-hidden border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
              {renderPreview(trans)}
              <div className="absolute left-3 top-3 rounded-md border border-black/20 bg-black/60 px-2 py-1 text-lg shadow-lg">
                {trans.emoji}
              </div>
              {canDrag && (
                <div className="absolute right-3 top-3 rounded-md bg-black/60 p-1.5 text-white">
                  <Grip className="size-4" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-[var(--text-primary)]">
                  {t(trans.titleKey)}
                </div>
                {trans.descriptionKey && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {t(trans.descriptionKey)}
                  </p>
                )}
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="cyan-pill rounded-full px-2.5 py-1 text-xs font-medium">
                    {t(`transformationSelector.tags.${tag}`)}
                  </span>
                ))}
              </div>
            </div>
          </Button>
        )
      })}
    </div>
  )

  return (
    <div className="container mx-auto flex flex-col gap-8 p-4 pb-24 md:p-8">
      <div className="studio-surface rounded-lg p-5 md:p-6">
        {!activeCategory ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="process-pill mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
                <Layers3 className="size-3.5" />
                <span>{t('transformationSelector.shelf')}</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {t('transformationSelector.title')}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
                {hasPreviousResult
                  ? t('transformationSelector.descriptionWithResult')
                  : t('transformationSelector.description')}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsOrganizing((current) => !current)}
              variant={isOrganizing ? 'default' : 'secondary'}
              aria-pressed={isOrganizing}
            >
              {isOrganizing ? (
                <Lock data-icon="inline-start" />
              ) : (
                <Grip data-icon="inline-start" />
              )}
              {isOrganizing
                ? t('transformationSelector.doneOrganizing')
                : t('transformationSelector.organize')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveCategory(null)}
              className="w-fit"
            >
              <ArrowLeft data-icon="inline-start" />
              {t('app.back')}
            </Button>
            <div>
              <div className="text-sm text-[var(--text-tertiary)]">
                {t('transformationSelector.categoryLabel')}
              </div>
              <h2 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
                <span>{activeCategory.emoji}</span>
                {t(activeCategory.titleKey)}
              </h2>
            </div>
          </div>
        )}
      </div>

      {renderGrid(visibleItems)}
    </div>
  )
}

export default TransformationSelector
