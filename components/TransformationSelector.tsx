import React, { useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
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

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    dragItemIndex.current = index
    setDragging(true)
    const target = e.currentTarget
    setTimeout(() => {
      target.classList.add('opacity-40', 'scale-95')
    }, 0)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    dragOverItemIndex.current = index
  }

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    setDragging(false)
    e.currentTarget.classList.remove('opacity-40', 'scale-95')

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

  const renderGrid = (items: Transformation[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((trans, index) => (
        <Button
          type="button"
          key={trans.key}
          variant="ghost"
          draggable={!activeCategory && isOrganizing}
          onDragStart={(e) => !activeCategory && isOrganizing && handleDragStart(e, index)}
          onDragEnter={(e) => !activeCategory && isOrganizing && handleDragEnter(e, index)}
          onDragEnd={(e) => !activeCategory && isOrganizing && handleDragEnd(e)}
          onDragOver={(e) => !activeCategory && isOrganizing && handleDragOver(e)}
          onClick={() => handleItemClick(trans)}
          className={`group h-auto flex-col text-center p-4 aspect-square bg-[var(--bg-card)] rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${
            isOrganizing && !activeCategory ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
          } ${dragging && !activeCategory ? 'border-dashed' : ''}`}
        >
          <span className="text-4xl mb-2 transition-transform duration-200 group-hover:scale-110">
            {trans.emoji}
          </span>
          <span className="font-semibold text-sm text-[var(--text-primary)]">
            {t(trans.titleKey)}
          </span>
        </Button>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in">
      {!activeCategory ? (
        <>
          <h2 className="text-3xl font-bold text-center mb-4 text-[var(--accent-primary)]">
            {t('transformationSelector.title')}
          </h2>
          <p className="text-lg text-center text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
            {hasPreviousResult
              ? t('transformationSelector.descriptionWithResult')
              : t('transformationSelector.description')}
          </p>
          <div className="mb-6 flex justify-center">
            <Button
              type="button"
              onClick={() => setIsOrganizing((current) => !current)}
              variant={isOrganizing ? 'default' : 'secondary'}
              aria-pressed={isOrganizing}
            >
              {isOrganizing
                ? t('transformationSelector.doneOrganizing')
                : t('transformationSelector.organize')}
            </Button>
          </div>
          {renderGrid(transformations)}
        </>
      ) : (
        <div>
          <div className="mb-8 flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setActiveCategory(null)}
              className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]"
            >
              <ArrowLeft data-icon="inline-start" />
              {t('app.back')}
            </Button>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center gap-3">
              <span className="text-4xl">{activeCategory.emoji}</span>
              {t(activeCategory.titleKey)}
            </h2>
          </div>
          {renderGrid(activeCategory.items || [])}
        </div>
      )}
    </div>
  )
}

export default TransformationSelector
