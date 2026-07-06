import { ApiAuthError, apiErrorResponse, authenticateApiRequest } from '@/lib/api-auth'
import { listGenerationHistory } from '@/lib/tale-history'

export async function GET(request: Request) {
  try {
    const auth = await authenticateApiRequest(request, 'history:read')
    const data = await listGenerationHistory(auth.userId)
    return Response.json({ success: true, data })
  } catch (error) {
    if (error instanceof ApiAuthError) return apiErrorResponse(error.status, error.message)
    console.error('API history error:', error)
    return apiErrorResponse(500, '获取历史记录失败')
  }
}
