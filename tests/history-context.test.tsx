import React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
const actions = vi.hoisted(() => ({
  listGenerationHistoryAction: vi.fn(),
  recordGenerationHistoryAction: vi.fn(),
}))
vi.mock('@/actions/history-actions', () => actions)
import { HistoryProvider, useHistory } from '@/contexts/HistoryContext'
import type { HistorySaveResult, RecordGenerationHistoryInput } from '@/types'
const input: RecordGenerationHistoryInput = {
  transformationKey: 'customPrompt',
  transformationTitle: 'Edit',
  prompt: 'edit',
  kind: 'image-edit',
  source: 'dashboard',
  outputs: { imageUrl: 'data:image/png;base64,abc' },
}
const content = { imageUrl: 'data:image/png;base64,abc', text: null }
beforeEach(() => {
  vi.clearAllMocks()
  actions.listGenerationHistoryAction.mockResolvedValue({ success: true, data: [] })
})
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HistoryProvider>{children}</HistoryProvider>
)
it('retains pending and failed results through refresh; retries only once', async () => {
  let resolve!: (value: HistorySaveResult) => void
  actions.recordGenerationHistoryAction.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  const { result } = renderHook(useHistory, { wrapper })
  let saving!: Promise<void>
  act(() => {
    saving = result.current.recordHistoryItem(content, input)
  })
  await act(() => result.current.refreshHistory())
  expect(result.current.history).toHaveLength(1)
  expect(result.current.history[0].historyStatus).toBe('syncing')
  await act(async () => {
    resolve({ success: false, recovery: 'resume', taskId: 'task-1' })
    await saving
  })
  await act(() => result.current.refreshHistory())
  const id = result.current.history[0].id
  expect(result.current.history[0]).toMatchObject({
    historyStatus: 'sync_failed',
    imageUrl: content.imageUrl,
  })
  actions.recordGenerationHistoryAction.mockResolvedValue({
    success: true,
    data: { taskId: 'task-1', createdAt: '2026-09-22T00:00:00Z' },
  })
  await act(async () => {
    await Promise.all([result.current.retryHistoryItem(id), result.current.retryHistoryItem(id)])
  })
  expect(actions.recordGenerationHistoryAction).toHaveBeenCalledTimes(2)
  expect(actions.recordGenerationHistoryAction.mock.calls[1][0]).toMatchObject({
    historyTaskId: 'task-1',
    recovery: 'resume',
  })
  expect(result.current.history[0].historyStatus).toBe('synced')
  expect(result.current.canRetryHistoryItem(id)).toBe(false)
})
it('marks transport errors uncertain and never blindly creates on retry', async () => {
  actions.recordGenerationHistoryAction.mockRejectedValueOnce(new Error('network'))
  const { result } = renderHook(useHistory, { wrapper })
  await act(() => result.current.recordHistoryItem(content, input))
  expect(result.current.history[0].historyStatus).toBe('sync_unknown')
  actions.recordGenerationHistoryAction.mockResolvedValue({ success: false, recovery: 'reconcile' })
  await act(() => result.current.retryHistoryItem(result.current.history[0].id))
  expect(actions.recordGenerationHistoryAction.mock.calls[1][0].recovery).toBe('reconcile')
})
it('merges a refresh during save completion without duplicates or status regression', async () => {
  let resolve!: (value: HistorySaveResult) => void
  actions.recordGenerationHistoryAction.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  const { result } = renderHook(useHistory, { wrapper })
  let saving!: Promise<void>
  act(() => {
    saving = result.current.recordHistoryItem(content, input)
  })
  const local = result.current.history[0]
  actions.listGenerationHistoryAction.mockResolvedValue({
    success: true,
    data: [{ ...local, id: 'task-1', historyTaskId: 'task-1', historyStatus: 'synced' }],
  })
  await act(() => result.current.refreshHistory())
  await act(async () => {
    resolve({ success: false, recovery: 'resume', taskId: 'task-1' })
    await saving
  })
  await waitFor(() => expect(result.current.history).toHaveLength(1))
  expect(result.current.history[0]).toMatchObject({ id: local.id, historyStatus: 'synced' })
})

it('updates remote running tasks to failed without downgrading a confirmed local save', async () => {
  const { mergeHistory } = await import('@/lib/history-state')
  const item = {
    ...content,
    id: 'remote-1',
    historyTaskId: 'remote-1',
    historyStatus: 'syncing' as const,
    createdAt: '2026-09-22T00:00:00Z',
  }
  expect(mergeHistory([item], [{ ...item, historyStatus: 'sync_failed' }])[0].historyStatus).toBe(
    'sync_failed'
  )
  expect(
    mergeHistory([{ ...item, id: 'local-1', historyStatus: 'synced' }], [item])[0].historyStatus
  ).toBe('synced')
})

it.each(['response', 'transport'])(
  'keeps a task discovered by refresh after a %s failure',
  async (failure) => {
    let resolve!: (value: HistorySaveResult) => void
    let reject!: (error: Error) => void
    actions.recordGenerationHistoryAction.mockImplementationOnce(
      () =>
        new Promise((done, fail) => {
          resolve = done
          reject = fail
        })
    )
    const { result } = renderHook(useHistory, { wrapper })
    let saving!: Promise<void>
    act(() => {
      saving = result.current.recordHistoryItem(content, input)
    })
    const local = result.current.history[0]
    actions.listGenerationHistoryAction.mockResolvedValue({
      success: true,
      data: [
        {
          ...local,
          id: 'discovered-task',
          historyTaskId: 'discovered-task',
          historyStatus: 'syncing',
        },
      ],
    })
    await act(() => result.current.refreshHistory())
    await act(async () => {
      if (failure === 'transport') reject(new Error('network'))
      else resolve({ success: false, recovery: 'reconcile' })
      await saving
    })
    expect(result.current.canRetryHistoryItem(local.id)).toBe(true)
    actions.recordGenerationHistoryAction.mockResolvedValue({
      success: true,
      data: { taskId: 'discovered-task', createdAt: '2026-09-22T00:00:00Z' },
    })
    await act(() => result.current.retryHistoryItem(local.id))
    expect(actions.recordGenerationHistoryAction.mock.calls[1][0]).toMatchObject({
      historyTaskId: 'discovered-task',
      clientRequestId: local.clientRequestId,
      recovery: 'resume',
    })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].historyStatus).toBe('synced')
  }
)
