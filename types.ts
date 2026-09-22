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
  exampleImage?: string
  isTextToImage?: boolean
  providerProfiles?: ProviderProfileOption[]
}

export interface GeneratedContent {
  imageUrl: string | null
  text: string | null
  secondaryImageUrl?: string | null
  historyTaskId?: string
  historyStatus?: HistorySyncStatus
  clientRequestId?: string
  historyError?: string
  createdAt?: string
  transformationTitle?: string
  prompt?: string
  kind?: GenerationHistoryKind
  source?: GenerationHistorySource
}

export type HistorySyncStatus = 'local' | 'syncing' | 'synced' | 'sync_failed' | 'sync_unknown'

export type GenerationHistoryKind =
  'text-to-image' | 'image-edit' | 'multi-image-edit' | 'two-step-image-edit'

export type GenerationHistorySource = 'dashboard' | 'api' | 'mcp'

export type GenerationHistoryAttachmentRole =
  'input' | 'reference' | 'mask' | 'intermediate' | 'output'

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
  source?: GenerationHistorySource
  inputImageUrl?: string | null
  referenceImageUrl?: string | null
  maskImageUrl?: string | null
  attachments?: GenerationHistoryAttachment[]
}

export interface RecordGenerationHistoryInput {
  clientRequestId?: string
  historyTaskId?: string
  recovery?: HistoryRecovery

  transformationKey: string
  transformationTitle: string
  prompt: string
  providerProfileKey?: string
  kind: GenerationHistoryKind
  source: GenerationHistorySource
  inputs?: {
    primaryImageUrl?: string | null
    referenceImageUrl?: string | null
    maskImageUrl?: string | null
  }
  outputs: {
    imageUrl?: string | null
    secondaryImageUrl?: string | null
    text?: string | null
  }
}

export type HistoryRecovery = 'retry' | 'resume' | 'reconcile'

export interface HistorySaveResult {
  success: boolean
  data?: { taskId: string; createdAt: string }
  error?: string
  taskId?: string
  recovery?: HistoryRecovery
}
