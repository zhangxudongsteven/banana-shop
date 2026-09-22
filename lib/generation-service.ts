import 'server-only'

import {
  getDefaultVisionAnalyzeProfile,
  getImageEditProfile,
  getTextToImageProfile,
} from '@/lib/ai/providers/registry'
import { ProviderError } from '@/lib/ai/providers/errors'
import type { GeneratedContent } from '@/types'

export interface GenerateImageInput {
  prompt: string
  transformationKey: string
  profileKey?: string
}

export interface SecondaryImageInput {
  base64: string
  mimeType: string
}

async function normalizeImageUrl(imageUrl: string, fallbackMimeType = 'image/png') {
  if (imageUrl.startsWith('data:')) return imageUrl

  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new ProviderError(
      'PROVIDER_REQUEST_FAILED',
      `Failed to fetch generated image: ${response.statusText}`
    )
  }

  const contentType = response.headers.get('content-type') || fallbackMimeType
  const base64 = Buffer.from(await response.arrayBuffer()).toString('base64')
  return `data:${contentType};base64,${base64}`
}

export async function generateImage(input: GenerateImageInput): Promise<GeneratedContent> {
  const { provider, profile } = getTextToImageProfile(input.profileKey || input.transformationKey)
  const result = await provider.generateImage({
    prompt: input.prompt,
    model: profile.model,
    size: profile.size,
  })
  const imageUrl = await normalizeImageUrl(result.imageUrl, result.mimeType)

  return { imageUrl, text: null }
}

export async function analyzeImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  secondaryImage?: SecondaryImageInput
): Promise<GeneratedContent> {
  const { provider, profile } = getDefaultVisionAnalyzeProfile()
  const result = await provider.analyzeImage({
    base64Image: base64ImageData,
    mimeType,
    prompt,
    model: profile.model,
    secondaryImage,
  })

  return { imageUrl: null, text: result.text }
}

export async function editImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64: string | null,
  secondaryImage?: SecondaryImageInput | null,
  profileKey = 'defaultImageEdit'
): Promise<GeneratedContent> {
  if (maskBase64?.trim()) {
    throw new ProviderError('MASK_UNSUPPORTED', '不支持局部选区编辑')
  }
  const { provider: editProvider, profile: editProfile } = getImageEditProfile(profileKey)
  const { provider: analyzeProvider, profile: analyzeProfile } = getDefaultVisionAnalyzeProfile()

  const referenceImages =
    secondaryImage && editProvider.capabilities.referenceImages ? [secondaryImage] : undefined

  let enhancedPrompt = prompt
  if (secondaryImage && !referenceImages && analyzeProvider.capabilities.visionAnalyze) {
    const analysisResult = await analyzeProvider.analyzeImage({
      base64Image: secondaryImage.base64,
      mimeType: secondaryImage.mimeType,
      prompt:
        'Analyze this image and describe its style, colors, composition, and key visual elements. Focus on details that would be important for applying the same style to another image.',
      model: analyzeProfile.model,
    })

    if (analysisResult.text) {
      enhancedPrompt = `${prompt}\n\nReference style to apply: ${analysisResult.text}`
    }
  }

  const result = await editProvider.editImage({
    base64Image: base64ImageData,
    mimeType,
    instruction: enhancedPrompt,
    model: editProfile.model,
    referenceImages,
    size: editProfile.size,
  })
  const imageUrl = await normalizeImageUrl(result.imageUrl, result.mimeType)

  return { imageUrl, text: null }
}
