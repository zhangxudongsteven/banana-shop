import { ProviderError } from './errors'
import type {
  AnalyzeImageInput,
  EditImageInput,
  GenerateChatInput,
  GenerateImageInput,
  GenerateVideoInput,
  ImageProvider,
} from './types'

export const GLM_CONFIG = {
  baseURL: process.env.GLM_BASE_URL || 'https://api.z.ai/api/paas/v4',
  apiKey: process.env.GLM_API_KEY || '',
  defaultImageModel: process.env.GLM_IMAGE_MODEL || 'glm-image',
}

function assertConfigured() {
  if (!GLM_CONFIG.apiKey) {
    throw new ProviderError('CONFIG_MISSING', 'GLM_API_KEY is not configured')
  }
}

function unsupported(capability: string): never {
  throw new ProviderError('CAPABILITY_UNSUPPORTED', `GLM provider does not support ${capability}`)
}

function toProviderRequestError(message: string, cause: unknown) {
  if (cause instanceof ProviderError) return cause
  return new ProviderError('PROVIDER_REQUEST_FAILED', message, { cause })
}

export const glmProvider: ImageProvider = {
  id: 'glm',
  capabilities: {
    chat: false,
    textToImage: true,
    imageEdit: false,
    visionAnalyze: false,
    videoGenerate: false,
    referenceImages: false,
    maskEdit: false,
  },

  async generateChat(_input: GenerateChatInput) {
    unsupported('chat')
  },

  async generateImage({ prompt, model, size = '1280x1280' }: GenerateImageInput) {
    assertConfigured()

    try {
      const response = await fetch(`${GLM_CONFIG.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GLM_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          size,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('GLM Image Generation API Error:', errorData)
        throw new ProviderError(
          'PROVIDER_REQUEST_FAILED',
          `GLM image generation failed: ${response.statusText}`
        )
      }

      const data = await response.json()
      const imageUrl = data.data?.[0]?.url
      if (!imageUrl) {
        throw new ProviderError('INVALID_RESPONSE', 'No URL in GLM image response')
      }

      return { imageUrl }
    } catch (error) {
      throw toProviderRequestError('GLM image generation failed', error)
    }
  },

  async analyzeImage(_input: AnalyzeImageInput) {
    unsupported('visionAnalyze')
  },

  async editImage(_input: EditImageInput) {
    unsupported('imageEdit')
  },

  async generateVideo(_input: GenerateVideoInput) {
    unsupported('videoGenerate')
  },
}
