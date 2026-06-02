export type ProviderErrorCode =
  | 'CONFIG_MISSING'
  | 'PROFILE_NOT_FOUND'
  | 'CAPABILITY_UNSUPPORTED'
  | 'INVALID_RESPONSE'
  | 'PROVIDER_REQUEST_FAILED'

export class ProviderError extends Error {
  code: ProviderErrorCode

  constructor(code: ProviderErrorCode, message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'ProviderError'
    this.code = code
    this.cause = options?.cause
  }
}

export function toUserFacingProviderError(error: unknown, fallback: string): string {
  if (!(error instanceof ProviderError)) return fallback

  switch (error.code) {
    case 'CONFIG_MISSING':
      return 'AI 服务配置缺失，请联系管理员检查环境变量'
    case 'PROFILE_NOT_FOUND':
      return '当前生成配置不可用，请刷新页面后重试'
    case 'CAPABILITY_UNSUPPORTED':
      return '当前模型不支持这个生成能力'
    case 'INVALID_RESPONSE':
      return 'AI 服务返回结果异常，请稍后重试'
    case 'PROVIDER_REQUEST_FAILED':
    default:
      return fallback
  }
}
