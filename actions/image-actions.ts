'use server'

import {
  generateImage as volcengineGenerateImage,
  analyzeImage,
  editImageWithInstruction,
  generateVideo,
} from '@/lib/volcengine'
import type { AuthResult } from '@/lib/auth'
import type { GeneratedContent } from '@/types'

/**
 * Server Actions for image/video generation using Volcengine Ark API
 * All actions follow the AuthResult pattern for consistent error handling
 */

/**
 * Generate image from text prompt
 */
export async function generateImageAction(
  prompt: string,
  model?: string
): Promise<AuthResult<GeneratedContent>> {
  try {
    if (!prompt) {
      return { success: false, error: '提示词不能为空' }
    }

    const result = await volcengineGenerateImage(prompt, { model })

    return {
      success: true,
      data: { imageUrl: result.imageUrl, text: null },
    }
  } catch (error) {
    console.error('Generate image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '图像生成失败，请稍后重试',
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

    const result = await analyzeImage(base64ImageData, mimeType, prompt, secondaryImage)

    return {
      success: true,
      data: { imageUrl: null, text: result.text },
    }
  } catch (error) {
    console.error('Analyze image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '图像分析失败，请稍后重试',
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
  secondaryImage?: { base64: string; mimeType: string } | null
): Promise<AuthResult<GeneratedContent>> {
  try {
    if (!base64ImageData || !prompt) {
      return { success: false, error: '参数不完整' }
    }

    // Handle multi-image scenario: enhance prompt with vision analysis
    let enhancedPrompt = prompt
    if (secondaryImage) {
      // Use vision analysis to understand the secondary image and enhance the prompt
      const analysisResult = await analyzeImage(
        secondaryImage.base64,
        secondaryImage.mimeType,
        `Analyze this image and describe its style, colors, composition, and key visual elements. Focus on details that would be important for applying the same style to another image.`
      )

      if (analysisResult.text) {
        enhancedPrompt = `${prompt}\n\nReference style to apply: ${analysisResult.text}`
      }
    }

    // Handle mask scenario: add instruction to focus on masked area
    if (maskBase64) {
      console.warn(
        'Mask-based editing is deprecated with Volcengine. Using instruction-based editing instead.'
      )
      enhancedPrompt = `${prompt} Focus on transforming the main subject while preserving the overall composition.`
    }

    // Use SeedEdit for instruction-based editing
    const result = await editImageWithInstruction(base64ImageData, mimeType, enhancedPrompt)

    return {
      success: true,
      data: { imageUrl: result.imageUrl, text: null },
    }
  } catch (error) {
    console.error('Edit image error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '图像编辑失败，请稍后重试',
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

    const result = await generateVideo(prompt, { aspectRatio })

    return {
      success: true,
      data: { videoUrl: result.videoUrl, imageUrl: null, text: null },
    }
  } catch (error) {
    console.error('Generate video error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '视频生成失败，请稍后重试',
    }
  }
}
