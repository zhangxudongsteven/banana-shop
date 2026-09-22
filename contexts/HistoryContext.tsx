'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import {
  listGenerationHistoryAction,
  recordGenerationHistoryAction,
} from '@/actions/history-actions'
import { mergeHistory } from '@/lib/history-state'
import type { GeneratedContent, GenerationHistoryItem, RecordGenerationHistoryInput } from '@/types'

interface HistoryContextType {
  history: GenerationHistoryItem[]
  recordHistoryItem: (item: GeneratedContent, input: RecordGenerationHistoryInput) => Promise<void>
  retryHistoryItem: (id: string) => Promise<void>
  canRetryHistoryItem: (id: string) => boolean
  refreshHistory: () => Promise<void>
  isLoadingHistory: boolean
  historyError: string | null
  isHistoryPanelOpen: boolean
  toggleHistoryPanel: () => void
  closeHistoryPanel: () => void
  pendingImageInput: string | null
  setPendingImageInput: React.Dispatch<React.SetStateAction<string | null>>
  isGenerating: boolean
  setIsGenerating: (value: boolean) => void
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false)
  const [pendingImageInput, setPendingImageInput] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const pending = useRef(new Map<string, RecordGenerationHistoryInput>())
  const active = useRef(new Set<string>())
  const refreshing = useRef(false)
  const hasUnsaved = history.some(
    (item) => item.historyStatus !== 'synced' && pending.current.has(item.id)
  )

  useEffect(() => {
    if (!hasUnsaved) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsaved])

  const save = useCallback(async (id: string) => {
    const input = pending.current.get(id)
    if (!input || active.current.has(id)) return
    active.current.add(id)
    setHistory((items) =>
      items.map((item) =>
        item.id === id ? { ...item, historyStatus: 'syncing', historyError: undefined } : item
      )
    )
    try {
      const result = await recordGenerationHistoryAction(input)
      const current = pending.current.get(id)
      if (!current) return // A concurrent refresh already confirmed completion.
      if (result.success && result.data) {
        pending.current.delete(id)
        const { taskId, createdAt } = result.data
        setHistory((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  historyTaskId: taskId,
                  historyStatus: 'synced',
                  historyError: undefined,
                  createdAt,
                }
              : item
          )
        )
      } else {
        // Refresh may have discovered the task while this request was in flight.
        const taskId = result.taskId || current.historyTaskId
        const recovery = taskId ? 'resume' : result.recovery || current.recovery || 'retry'
        pending.current.set(id, { ...current, historyTaskId: taskId, recovery })
        setHistory((items) =>
          items.map((item) =>
            item.id === id && item.historyStatus !== 'synced'
              ? {
                  ...item,
                  historyTaskId: taskId || item.historyTaskId,
                  historyStatus: recovery === 'reconcile' ? 'sync_unknown' : 'sync_failed',
                  historyError: result.error || '保存历史记录失败，请先下载图片',
                }
              : item
          )
        )
      }
    } catch {
      const current = pending.current.get(id)
      if (!current) return
      // A transport failure does not prove the remote save failed.
      pending.current.set(id, {
        ...current,
        recovery: current.historyTaskId ? 'resume' : 'reconcile',
      })
      setHistory((items) =>
        items.map((item) =>
          item.id === id && item.historyStatus !== 'synced'
            ? {
                ...item,
                historyStatus: 'sync_unknown',
                historyError: '保存状态待确认，请检查网络后重试；请先下载图片',
              }
            : item
        )
      )
    } finally {
      active.current.delete(id)
    }
  }, [])

  const recordHistoryItem = useCallback(
    async (item: GeneratedContent, input: RecordGenerationHistoryInput) => {
      const clientRequestId = crypto.randomUUID()
      const id = `local-${clientRequestId}`
      pending.current.set(id, { ...input, clientRequestId })
      setHistory((items) => [
        {
          ...item,
          id,
          clientRequestId,
          historyStatus: 'syncing',
          createdAt: new Date().toISOString(),
          transformationKey: input.transformationKey,
          transformationTitle: input.transformationTitle,
          prompt: input.prompt,
          providerProfileKey: input.providerProfileKey,
          kind: input.kind,
          source: input.source,
          inputImageUrl: input.inputs?.primaryImageUrl,
          referenceImageUrl: input.inputs?.referenceImageUrl,
          maskImageUrl: input.inputs?.maskImageUrl,
        },
        ...items,
      ])
      await save(id)
    },
    [save]
  )

  const refreshHistory = useCallback(async () => {
    if (refreshing.current) return
    refreshing.current = true
    setIsLoadingHistory(true)
    setHistoryError(null)
    try {
      const result = await listGenerationHistoryAction()
      if (!result.success) {
        setHistoryError(result.error || '获取历史记录失败')
        return
      }
      const remote = result.data || []
      for (const [id, input] of pending.current) {
        const match = remote.find(
          (item) =>
            item.clientRequestId === input.clientRequestId ||
            Boolean(input.historyTaskId && item.historyTaskId === input.historyTaskId)
        )
        if (match?.historyStatus === 'synced') pending.current.delete(id)
        else if (match?.historyTaskId)
          pending.current.set(id, {
            ...input,
            historyTaskId: match.historyTaskId,
            recovery: 'resume',
          })
      }
      setHistory((items) => mergeHistory(items, remote))
    } catch {
      setHistoryError('获取历史记录失败，请重试')
    } finally {
      refreshing.current = false
      setIsLoadingHistory(false)
    }
  }, [])

  const toggleHistoryPanel = useCallback(() => setIsHistoryPanelOpen((open) => !open), [])
  const closeHistoryPanel = useCallback(() => setIsHistoryPanelOpen(false), [])
  const canRetryHistoryItem = useCallback(
    (id: string) => pending.current.has(id) && !active.current.has(id),
    []
  )

  return (
    <HistoryContext.Provider
      value={{
        history,
        recordHistoryItem,
        retryHistoryItem: save,
        canRetryHistoryItem,
        refreshHistory,
        isLoadingHistory,
        historyError,
        isHistoryPanelOpen,
        toggleHistoryPanel,
        closeHistoryPanel,
        pendingImageInput,
        setPendingImageInput,
        isGenerating,
        setIsGenerating,
      }}
    >
      {children}
    </HistoryContext.Provider>
  )
}

export const useHistory = () => {
  const context = useContext(HistoryContext)
  if (!context) throw new Error('useHistory must be used within a HistoryProvider')
  return context
}
