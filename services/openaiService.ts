import type { GeneratedContent } from '../types'

export async function editImage(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64: string | null,
  secondaryImage: { base64: string; mimeType: string } | null
): Promise<GeneratedContent> {
  try {
    const response = await fetch('/api/edit-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64ImageData,
        mimeType,
        prompt,
        maskBase64,
        secondaryImage,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Server error: ${response.statusText}`)
    }

    const data = await response.json()
    return data as GeneratedContent
  } catch (error) {
    console.error('Error calling backend API:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('An unknown error occurred while communicating with the backend.')
  }
}

export async function generateVideo(
  prompt: string,
  image: { base64: string; mimeType: string } | null,
  aspectRatio: '16:9' | '9:16',
  onProgress: (message: string) => void
): Promise<string> {
  // OpenAI does not currently offer a public Video Generation API (Sora) comparable to Google's Veo/Imagen Video
  // in the standard SDK as of early 2025 (or at least not without special access).
  // For now, we will throw a clear error.

  onProgress('Video generation is not supported by the OpenAI service yet.')
  throw new Error('OpenAI video generation is currently not available.')
}
