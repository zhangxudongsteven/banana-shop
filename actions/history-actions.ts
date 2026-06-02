'use server'

import { getCurrentUser, type AuthResult } from '@/lib/auth'
import {
  getHistoryAttachmentDownloadUrl,
  listGenerationHistory,
  recordGenerationHistory,
} from '@/lib/tale-history'
import type { GenerationHistoryItem, RecordGenerationHistoryInput } from '@/types'

const getAuthenticatedUserId = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser.success || !currentUser.data?.userId) {
    return { success: false as const, error: currentUser.error || '未登录' }
  }

  return { success: true as const, userId: currentUser.data.userId }
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message
  return fallback
}

export async function listGenerationHistoryAction(): Promise<AuthResult<GenerationHistoryItem[]>> {
  try {
    const user = await getAuthenticatedUserId()
    if (!user.success) return { success: false, error: user.error }

    const history = await listGenerationHistory(user.userId)
    return { success: true, data: history }
  } catch (error) {
    console.error('List generation history error:', error)
    return { success: false, error: getErrorMessage(error, '获取历史记录失败') }
  }
}

export async function recordGenerationHistoryAction(
  input: RecordGenerationHistoryInput
): Promise<AuthResult<{ taskId: string; createdAt: string }>> {
  try {
    const user = await getAuthenticatedUserId()
    if (!user.success) return { success: false, error: user.error }

    const result = await recordGenerationHistory(user.userId, input)
    return { success: true, data: result }
  } catch (error) {
    console.error('Record generation history error:', error)
    return { success: false, error: getErrorMessage(error, '保存历史记录失败') }
  }
}

export async function getHistoryAttachmentDownloadUrlAction(
  attachmentId: string,
  taskId: string
): Promise<AuthResult<string>> {
  try {
    const user = await getAuthenticatedUserId()
    if (!user.success) return { success: false, error: user.error }

    const downloadUrl = await getHistoryAttachmentDownloadUrl(attachmentId, taskId)
    return { success: true, data: downloadUrl }
  } catch (error) {
    console.error('Get history attachment download URL error:', error)
    return { success: false, error: getErrorMessage(error, '获取附件下载链接失败') }
  }
}
