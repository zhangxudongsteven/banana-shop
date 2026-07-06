import { ApiAuthError, apiErrorResponse, authenticateApiRequest } from '@/lib/api-auth'
import { ApiRequestError, optionalTrimmedString, parseJsonBody } from '@/lib/api-request'
import { toUserFacingProviderError } from '@/lib/ai/providers/errors'
import { recordGenerationHistorySafely } from '@/lib/generation-history-service'
import { generateImage } from '@/lib/generation-service'

export async function POST(request: Request) {
  try {
    const auth = await authenticateApiRequest(request, 'image:generate')
    const body = await parseJsonBody(request)
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const transformationKey =
      typeof body.transformationKey === 'string' ? body.transformationKey.trim() : ''
    const transformationTitle =
      typeof body.transformationTitle === 'string' && body.transformationTitle.trim()
        ? body.transformationTitle.trim()
        : transformationKey
    const profileKey = optionalTrimmedString(body.profileKey)

    if (!prompt || !transformationKey) {
      return apiErrorResponse(400, 'prompt and transformationKey are required')
    }

    const result = await generateImage({ prompt, transformationKey, profileKey })
    const data = await recordGenerationHistorySafely(
      auth.userId,
      result,
      {
        transformationKey,
        transformationTitle,
        prompt,
        providerProfileKey: profileKey,
        kind: 'text-to-image',
        source: 'api',
        outputs: {
          imageUrl: result.imageUrl,
          text: result.text,
        },
      },
      'API image generate history sync error'
    )

    return Response.json({ success: true, data })
  } catch (error) {
    if (error instanceof ApiAuthError) return apiErrorResponse(error.status, error.message)
    if (error instanceof ApiRequestError) return apiErrorResponse(error.status, error.message)
    console.error('API image generate error:', error)
    return apiErrorResponse(500, toUserFacingProviderError(error, '图像生成失败，请稍后重试'))
  }
}
