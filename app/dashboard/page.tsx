'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TRANSFORMATIONS } from '../../lib/constants'
import type { Transformation } from '../../types'
import TransformationSelector from '../../components/TransformationSelector'
import { useHistory } from '../../contexts/HistoryContext'

const DashboardPage: React.FC = () => {
  const router = useRouter()
  const { selectedImageToEdit } = useHistory()

  const [transformations, setTransformations] = useState<Transformation[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedOrder = localStorage.getItem('transformationOrder')
        if (savedOrder) {
          const orderedKeys = JSON.parse(savedOrder) as string[]
          const transformationMap = new Map(TRANSFORMATIONS.map((t) => [t.key, t]))

          const orderedTransformations = orderedKeys
            .map((key) => transformationMap.get(key))
            .filter((t): t is Transformation => !!t)

          const savedKeysSet = new Set(orderedKeys)
          const newTransformations = TRANSFORMATIONS.filter((t) => !savedKeysSet.has(t.key))

          return [...orderedTransformations, ...newTransformations]
        }
      }
    } catch (e) {
      console.error('Failed to load or parse transformation order from localStorage', e)
    }
    return TRANSFORMATIONS
  })

  const [activeCategory, setActiveCategory] = useState<Transformation | null>(null)

  useEffect(() => {
    try {
      const orderToSave = transformations.map((t) => t.key)
      localStorage.setItem('transformationOrder', JSON.stringify(orderToSave))
    } catch (e) {
      console.error('Failed to save transformation order to localStorage', e)
    }
  }, [transformations])

  const handleSelectTransformation = (transformation: Transformation) => {
    router.push(`/dashboard/${transformation.key}`)
  }

  return (
    <TransformationSelector
      transformations={transformations}
      onSelect={handleSelectTransformation}
      hasPreviousResult={!!selectedImageToEdit}
      onOrderChange={setTransformations}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
    />
  )
}

export default DashboardPage
