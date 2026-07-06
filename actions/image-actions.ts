'use server'

import { toUserFacingProviderError } from '@/lib/ai/providers/errors'
import {
  analyzeImage,
  editImage,
  generateImage,
  generateVideo,
} from '@/lib/generation-service'
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

    const result = await generateImage({
      prompt,
      transformationKey,
      profileKey,
    })

    return {
      success: true,
      data: result,
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

    const result = await analyzeImage(
      base64ImageData,
      mimeType,
      prompt,
      secondaryImage
    )

    return {
      success: true,
      data: result,
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

    const result = await editImage(
      base64ImageData,
      mimeType,
      prompt,
      maskBase64,
      secondaryImage,
      profileKey
    )

    return {
      success: true,
      data: result,
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

    const result = await generateVideo(prompt, aspectRatio)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Generate video error:', error)
    return {
      success: false,
      error: toUserFacingProviderError(error, '视频生成失败，请稍后重试'),
    }
  }
}
