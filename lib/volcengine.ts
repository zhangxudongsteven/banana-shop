import OpenAI from 'openai'

// Volcengine Ark API Configuration
const VOLCENGINE_CONFIG = {
  baseURL: process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.VOLCENGINE_API_KEY || '',
  defaultImageModel: process.env.VOLCENGINE_IMAGE_MODEL || 'doubao-seed-2-0-lite-260215',
  defaultChatModel: process.env.VOLCENGINE_CHAT_MODEL || 'doubao-seed-2-0-lite-260215',
  defaultVideoModel: process.env.VOLCENGINE_VIDEO_MODEL || 'doubao-video-1',
  defaultEditModel: process.env.VOLCENGINE_EDIT_MODEL || 'doubao-seededit-3-0',
}

// Create OpenAI client (pointing to Volcengine Ark)
const client = new OpenAI({
  baseURL: VOLCENGINE_CONFIG.baseURL,
  apiKey: VOLCENGINE_CONFIG.apiKey,
})

/**
 * Convert a remote URL to base64 data URL
 * Used client-side to convert Volcengine URLs for watermarking and multi-step processing
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

/**
 * Generate image from text prompt
 * Returns base64 data URL for compatibility with watermarking and multi-step flows
 */
export async function generateImage(
  prompt: string,
  options?: { size?: string; model?: string }
): Promise<{ imageUrl: string }> {
  if (!VOLCENGINE_CONFIG.apiKey) {
    throw new Error('VOLCENGINE_API_KEY is not configured')
  }

  const response = await client.images.generate({
    model: options?.model || VOLCENGINE_CONFIG.defaultImageModel,
    prompt,
    size: (options?.size || '1024x1024') as any,
    response_format: 'b64_json',
  })

  const b64Json = response.data[0].b64_json
  if (!b64Json) {
    throw new Error('Failed to generate image: No base64 data in response')
  }

  return { imageUrl: `data:image/png;base64,${b64Json}` }
}

/**
 * Analyze image with vision understanding
 * Supports single image or dual image analysis
 */
export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  prompt: string,
  secondaryImage?: { base64: string; mimeType: string }
): Promise<{ text: string }> {
  if (!VOLCENGINE_CONFIG.apiKey) {
    throw new Error('VOLCENGINE_API_KEY is not configured')
  }

  const content: any[] = [
    { type: 'text', text: prompt },
    {
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${base64Image}` },
    },
  ]

  if (secondaryImage) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${secondaryImage.mimeType};base64,${secondaryImage.base64}`,
      },
    })
  }

  const response = await client.chat.completions.create({
    model: VOLCENGINE_CONFIG.defaultChatModel,
    messages: [{ role: 'user', content }],
  })

  const text = response.choices[0].message.content || ''
  return { text }
}

/**
 * Edit image with instruction-based editing (SeedEdit)
 * This replaces the mask-based editing from OpenAI DALL-E 2
 * Returns base64 data URL for compatibility with watermarking and multi-step flows
 */
export async function editImageWithInstruction(
  base64Image: string,
  mimeType: string,
  instruction: string
): Promise<{ imageUrl: string }> {
  if (!VOLCENGINE_CONFIG.apiKey) {
    throw new Error('VOLCENGINE_API_KEY is not configured')
  }

  // Use Volcengine's SeedEdit API for instruction-based image editing
  const response = await fetch(`${VOLCENGINE_CONFIG.baseURL}/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VOLCENGINE_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VOLCENGINE_CONFIG.defaultEditModel,
      image: `data:${mimeType};base64,${base64Image}`,
      prompt: instruction,
      response_format: 'b64_json',
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Volcengine SeedEdit API Error:', errorData)
    throw new Error(`Failed to edit image: ${response.statusText}`)
  }

  const data = await response.json()
  const b64Json = data.data?.[0]?.b64_json

  if (!b64Json) {
    throw new Error('Failed to edit image: No base64 data in response')
  }

  return { imageUrl: `data:image/png;base64,${b64Json}` }
}

/**
 * Generate video from text prompt
 */
export async function generateVideo(
  prompt: string,
  options?: { aspectRatio?: '16:9' | '9:16' }
): Promise<{ videoUrl: string }> {
  if (!VOLCENGINE_CONFIG.apiKey) {
    throw new Error('VOLCENGINE_API_KEY is not configured')
  }

  const response = await fetch(`${VOLCENGINE_CONFIG.baseURL}/videos/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VOLCENGINE_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: VOLCENGINE_CONFIG.defaultVideoModel,
      prompt,
      aspect_ratio: options?.aspectRatio || '16:9',
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Volcengine Video Generation API Error:', errorData)
    throw new Error(`Failed to generate video: ${response.statusText}`)
  }

  const data = await response.json()
  const videoUrl = data.video_url

  if (!videoUrl) {
    throw new Error('Failed to generate video: No URL in response')
  }

  return { videoUrl }
}
