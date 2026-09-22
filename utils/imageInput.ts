export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_INPUT_BYTES = 16 * 1024 * 1024
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function validateImageFile(file: Blob, otherImageBytes = 0) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) throw new Error('imageEditor.invalidType')
  if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error('imageEditor.tooLarge')
  if (file.size + otherImageBytes > MAX_INPUT_BYTES) throw new Error('imageEditor.totalTooLarge')
}

export async function readImageFile(file: File, otherImageBytes = 0): Promise<string> {
  validateImageFile(file, otherImageBytes)
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('imageEditor.readFailed'))
    reader.readAsDataURL(file)
  })
  await new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      image.naturalWidth > 0 ? resolve() : reject(new Error('imageEditor.decodeFailed'))
    image.onerror = () => reject(new Error('imageEditor.decodeFailed'))
    image.src = dataUrl
  })
  return dataUrl
}

export async function loadImageInput(url: string): Promise<{ file: File; dataUrl: string }> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('imageEditor.fetchFailed')
  const blob = await response.blob()
  const file = new File([blob], 'input-image', { type: blob.type })
  return { file, dataUrl: await readImageFile(file) }
}
