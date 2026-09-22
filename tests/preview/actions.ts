import type { RecordGenerationHistoryInput, GeneratedContent } from '@/types'
let shouldFail = false
export function failNextGeneration() {
  shouldFail = true
}
async function generate() {
  await new Promise((resolve) => setTimeout(resolve, 1800))
  if (shouldFail) {
    shouldFail = false
    return { success: false, error: '模拟服务失败：请重试，上次结果仍可下载。' }
  }
  const blob = await (await fetch('/examples/figurine.jpg')).blob()
  const imageUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
  return { success: true, data: { imageUrl, text: null } as GeneratedContent }
}
export const generateImageAction = generate
export const editImageAction = generate
export async function listGenerationHistoryAction() {
  return { success: true, data: [] }
}
export async function recordGenerationHistoryAction(_input: RecordGenerationHistoryInput) {
  return {
    success: true,
    data: { taskId: crypto.randomUUID(), createdAt: new Date().toISOString() },
  }
}
