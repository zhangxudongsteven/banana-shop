import OpenAI from 'openai'

import { ProviderError } from './errors'
import type {
  AnalyzeImageInput,
  EditImageInput,
  GenerateChatInput,
  GenerateImageInput,
  ImageProvider,
} from './types'

export const VOLCENGINE_CONFIG = {
  baseURL: process.env.VOLCENGINE_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.VOLCENGINE_API_KEY || '',
  defaultImageModel: process.env.VOLCENGINE_IMAGE_MODEL || 'doubao-seed-2-0-lite-260215',
  defaultVisionModel: process.env.VOLCENGINE_VISION_MODEL || 'doubao-seed-2-0-lite-260215',
  defaultEditModel: process.env.VOLCENGINE_EDIT_MODEL || 'doubao-seedream-5-0-260128',
}

const client = new OpenAI({
  baseURL: VOLCENGINE_CONFIG.baseURL,
  apiKey: VOLCENGINE_CONFIG.apiKey,
})

function assertConfigured() {
  if (!VOLCENGINE_CONFIG.apiKey) {
    throw new ProviderError('CONFIG_MISSING', 'VOLCENGINE_API_KEY is not configured')
  }
}

function toProviderRequestError(message: string, cause: unknown) {
  if (cause instanceof ProviderError) return cause
  return new ProviderError('PROVIDER_REQUEST_FAILED', message, { cause })
}

function unsupported(capability: string): never {
  throw new ProviderError(
    'CAPABILITY_UNSUPPORTED',
    `Volcengine provider does not support ${capability}`
  )
}

export const volcengineProvider: ImageProvider = {
  id: 'volcengine',
  capabilities: {
    chat: false,
    textToImage: true,
    imageEdit: true,
    visionAnalyze: true,
    referenceImages: true,
    maskEdit: false,
  },

  async generateChat(_input: GenerateChatInput) {
    unsupported('chat')
  },

  async generateImage({ prompt, model, size = '1024x1024' }: GenerateImageInput) {
    assertConfigured()

    try {
      const response = await client.images.generate({
        model,
        prompt,
        size: size as any,
        response_format: 'b64_json',
      })

      const b64Json = response.data[0]?.b64_json
      if (!b64Json) {
        throw new ProviderError('INVALID_RESPONSE', 'No base64 data in image response')
      }

      return { imageUrl: `data:image/png;base64,${b64Json}`, mimeType: 'image/png' }
    } catch (error) {
      throw toProviderRequestError('Volcengine image generation failed', error)
    }
  },

  async analyzeImage({ base64Image, mimeType, prompt, model, secondaryImage }: AnalyzeImageInput) {
    assertConfigured()

    try {
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
        model,
        messages: [{ role: 'user', content }],
      })

      return { text: response.choices[0]?.message.content || '' }
    } catch (error) {
      throw toProviderRequestError('Volcengine image analysis failed', error)
    }
  },

  async editImage({ base64Image, mimeType, instruction, model, referenceImages }: EditImageInput) {
    assertConfigured()

    try {
      const response = await client.images.generate({
        model,
        prompt: instruction,
        response_format: 'b64_json',
        reference_images: [
          `data:${mimeType};base64,${base64Image}`,
          ...(referenceImages || []).map(
            (image) => `data:${image.mimeType};base64,${image.base64}`
          ),
        ],
      } as any)

      const b64Json = response.data[0]?.b64_json
      if (!b64Json) {
        throw new ProviderError('INVALID_RESPONSE', 'No base64 data in image edit response')
      }

      return { imageUrl: `data:image/png;base64,${b64Json}`, mimeType: 'image/png' }
    } catch (error) {
      throw toProviderRequestError('Volcengine image edit failed', error)
    }
  },
}
