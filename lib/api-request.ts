import 'server-only'

export class ApiRequestError extends Error {
  status: 400

  constructor(message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = 400
  }
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiRequestError('Invalid JSON body')
    }

    return body as Record<string, unknown>
  } catch (error) {
    if (error instanceof ApiRequestError) throw error
    throw new ApiRequestError('Invalid JSON body')
  }
}

export const optionalTrimmedString = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}
