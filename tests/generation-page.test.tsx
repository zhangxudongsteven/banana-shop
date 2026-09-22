import React, { Suspense } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({
  style: 'glmImage',
  push: vi.fn(),
  replace: vi.fn(),
  generate: vi.fn(),
  edit: vi.fn(),
  importImage: vi.fn(),
  save: vi.fn(),
  list: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ style: mocks.style }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}))
vi.mock('next/dynamic', () => ({ default: (loader: () => Promise<any>) => React.lazy(loader) }))
vi.mock('@/actions/image-actions', () => ({
  generateImageAction: mocks.generate,
  editImageAction: mocks.edit,
}))
vi.mock('@/actions/history-actions', () => ({
  recordGenerationHistoryAction: mocks.save,
  listGenerationHistoryAction: mocks.list,
}))
vi.mock('@/utils/imageInput', async (actual) => ({
  ...(await actual<any>()),
  loadImageInput: mocks.importImage,
}))
vi.mock('@/utils/fileUtils', () => ({ embedWatermark: async (url: string) => url }))
vi.mock('@/components/ResultDisplay', () => ({
  default: ({ content, originalImageUrl, onUseImageAsInput, disabled }: any) => (
    <div data-testid="result" data-original={originalImageUrl || ''}>
      <img src={content.imageUrl} alt="output" />
      <button disabled={disabled} onClick={() => onUseImageAsInput(content.imageUrl)}>
        continue-result
      </button>
      <button>download-result</button>
    </div>
  ),
}))
vi.mock('@/components/ImagePreviewModal', () => ({ default: () => null }))
import GenerationPage from '@/app/dashboard/[style]/page'
import { HistoryProvider, useHistory } from '@/contexts/HistoryContext'
import { LanguageProvider } from '@/i18n/context'
const oldInput = 'data:image/png;base64,aW5wdXQ='
const newInput = 'data:image/png;base64,bmV3'
const output = 'data:image/png;base64,b3V0cHV0'
function HistoryControls() {
  const ctx = useHistory()
  return (
    <>
      <button
        disabled={ctx.isGenerating}
        onClick={() => ctx.setPendingImageInput('https://example.test/input')}
      >
        history-input
      </button>
      <button
        disabled={ctx.isGenerating}
        onClick={() => ctx.setPendingImageInput('https://example.test/new')}
      >
        next-input
      </button>
      <output data-testid="pending">{ctx.pendingImageInput || ''}</output>
    </>
  )
}
const App = () => (
  <LanguageProvider>
    <HistoryProvider>
      <HistoryControls />
      <Suspense fallback="loading">
        <GenerationPage />
      </Suspense>
    </HistoryProvider>
  </LanguageProvider>
)
beforeEach(() => {
  vi.clearAllMocks()
  mocks.style = 'glmImage'
  localStorage.setItem('language', 'zh')
  mocks.save.mockResolvedValue({
    success: true,
    data: { taskId: 'saved', createdAt: '2026-09-22T00:00:00Z' },
  })
  mocks.importImage.mockResolvedValue({
    file: new File(['png'], 'input.png', { type: 'image/png' }),
    dataUrl: oldInput,
  })
  mocks.generate.mockResolvedValue({ success: true, data: { imageUrl: output, text: null } })
  mocks.edit.mockResolvedValue({ success: true, data: { imageUrl: output, text: null } })
})
it('keeps the previous result during a new request and failure, locks inputs and prevents duplicate generation', async () => {
  render(<App />)
  const prompt = await screen.findByRole('textbox')
  fireEvent.change(prompt, { target: { value: 'first version' } })
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }))
  await screen.findByRole('img', { name: 'output' })
  let finish!: (value: any) => void
  mocks.generate.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  fireEvent.change(prompt, { target: { value: 'second version' } })
  const generate = screen.getByRole('button', { name: '生成图片' })
  fireEvent.click(generate)
  fireEvent.click(generate)
  expect(mocks.generate).toHaveBeenCalledTimes(2)
  expect((prompt as HTMLTextAreaElement).closest('fieldset')?.disabled).toBe(true)
  expect(
    (screen.getByRole('button', { name: 'continue-result' }) as HTMLButtonElement).disabled
  ).toBe(true)
  expect(
    (screen.getByRole('button', { name: 'history-input' }) as HTMLButtonElement).disabled
  ).toBe(true)
  expect(
    (screen.getByRole('button', { name: 'download-result' }) as HTMLButtonElement).disabled
  ).toBe(false)
  expect(screen.getByRole('img', { name: 'output' }).getAttribute('src')).toBe(output)
  await act(async () => finish({ success: false, error: '模型请求失败' }))
  await screen.findByText('模型请求失败')
  expect(screen.getByRole('img', { name: 'output' }).getAttribute('src')).toBe(output)
  expect(screen.getByText('上次结果')).toBeTruthy()
})
it('routes text generation results into custom editing and imports the pending image', async () => {
  const { rerender } = render(<App />)
  fireEvent.change(await screen.findByRole('textbox'), { target: { value: 'banana' } })
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }))
  fireEvent.click(await screen.findByRole('button', { name: 'continue-result' }))
  expect(mocks.push).toHaveBeenCalledWith('/dashboard/customPrompt')
  expect(screen.getByTestId('pending').textContent).toBe(output)
  mocks.style = 'customPrompt'
  rerender(<App />)
  await waitFor(() => expect(screen.getByTestId('pending').textContent).toBe(''))
  expect(mocks.importImage).toHaveBeenCalledWith(output)
  expect(screen.getByAltText('主图像').getAttribute('src')).toBe(oldInput)
})
it('retains the original submitted image for comparison after changing input and preserves input after a failed import', async () => {
  mocks.style = 'customPrompt'
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'history-input' }))
  await waitFor(() => expect(screen.getByTestId('pending').textContent).toBe(''))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'edit this' } })
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }))
  await screen.findByTestId('result')
  expect(screen.getByTestId('result').getAttribute('data-original')).toBe(oldInput)
  mocks.importImage.mockRejectedValueOnce(new Error('imageEditor.fetchFailed'))
  fireEvent.click(screen.getByRole('button', { name: 'next-input' }))
  await screen.findByRole('button', { name: '重新载入图片' })
  expect(screen.getByTestId('pending').textContent).toBe('https://example.test/new')
  expect(screen.getByAltText('主图像').getAttribute('src')).toBe(oldInput)
  mocks.importImage.mockResolvedValueOnce({
    file: new File(['new'], 'new.png', { type: 'image/png' }),
    dataUrl: newInput,
  })
  fireEvent.click(screen.getByRole('button', { name: '重新载入图片' }))
  await waitFor(() => expect(screen.getByTestId('pending').textContent).toBe(''))
  expect(screen.getByAltText('主图像').getAttribute('src')).toBe(newInput)
  expect(screen.getByTestId('result').getAttribute('data-original')).toBe(oldInput)
})

it('routes a preset image edit into the custom editor', async () => {
  mocks.style = 'figurine'
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 10
      onload?: () => void
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
  )
  const { container } = render(<App />)
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File(['png'], 'photo.png', { type: 'image/png' })] },
  })
  await waitFor(() =>
    expect((screen.getByRole('button', { name: '生成图片' }) as HTMLButtonElement).disabled).toBe(
      false
    )
  )
  fireEvent.click(screen.getByRole('button', { name: '生成图片' }))
  fireEvent.click(await screen.findByRole('button', { name: 'continue-result' }))
  expect(mocks.push).toHaveBeenCalledWith('/dashboard/customPrompt')
  expect(screen.getByTestId('pending').textContent).toBe(output)
})
