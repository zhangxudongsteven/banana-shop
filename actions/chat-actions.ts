'use server'

import { toUserFacingProviderError } from '@/lib/ai/providers/errors'
import { getDefaultChatProfile } from '@/lib/ai/providers/registry'
import type { ChatMessage } from '@/lib/ai/providers/types'
import type { AuthResult } from '@/lib/auth'

export async function generateChatAction(
  messages: ChatMessage[]
): Promise<AuthResult<{ text: string }>> {
  try {
    if (!messages.length) {
      return { success: false, error: '消息不能为空' }
    }

    const { provider, profile } = getDefaultChatProfile()
    const result = await provider.generateChat({
      messages,
      model: profile.model,
    })

    return { success: true, data: { text: result.text } }
  } catch (error) {
    console.error('Generate chat error:', error)
    return {
      success: false,
      error: toUserFacingProviderError(error, '对话生成失败，请稍后重试'),
    }
  }
}
