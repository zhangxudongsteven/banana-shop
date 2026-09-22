// @vitest-environment node
import { expect, it, vi } from 'vitest'
const getProfile = vi.hoisted(() => vi.fn())
vi.mock('@/lib/ai/providers/registry', () => ({
  getImageEditProfile: getProfile,
  getDefaultVisionAnalyzeProfile: getProfile,
}))
vi.mock('@/lib/api-auth', async (actual) => ({
  ...(await actual<any>()),
  authenticateApiRequest: vi.fn().mockResolvedValue({ userId: 'user-1' }),
}))
const saveHistory = vi.hoisted(() => vi.fn())
vi.mock('@/lib/generation-history-service', () => ({
  recordGenerationHistorySafely: saveHistory,
  dataUrlFromBase64: () => '',
}))
import { POST as editRoute } from '@/app/api/v1/images/edit/route'
import { editImageAction } from '@/actions/image-actions'
import { editImage } from '@/lib/generation-service'
import { POST as removedVideo } from '@/app/api/v1/videos/generate/route'
import { API_KEY_SCOPES } from '@/lib/api-keys'
import { TRANSFORMATIONS, findTransformationByKey } from '@/lib/constants'
import { readFileSync } from 'node:fs'
it('rejects a nonempty mask before resolving or invoking providers', async () => {
  await expect(editImage('abc', 'image/png', 'edit', 'mask')).rejects.toMatchObject({
    code: 'MASK_UNSUPPORTED',
  })
  expect(getProfile).not.toHaveBeenCalled()
})
it('retires videos and selection editing throughout discovery', async () => {
  expect(findTransformationByKey('videoGeneration')).toBeUndefined()
  expect(findTransformationByKey('isolate')).toBeUndefined()
  expect(JSON.stringify(TRANSFORMATIONS)).not.toContain('isVideo')
  expect(API_KEY_SCOPES).not.toContain('video:generate')
  expect((await removedVideo()).status).toBe(410)
  expect(readFileSync('mcp/server.ts', 'utf8')).not.toContain('banana_generate_video')
})

it('returns an explicit mask error from REST and Server Actions without writing history', async () => {
  const response = await editRoute(
    new Request('http://localhost/api/v1/images/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64ImageData: 'abc',
        mimeType: 'image/png',
        prompt: 'edit',
        maskBase64: 'mask',
      }),
    })
  )
  expect(response.status).toBe(400)
  expect(await response.text()).toContain('不支持局部选区编辑')
  expect(await editImageAction('abc', 'image/png', 'edit', 'mask')).toMatchObject({
    success: false,
    error: '不支持局部选区编辑，请使用整图编辑',
  })
  expect(getProfile).not.toHaveBeenCalled()
  expect(saveHistory).not.toHaveBeenCalled()
})
