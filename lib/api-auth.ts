import 'server-only'

import { verifyApiKey, type ApiKeyScope } from '@/lib/api-keys'

export interface ApiAuthContext {
  userId: string
  keyId: string
  scopes: ApiKeyScope[]
}

export class ApiAuthError extends Error {
  status: 401 | 403

  constructor(status: 401 | 403, message: string) {
    super(message)
    this.name = 'ApiAuthError'
    this.status = status
  }
}

export async function authenticateApiKey(
  apiKey: string | undefined,
  requiredScope: ApiKeyScope
): Promise<ApiAuthContext> {
  const trimmedApiKey = apiKey?.trim()
  if (!trimmedApiKey) {
    throw new ApiAuthError(401, 'Missing API key')
  }

  const context = await verifyApiKey(trimmedApiKey)
  if (!context) {
    throw new ApiAuthError(401, 'Invalid API key')
  }

  if (!context.scopes.includes(requiredScope)) {
    throw new ApiAuthError(403, 'API key does not have the required scope')
  }

  return context
}

export async function authenticateApiRequest(
  request: Request,
  requiredScope: ApiKeyScope
): Promise<ApiAuthContext> {
  const authorization = request.headers.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return await authenticateApiKey(match?.[1], requiredScope)
}

export const apiErrorResponse = (status: number, error: string) =>
  Response.json({ success: false, error }, { status })
