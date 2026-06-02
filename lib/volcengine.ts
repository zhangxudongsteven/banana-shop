import {
  getDefaultImageEditProfile,
  getDefaultVideoGenerateProfile,
  getDefaultVisionAnalyzeProfile,
  getGenerationProfile,
} from './ai/providers/registry'

/**
 * Convert a remote URL to base64 data URL.
 * Kept here for compatibility with any callers that still import from lib/volcengine.
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }
  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function generateImage(
  prompt: string,
  options?: { size?: string; profileKey?: string }
): Promise<{ imageUrl: string }> {
  const { provider, profile } = getGenerationProfile(options?.profileKey || 'defaultTextToImage')
  const result = await provider.generateImage({
    prompt,
    model: profile.model,
    size: options?.size || profile.size,
  })

  return { imageUrl: result.imageUrl }
}

export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  prompt: string,
  secondaryImage?: { base64: string; mimeType: string }
): Promise<{ text: string }> {
  const { provider, profile } = getDefaultVisionAnalyzeProfile()
  return provider.analyzeImage({
    base64Image,
    mimeType,
    prompt,
    model: profile.model,
    secondaryImage,
  })
}

export async function editImageWithInstruction(
  base64Image: string,
  mimeType: string,
  instruction: string
): Promise<{ imageUrl: string }> {
  const { provider, profile } = getDefaultImageEditProfile()
  const result = await provider.editImage({
    base64Image,
    mimeType,
    instruction,
    model: profile.model,
  })

  return { imageUrl: result.imageUrl }
}

export async function generateVideo(
  prompt: string,
  options?: { aspectRatio?: '16:9' | '9:16' }
): Promise<{ videoUrl: string }> {
  const { provider, profile } = getDefaultVideoGenerateProfile()
  return provider.generateVideo({
    prompt,
    model: profile.model,
    aspectRatio: options?.aspectRatio,
  })
}
