import { apiErrorResponse } from '@/lib/api-auth'

/** Compatibility response: this endpoint no longer generates or saves media. */
export async function POST() {
  return apiErrorResponse(410, '视频生成功能已下线，请使用图片生成或编辑')
}
