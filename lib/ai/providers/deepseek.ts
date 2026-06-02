import OpenAI from 'openai'

import { ProviderError } from './errors'
import type {
  AnalyzeImageInput,
  EditImageInput,
  GenerateChatInput,
  GenerateImageInput,
  GenerateVideoInput,
  ImageProvider,
} from './types'

export const DEEPSEEK_CONFIG = {
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  defaultChatModel: process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-v4-flash',
}

const client = new OpenAI({
  baseURL: DEEPSEEK_CONFIG.baseURL,
  apiKey: DEEPSEEK_CONFIG.apiKey,
})

function assertConfigured() {
  if (!DEEPSEEK_CONFIG.apiKey) {
    throw new ProviderError('CONFIG_MISSING', 'DEEPSEEK_API_KEY is not configured')
  }
}

function unsupported(capability: string): never {
  throw new ProviderError(
    'CAPABILITY_UNSUPPORTED',
    `DeepSeek provider does not support ${capability}`
  )
}

function toProviderRequestError(message: string, cause: unknown) {
  if (cause instanceof ProviderError) return cause
  return new ProviderError('PROVIDER_REQUEST_FAILED', message, { cause })
}

export const deepseekProvider: ImageProvider = {
  id: 'deepseek',
  capabilities: {
    chat: true,
    textToImage: false,
    imageEdit: false,
    visionAnalyze: false,
    videoGenerate: false,
    referenceImages: false,
    maskEdit: false,
  },

  async generateChat({ messages, model, temperature, maxTokens }: GenerateChatInput) {
    assertConfigured()

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })

      return { text: response.choices[0]?.message.content || '' }
    } catch (error) {
      throw toProviderRequestError('DeepSeek chat completion failed', error)
    }
  },

  async generateImage(_input: GenerateImageInput) {
    unsupported('textToImage')
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
