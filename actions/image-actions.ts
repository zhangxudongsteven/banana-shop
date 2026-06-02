'use server'

import {
  getImageEditProfile,
  getDefaultVideoGenerateProfile,
  getDefaultVisionAnalyzeProfile,
  getTextToImageProfile,
} from '@/lib/ai/providers/registry'
import { ProviderError, toUserFacingProviderError } from '@/lib/ai/providers/errors'
import type { AuthResult } from '@/lib/auth'
import type { GeneratedContent } from '@/types'

/**
 * Server Actions for image/video generation using the server-side provider registry.
 * All actions follow the AuthResult pattern for consistent error handling
 */

interface GenerateImageActionInput {
  prompt: string
  transformationKey: string
  profileKey?: string
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

/**
 * Generate image from text prompt
 */
export async function generateImageAction({
  prompt,
  transformationKey,
  profileKey,
}: GenerateImageActionInput): Promise<AuthResult<GeneratedContent>> {
  try {
    if (!prompt) {
      return { success: false, error: '提示词不能为空' }
    }
    if (!transformationKey) {
      return { success: false, error: '当前生成配置不可用，请刷新页面后重试' }
    }

    const { provider, profile } = getTextToImageProfile(profileKey || transformationKey)
    const result = await provider.generateImage({
      prompt,
      model: profile.model,
      size: profile.size,
    })
    const imageUrl = await normalizeImageUrl(result.imageUrl, result.mimeType)

    return {
      success: true,
      data: { imageUrl, text: null },
    }
  } catch (error) {
    console.error('Generate image error:', error)
    return {
      success: false,
      error: toUserFacingProviderError(error, '图像生成失败，请稍后重试'),
    }
  }
}

/**
 * Analyze image with vision understanding
 * Supports single and dual image analysis
 */
export async function analyzeImageAction(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  secondaryImage?: { base64: string; mimeType: string }
): Promise<AuthResult<GeneratedContent>> {
  try {
    if (!base64ImageData || !prompt) {
      return { success: false, error: '参数不完整' }
    }

    const { provider, profile } = getDefaultVisionAnalyzeProfile()
    const result = await provider.analyzeImage({
      base64Image: base64ImageData,
      mimeType,
      prompt,
      model: profile.model,
      secondaryImage,
    })

    return {
      success: true,
      data: { imageUrl: null, text: result.text },
    }
  } catch (error) {
    console.error('Analyze image error:', error)
    return {
      success: false,
      error: toUserFacingProviderError(error, '图像分析失败，请稍后重试'),
    }
  }
}

/**
 * Edit image with instruction-based editing (SeedEdit)
 * Note: Mask-based editing is deprecated. Multi-image inputs are handled via enhanced prompts.
 */
export async function editImageAction(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64: string | null,
  secondaryImage?: { base64: string; mimeType: string } | null,
  profileKey = 'defaultImageEdit'
): Promise<AuthResult<GeneratedContent>> {
  try {
    if (!base64ImageData || !prompt) {
      return { success: false, error: '参数不完整' }
    }

    const { provider: editProvider, profile: editProfile } = getImageEditProfile(profileKey)
    const { provider: analyzeProvider, profile: analyzeProfile } = getDefaultVisionAnalyzeProfile()

    const referenceImages =
      secondaryImage && editProvider.capabilities.referenceImages ? [secondaryImage] : undefined

    // Fallback strategy: when the edit provider cannot consume a second reference image
    // directly, analyze the secondary image and fold the description into the prompt.
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

    // Mask editing is not available for the current provider, so keep the previous
    // instruction-based fallback without claiming precise local mask support.
    if (maskBase64 && !editProvider.capabilities.maskEdit) {
      console.warn(
        'Mask editing is unsupported by the selected provider. Using instruction-based editing fallback.'
      )
      enhancedPrompt = `${prompt} Focus on transforming the main subject while preserving the overall composition.`
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

    return {
      success: true,
      data: { imageUrl, text: null },
    }
  } catch (error) {
    console.error('Edit image error:', error)
    return {
      success: false,
      error: toUserFacingProviderError(error, '图像编辑失败，请稍后重试'),
    }
  }
}

/**
 * Generate video from text prompt
 */
export async function generateVideoAction(
  prompt: string,
  aspectRatio?: '16:9' | '9:16'
): Promise<AuthResult<GeneratedContent & { videoUrl: string }>> {
  try {
    if (!prompt) {
      return { success: false, error: '提示词不能为空' }
    }

    const { provider, profile } = getDefaultVideoGenerateProfile()
    const result = await provider.generateVideo({
      prompt,
      model: profile.model,
      aspectRatio,
    })

    return {
      success: true,
      data: { videoUrl: result.videoUrl, imageUrl: null, text: null },
    }
  } catch (error) {
    console.error('Generate video error:', error)
    return {
      success: false,
      error: toUserFacingProviderError(error, '视频生成失败，请稍后重试'),
    }
  }
}
