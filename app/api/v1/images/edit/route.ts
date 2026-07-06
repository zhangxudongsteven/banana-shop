import { ApiAuthError, apiErrorResponse, authenticateApiRequest } from '@/lib/api-auth'
import { ApiRequestError, optionalTrimmedString, parseJsonBody } from '@/lib/api-request'
import { toUserFacingProviderError } from '@/lib/ai/providers/errors'
import { dataUrlFromBase64, recordGenerationHistorySafely } from '@/lib/generation-history-service'
import { editImage, type SecondaryImageInput } from '@/lib/generation-service'

const parseSecondaryImage = (value: unknown): SecondaryImageInput | null | undefined => {
  if (value === null) return null
  if (value === undefined) return null
  if (typeof value !== 'object') return undefined

  const image = value as Partial<SecondaryImageInput>
  if (typeof image.base64 !== 'string' || typeof image.mimeType !== 'string') {
    return undefined
  }

  return { base64: image.base64, mimeType: image.mimeType }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateApiRequest(request, 'image:edit')
    const body = await parseJsonBody(request)
    const base64ImageData =
      typeof body.base64ImageData === 'string' ? body.base64ImageData.trim() : ''
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim() : ''
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const maskBase64 =
      typeof body.maskBase64 === 'string' && body.maskBase64.trim() ? body.maskBase64.trim() : null
    const maskMimeType =
      typeof body.maskMimeType === 'string' && body.maskMimeType.trim()
        ? body.maskMimeType.trim()
        : 'image/png'
    const secondaryImage = parseSecondaryImage(body.secondaryImage)
    const transformationKey =
      typeof body.transformationKey === 'string' && body.transformationKey.trim()
        ? body.transformationKey.trim()
        : 'image-edit'
    const transformationTitle =
      typeof body.transformationTitle === 'string' && body.transformationTitle.trim()
        ? body.transformationTitle.trim()
        : transformationKey
    const profileKey = optionalTrimmedString(body.profileKey)

    if (!base64ImageData || !mimeType || !prompt || secondaryImage === undefined) {
      return apiErrorResponse(
        400,
        'base64ImageData, mimeType, prompt, and valid secondaryImage are required'
      )
    }

    const result = await editImage(
      base64ImageData,
      mimeType,
      prompt,
      maskBase64,
      secondaryImage,
      profileKey
    )
    const data = await recordGenerationHistorySafely(
      auth.userId,
      result,
      {
        transformationKey,
        transformationTitle,
        prompt,
        providerProfileKey: profileKey,
        kind: secondaryImage ? 'multi-image-edit' : 'image-edit',
        source: 'api',
        inputs: {
          primaryImageUrl: dataUrlFromBase64(mimeType, base64ImageData),
          referenceImageUrl: secondaryImage
            ? dataUrlFromBase64(secondaryImage.mimeType, secondaryImage.base64)
            : null,
          maskImageUrl: maskBase64 ? dataUrlFromBase64(maskMimeType, maskBase64) : null,
        },
        outputs: {
          imageUrl: result.imageUrl,
          text: result.text,
        },
      },
      'API image edit history sync error'
    )

    return Response.json({ success: true, data })
  } catch (error) {
    if (error instanceof ApiAuthError) return apiErrorResponse(error.status, error.message)
    if (error instanceof ApiRequestError) return apiErrorResponse(error.status, error.message)
    console.error('API image edit error:', error)
    return apiErrorResponse(500, toUserFacingProviderError(error, '图像编辑失败，请稍后重试'))
  }
}
