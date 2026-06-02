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
}

export interface GeneratedContent {
  imageUrl: string | null
  text: string | null
  secondaryImageUrl?: string | null
  videoUrl?: string
}
