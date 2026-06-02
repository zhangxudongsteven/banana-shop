export interface ProviderProfileOption {
  key: string
  titleKey: string
  descriptionKey?: string
}

export interface Transformation {
  key: string
  titleKey: string
  emoji: string
  prompt?: string
  descriptionKey?: string
  items?: Transformation[]
  isMultiImage?: boolean
  isSecondaryOptional?: boolean
  isTwoStep?: boolean
  stepTwoPrompt?: string
  primaryUploaderTitle?: string
  secondaryUploaderTitle?: string
  primaryUploaderDescription?: string
  secondaryUploaderDescription?: string
  isVideo?: boolean
  exampleImage?: string
  isTextToImage?: boolean
  providerProfiles?: ProviderProfileOption[]
  supportsMask?: boolean
}

export interface GeneratedContent {
  imageUrl: string | null
  text: string | null
  secondaryImageUrl?: string | null
  videoUrl?: string
  historyTaskId?: string
  historyStatus?: HistorySyncStatus
  historyError?: string
  createdAt?: string
  transformationTitle?: string
  prompt?: string
  kind?: GenerationHistoryKind
}

export type HistorySyncStatus = 'local' | 'syncing' | 'synced' | 'sync_failed'

export type GenerationHistoryKind =
  | 'text-to-image'
  | 'image-edit'
  | 'multi-image-edit'
  | 'two-step-image-edit'
  | 'video'

export type GenerationHistoryAttachmentRole =
  | 'input'
  | 'reference'
  | 'mask'
  | 'intermediate'
  | 'output'
  | 'video'

export interface GenerationHistoryAttachment {
  role: GenerationHistoryAttachmentRole
  attachmentId?: string
  fileName?: string
  mimeType?: string
  url?: string
}

export interface GenerationHistoryItem extends GeneratedContent {
  id: string
  historyTaskId?: string
  historyStatus: HistorySyncStatus
  createdAt: string
  transformationKey?: string
  transformationTitle?: string
  prompt?: string
  providerProfileKey?: string
  kind?: GenerationHistoryKind
  inputImageUrl?: string | null
  referenceImageUrl?: string | null
  maskImageUrl?: string | null
  attachments?: GenerationHistoryAttachment[]
}

export interface RecordGenerationHistoryInput {
  transformationKey: string
  transformationTitle: string
  prompt: string
  providerProfileKey?: string
  kind: GenerationHistoryKind
  inputs?: {
    primaryImageUrl?: string | null
    referenceImageUrl?: string | null
    maskImageUrl?: string | null
    aspectRatio?: '16:9' | '9:16'
  }
  outputs: {
    imageUrl?: string | null
    secondaryImageUrl?: string | null
    videoUrl?: string | null
    text?: string | null
  }
}
