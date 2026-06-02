import { ProviderError } from './errors'
import type {
  AnalyzeImageInput,
  EditImageInput,
  GenerateChatInput,
  GenerateImageInput,
  GenerateVideoInput,
  ImageProvider,
} from './types'

export const ALIYUN_CONFIG = {
  baseURL: process.env.ALIYUN_DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1',
  apiKey: process.env.ALIYUN_DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY || '',
  defaultImageModel: process.env.ALIYUN_IMAGE_MODEL || 'qwen-image-2.0-pro',
  defaultEditModel: process.env.ALIYUN_EDIT_MODEL || 'qwen-image-2.0-pro',
}

const multimodalGenerationPath = '/services/aigc/multimodal-generation/generation'

function assertConfigured() {
  if (!ALIYUN_CONFIG.apiKey) {
    throw new ProviderError(
      'CONFIG_MISSING',
      'ALIYUN_DASHSCOPE_API_KEY or DASHSCOPE_API_KEY is not configured'
    )
  }
}

function unsupported(capability: string): never {
  throw new ProviderError('CAPABILITY_UNSUPPORTED', `Aliyun provider does not support ${capability}`)
}

function toProviderRequestError(message: string, cause: unknown) {
  if (cause instanceof ProviderError) return cause
  return new ProviderError('PROVIDER_REQUEST_FAILED', message, { cause })
}

function normalizeAliyunSize(size?: string) {
  return (size || '2048*2048').replace('x', '*')
}

function dataUrl(base64: string, mimeType: string) {
  return `data:${mimeType};base64,${base64}`
}

async function callMultimodalGeneration(body: unknown) {
  const response = await fetch(`${ALIYUN_CONFIG.baseURL}${multimodalGenerationPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ALIYUN_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.code) {
    console.error('Aliyun Image API Error:', data)
    throw new ProviderError(
      'PROVIDER_REQUEST_FAILED',
      `Aliyun image request failed: ${data.message || response.statusText}`
    )
  }

  const imageUrl = data.output?.choices?.[0]?.message?.content?.find(
    (item: { image?: string }) => item.image
  )?.image
  if (!imageUrl) {
    throw new ProviderError('INVALID_RESPONSE', 'No image URL in Aliyun image response')
  }

  return { imageUrl, mimeType: 'image/png' }
}

export const aliyunProvider: ImageProvider = {
  id: 'aliyun',
  capabilities: {
    chat: false,
    textToImage: true,
    imageEdit: true,
    visionAnalyze: false,
    videoGenerate: false,
    referenceImages: true,
    maskEdit: false,
  },

  async generateChat(_input: GenerateChatInput) {
    unsupported('chat')
  },

  async generateImage({ prompt, model, size }: GenerateImageInput) {
    assertConfigured()

    try {
      return await callMultimodalGeneration({
        model,
        input: {
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }],
            },
          ],
        },
        parameters: {
          size: normalizeAliyunSize(size),
          prompt_extend: true,
          watermark: false,
          n: 1,
        },
      })
    } catch (error) {
      throw toProviderRequestError('Aliyun image generation failed', error)
    }
  },

  async analyzeImage(_input: AnalyzeImageInput) {
    unsupported('visionAnalyze')
  },

  async editImage({
    base64Image,
    mimeType,
    instruction,
    model,
    referenceImages,
    size,
  }: EditImageInput) {
    assertConfigured()

    try {
      const content = [
        { image: dataUrl(base64Image, mimeType) },
        ...(referenceImages || []).slice(0, 2).map((image) => ({
          image: dataUrl(image.base64, image.mimeType),
        })),
        { text: instruction },
      ]

      return await callMultimodalGeneration({
        model,
        input: {
          messages: [
            {
              role: 'user',
              content,
            },
          ],
        },
        parameters: {
          size: normalizeAliyunSize(size),
          prompt_extend: true,
          watermark: false,
          n: 1,
        },
      })
    } catch (error) {
      throw toProviderRequestError('Aliyun image edit failed', error)
    }
  },

  async generateVideo(_input: GenerateVideoInput) {
    unsupported('videoGenerate')
  },
}
