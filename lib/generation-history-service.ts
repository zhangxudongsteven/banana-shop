import 'server-only'

import { recordGenerationHistory } from '@/lib/tale-history'
import type { GeneratedContent, RecordGenerationHistoryInput } from '@/types'

export const dataUrlFromBase64 = (mimeType: string, base64: string) =>
  `data:${mimeType};base64,${base64}`

export async function recordGenerationHistorySafely<T extends GeneratedContent>(
  userId: string,
  result: T,
  input: RecordGenerationHistoryInput,
  logPrefix = 'Generation history sync error'
): Promise<T> {
  try {
    const history = await recordGenerationHistory(userId, input)
    return {
      ...result,
      historyTaskId: history.taskId,
      historyStatus: 'synced',
      createdAt: history.createdAt,
      transformationTitle: input.transformationTitle,
      prompt: input.prompt,
      kind: input.kind,
      source: input.source,
    }
  } catch (error) {
    console.error(`${logPrefix}:`, error)
    return {
      ...result,
      historyStatus: 'sync_failed',
      historyError: '历史记录同步失败',
      transformationTitle: input.transformationTitle,
      prompt: input.prompt,
      kind: input.kind,
      source: input.source,
    }
  }
}
