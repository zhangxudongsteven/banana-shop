'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { GeneratedContent } from '../types'

interface HistoryContextType {
  history: GeneratedContent[]
  addHistoryItem: (item: GeneratedContent) => void
  isHistoryPanelOpen: boolean
  toggleHistoryPanel: () => void
  closeHistoryPanel: () => void
  selectedImageToEdit: string | null
  setSelectedImageToEdit: (url: string | null) => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<GeneratedContent[]>([])
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)
  const [selectedImageToEdit, setSelectedImageToEdit] = useState<string | null>(null)

  // Clean up blob URLs when history items are removed or component unmounts
  // In a real app with persistence, we wouldn't use blob URLs for long-term storage
  useEffect(() => {
    return () => {
      history.forEach((item) => {
        if (item.videoUrl) {
          URL.revokeObjectURL(item.videoUrl)
        }
      })
    }
  }, [history])

  const addHistoryItem = (item: GeneratedContent) => {
    setHistory((prev) => [item, ...prev])
  }

  const toggleHistoryPanel = () => setIsHistoryPanelOpen((prev) => !prev)
  const closeHistoryPanel = () => setIsHistoryPanelOpen(false)

  return (
    <HistoryContext.Provider
      value={{
        history,
        addHistoryItem,
        isHistoryPanelOpen,
        toggleHistoryPanel,
        closeHistoryPanel,
        selectedImageToEdit,
        setSelectedImageToEdit,
      }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext)
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider')
  }
  return context
}
