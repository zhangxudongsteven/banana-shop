'use client'

import React, { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react'
import { listGenerationHistoryAction, recordGenerationHistoryAction } from '../actions/history-actions'
import type { GeneratedContent, GenerationHistoryItem, RecordGenerationHistoryInput } from '../types'

interface HistoryContextType {
  history: GenerationHistoryItem[]
  addHistoryItem: (item: GeneratedContent) => void
  recordHistoryItem: (
    item: GeneratedContent,
    historyInput: RecordGenerationHistoryInput
  ) => Promise<void>
  refreshHistory: () => Promise<void>
  isLoadingHistory: boolean
  historyError: string | null
  isHistoryPanelOpen: boolean
  toggleHistoryPanel: () => void
  closeHistoryPanel: () => void
  selectedImageToEdit: string | null
  setSelectedImageToEdit: (url: string | null) => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)
  const [selectedImageToEdit, setSelectedImageToEdit] = useState<string | null>(null)

  // Clean up blob URLs when history items are removed or component unmounts
  useEffect(() => {
    return () => {
      history.forEach((item) => {
        if (item.videoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.videoUrl)
        }
      })
    }
  }, [history])

  const createLocalHistoryItem = useCallback(
    (
      item: GeneratedContent,
      historyInput?: RecordGenerationHistoryInput,
      status: GenerationHistoryItem['historyStatus'] = 'local'
    ): GenerationHistoryItem => ({
      ...item,
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      historyStatus: status,
      createdAt: new Date().toISOString(),
      transformationKey: historyInput?.transformationKey,
      transformationTitle: historyInput?.transformationTitle || item.transformationTitle,
      prompt: historyInput?.prompt || item.prompt,
      providerProfileKey: historyInput?.providerProfileKey,
      kind: historyInput?.kind || item.kind,
      inputImageUrl: historyInput?.inputs?.primaryImageUrl || null,
      referenceImageUrl: historyInput?.inputs?.referenceImageUrl || null,
      maskImageUrl: historyInput?.inputs?.maskImageUrl || null,
    }),
    []
  )

  const refreshHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    setHistoryError(null)

    try {
      const result = await listGenerationHistoryAction()
      if (!result.success) {
        setHistoryError(result.error || '获取历史记录失败')
        return
      }

      setHistory(result.data || [])
    } catch (error) {
      console.error('Failed to refresh generation history:', error)
      setHistoryError(error instanceof Error ? error.message : '获取历史记录失败')
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  const addHistoryItem = useCallback(
    (item: GeneratedContent) => {
      setHistory((prev) => [createLocalHistoryItem(item), ...prev])
    },
    [createLocalHistoryItem]
  )

  const recordHistoryItem = useCallback(
    async (item: GeneratedContent, historyInput: RecordGenerationHistoryInput) => {
      const localItem = createLocalHistoryItem(item, historyInput, 'syncing')
      setHistory((prev) => [localItem, ...prev])

      const result = await recordGenerationHistoryAction(historyInput)
      if (!result.success || !result.data) {
        setHistory((prev) =>
          prev.map((historyItem) =>
            historyItem.id === localItem.id
              ? {
                  ...historyItem,
                  historyStatus: 'sync_failed',
                  historyError: result.error || '保存历史记录失败',
                }
              : historyItem
          )
        )
        return
      }

      setHistory((prev) =>
        prev.map((historyItem) =>
          historyItem.id === localItem.id
            ? {
                ...historyItem,
                historyTaskId: result.data.taskId,
                historyStatus: 'synced',
                createdAt: result.data.createdAt || historyItem.createdAt,
              }
            : historyItem
        )
      )
    },
    [createLocalHistoryItem]
  )

  const toggleHistoryPanel = () => setIsHistoryPanelOpen((prev) => !prev)
  const closeHistoryPanel = () => setIsHistoryPanelOpen(false)

  return (
    <HistoryContext.Provider
      value={{
        history,
        addHistoryItem,
        recordHistoryItem,
        refreshHistory,
        isLoadingHistory,
        historyError,
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
