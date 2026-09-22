import type { GenerationHistoryItem } from '@/types'

export function sameHistoryItem(a: GenerationHistoryItem, b: GenerationHistoryItem) {
  return (
    a.id === b.id ||
    Boolean(a.historyTaskId && a.historyTaskId === b.historyTaskId) ||
    Boolean(a.clientRequestId && a.clientRequestId === b.clientRequestId)
  )
}

export function mergeHistory(local: GenerationHistoryItem[], remote: GenerationHistoryItem[]) {
  const merged = local.map((item) => {
    const match = remote.find((candidate) => sameHistoryItem(item, candidate))
    if (!match) return item
    // A stale refresh must not downgrade a completed or locally failed save to "saving".
    if (
      match.historyStatus !== 'synced' &&
      (item.historyStatus === 'synced' ||
        (item.id.startsWith('local-') &&
          ['sync_failed', 'sync_unknown'].includes(item.historyStatus)))
    )
      return { ...match, ...item, historyTaskId: match.historyTaskId || item.historyTaskId }
    return {
      ...item,
      ...match,
      id: item.id,
      imageUrl: match.imageUrl || item.imageUrl,
      secondaryImageUrl: match.secondaryImageUrl || item.secondaryImageUrl,
      historyError: undefined,
    }
  })
  for (const item of remote)
    if (!merged.some((candidate) => sameHistoryItem(candidate, item))) merged.push(item)
  return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
