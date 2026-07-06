'use server'

import { createApiKey, listApiKeys, revokeApiKey, type PublicApiKey } from '@/lib/api-keys'
import { getCurrentUser, type AuthResult } from '@/lib/auth'

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

export async function listApiKeysAction(): Promise<AuthResult<PublicApiKey[]>> {
  try {
    const user = await getAuthenticatedUserId()
    if (!user.success) return { success: false, error: user.error }

    const keys = await listApiKeys(user.userId)
    return { success: true, data: keys }
  } catch (error) {
    console.error('List API keys error:', error)
    return { success: false, error: getErrorMessage(error, '获取 API Key 失败') }
  }
}

export async function createApiKeyAction(input: {
  name: string
}): Promise<AuthResult<{ key: string; item: PublicApiKey }>> {
  try {
    const user = await getAuthenticatedUserId()
    if (!user.success) return { success: false, error: user.error }

    const result = await createApiKey(user.userId, input.name)
    return { success: true, data: result }
  } catch (error) {
    console.error('Create API key error:', error)
    return { success: false, error: getErrorMessage(error, '创建 API Key 失败') }
  }
}

export async function revokeApiKeyAction(input: {
  kid: string
}): Promise<AuthResult<PublicApiKey>> {
  try {
    const user = await getAuthenticatedUserId()
    if (!user.success) return { success: false, error: user.error }

    const result = await revokeApiKey(user.userId, input.kid)
    return { success: true, data: result }
  } catch (error) {
    console.error('Revoke API key error:', error)
    return { success: false, error: getErrorMessage(error, '撤销 API Key 失败') }
  }
}
