import { ProviderError } from './errors'
import type { ImageProvider, ProviderCapability } from './types'
import { ALIYUN_CONFIG, aliyunProvider } from './aliyun'
import { DEEPSEEK_CONFIG, deepseekProvider } from './deepseek'
import { GLM_CONFIG, glmProvider } from './glm'
import { VOLCENGINE_CONFIG, volcengineProvider } from './volcengine'

type ProviderId = 'volcengine' | 'aliyun' | 'glm' | 'deepseek'

export interface GenerationProfile {
  providerId: ProviderId
  capability: ProviderCapability
  model: string
  size?: string
}

const providers: Record<ProviderId, ImageProvider> = {
  volcengine: volcengineProvider,
  aliyun: aliyunProvider,
  glm: glmProvider,
  deepseek: deepseekProvider,
}

const generationProfiles: Record<string, GenerationProfile> = {
  defaultChat: {
    providerId: 'deepseek',
    capability: 'chat',
    model: DEEPSEEK_CONFIG.defaultChatModel,
  },
  defaultTextToImage: {
    providerId: 'volcengine',
    capability: 'textToImage',
    model: VOLCENGINE_CONFIG.defaultImageModel,
    size: '1024x1024',
  },
  glmImage: {
    providerId: 'glm',
    capability: 'textToImage',
    model: GLM_CONFIG.defaultImageModel,
    size: '1280x1280',
  },
  aliyunTextToImage: {
    providerId: 'aliyun',
    capability: 'textToImage',
    model: ALIYUN_CONFIG.defaultImageModel,
    size: '2048*2048',
  },
  aliyunImageEdit: {
    providerId: 'aliyun',
    capability: 'imageEdit',
    model: ALIYUN_CONFIG.defaultEditModel,
    size: '2048*2048',
  },
  defaultImageEdit: {
    providerId: 'volcengine',
    capability: 'imageEdit',
    model: VOLCENGINE_CONFIG.defaultEditModel,
  },
  defaultVisionAnalyze: {
    providerId: 'volcengine',
    capability: 'visionAnalyze',
    model: VOLCENGINE_CONFIG.defaultVisionModel,
  },
  defaultVideoGenerate: {
    providerId: 'volcengine',
    capability: 'videoGenerate',
    model: VOLCENGINE_CONFIG.defaultVideoModel,
  },
}

function assertProfileCapability(provider: ImageProvider, profile: GenerationProfile) {
  if (!provider.capabilities[profile.capability]) {
    throw new ProviderError(
      'CAPABILITY_UNSUPPORTED',
      `${provider.id} does not support ${profile.capability}`
    )
  }
}

export function getGenerationProfile(profileKey: string): {
  provider: ImageProvider
  profile: GenerationProfile
} {
  const profile = generationProfiles[profileKey]
  if (!profile) {
    throw new ProviderError('PROFILE_NOT_FOUND', `Generation profile not found: ${profileKey}`)
  }

  const provider = providers[profile.providerId]
  assertProfileCapability(provider, profile)

  return { provider, profile }
}

export function getTextToImageProfile(profileKey: string) {
  const result = getGenerationProfile(profileKey)
  if (result.profile.capability !== 'textToImage') {
    throw new ProviderError('CAPABILITY_UNSUPPORTED', `${profileKey} is not a text-to-image profile`)
  }
  return result
}

export function getImageEditProfile(profileKey = 'defaultImageEdit') {
  const result = getGenerationProfile(profileKey)
  if (result.profile.capability !== 'imageEdit') {
    throw new ProviderError('CAPABILITY_UNSUPPORTED', `${profileKey} is not an image edit profile`)
  }
  return result
}

export function getDefaultChatProfile() {
  return getGenerationProfile('defaultChat')
}

export function getDefaultImageEditProfile() {
  return getGenerationProfile('defaultImageEdit')
}

export function getDefaultVisionAnalyzeProfile() {
  return getGenerationProfile('defaultVisionAnalyze')
}

export function getDefaultVideoGenerateProfile() {
  return getGenerationProfile('defaultVideoGenerate')
}
