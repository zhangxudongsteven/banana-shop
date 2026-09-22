import type { HistoryRecovery } from '@/types'

export class HistorySaveError extends Error {
  constructor(
    message: string,
    public recovery: HistoryRecovery,
    public taskId?: string
  ) {
    super(message)
    this.name = 'HistorySaveError'
  }
}
