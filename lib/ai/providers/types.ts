export type ProviderCapability =
  'chat' | 'textToImage' | 'imageEdit' | 'visionAnalyze' | 'referenceImages' | 'maskEdit'

export interface ProviderCapabilities {
  chat: boolean
  textToImage: boolean
  imageEdit: boolean
  visionAnalyze: boolean
  referenceImages: boolean
  maskEdit: boolean
}

export interface ProviderImageResult {
  imageUrl: string
  mimeType?: string
}

export interface ProviderTextResult {
  text: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateChatInput {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
}

export interface GenerateImageInput {
  prompt: string
  model: string
  size?: string
}

export interface AnalyzeImageInput {
  base64Image: string
  mimeType: string
  prompt: string
  model: string
  secondaryImage?: { base64: string; mimeType: string }
}

export interface EditImageInput {
  base64Image: string
  mimeType: string
  instruction: string
  model: string
  referenceImages?: { base64: string; mimeType: string }[]
  size?: string
}

export interface ImageProvider {
  id: string
  capabilities: ProviderCapabilities
  generateChat(input: GenerateChatInput): Promise<ProviderTextResult>
  generateImage(input: GenerateImageInput): Promise<ProviderImageResult>
  analyzeImage(input: AnalyzeImageInput): Promise<ProviderTextResult>
  editImage(input: EditImageInput): Promise<ProviderImageResult>
}
