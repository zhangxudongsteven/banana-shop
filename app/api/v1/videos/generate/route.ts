import { ApiAuthError, apiErrorResponse, authenticateApiRequest } from '@/lib/api-auth'
import { ApiRequestError, parseJsonBody } from '@/lib/api-request'
import { toUserFacingProviderError } from '@/lib/ai/providers/errors'
import { recordGenerationHistorySafely } from '@/lib/generation-history-service'
import { generateVideo } from '@/lib/generation-service'

const parseAspectRatio = (value: unknown) =>
  value === '16:9' || value === '9:16' ? value : undefined

export async function POST(request: Request) {
  try {
    const auth = await authenticateApiRequest(request, 'video:generate')
    const body = await parseJsonBody(request)
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const aspectRatio = parseAspectRatio(body.aspectRatio)
    const transformationKey =
      typeof body.transformationKey === 'string' && body.transformationKey.trim()
        ? body.transformationKey.trim()
        : 'text-to-video'
    const transformationTitle =
      typeof body.transformationTitle === 'string' && body.transformationTitle.trim()
        ? body.transformationTitle.trim()
        : transformationKey

    if (!prompt) {
      return apiErrorResponse(400, 'prompt is required')
    }

    const result = await generateVideo(prompt, aspectRatio)
    const data = await recordGenerationHistorySafely(
      auth.userId,
      result,
      {
        transformationKey,
        transformationTitle,
        prompt,
        kind: 'video',
        source: 'api',
        inputs: {
          aspectRatio,
        },
        outputs: {
          videoUrl: result.videoUrl,
          text: result.text,
        },
      },
      'API video generate history sync error'
    )

    return Response.json({ success: true, data })
  } catch (error) {
    if (error instanceof ApiAuthError) return apiErrorResponse(error.status, error.message)
    if (error instanceof ApiRequestError) return apiErrorResponse(error.status, error.message)
    console.error('API video generate error:', error)
    return apiErrorResponse(500, toUserFacingProviderError(error, '视频生成失败，请稍后重试'))
  }
}
