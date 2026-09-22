import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import ImageUploader from '@/components/ImageUploader'
import { LanguageProvider } from '@/i18n/context'
import {
  MAX_IMAGE_BYTES,
  MAX_INPUT_BYTES,
  validateImageFile,
  loadImageInput,
} from '@/utils/imageInput'
beforeEach(() => {
  localStorage.setItem('language', 'zh')
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 10
      onload?: () => void
      onerror?: () => void
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
  )
})
it('rejects unsupported, empty, oversized and combined oversized files', () => {
  expect(() => validateImageFile(new File(['gif'], 'test.gif', { type: 'image/gif' }))).toThrow(
    'invalidType'
  )
  expect(() => validateImageFile(new File([], 'empty.png', { type: 'image/png' }))).toThrow(
    'tooLarge'
  )
  expect(() => validateImageFile({ size: MAX_IMAGE_BYTES + 1, type: 'image/png' } as Blob)).toThrow(
    'tooLarge'
  )
  expect(() =>
    validateImageFile({ size: MAX_IMAGE_BYTES, type: 'image/png' } as Blob, MAX_INPUT_BYTES)
  ).toThrow('totalTooLarge')
  expect(() =>
    validateImageFile({ size: MAX_IMAGE_BYTES, type: 'image/png' } as Blob, MAX_IMAGE_BYTES)
  ).not.toThrow()
})
it('opens the picker from the keyboard, handles repeated selection and blocks drops while disabled', async () => {
  const select = vi.fn()
  const props = { imageUrl: null, onClear: vi.fn(), onImageSelect: select }
  const { container, rerender } = render(
    <LanguageProvider>
      <ImageUploader {...props} />
    </LanguageProvider>
  )
  const input = container.querySelector('input')!
  const click = vi.spyOn(input, 'click')
  const user = userEvent.setup()
  await user.tab()
  expect(document.activeElement?.tagName).toBe('BUTTON')
  await user.keyboard('{Enter}')
  expect(click).toHaveBeenCalledOnce()
  const file = new File(['png'], 'same.png', { type: 'image/png' })
  fireEvent.change(input, { target: { files: [file] } })
  await waitFor(() => expect(select).toHaveBeenCalledTimes(1))
  fireEvent.change(input, { target: { files: [file] } })
  await waitFor(() => expect(select).toHaveBeenCalledTimes(2))
  rerender(
    <LanguageProvider>
      <ImageUploader {...props} disabled />
    </LanguageProvider>
  )
  fireEvent.drop(container.querySelector('[class*="aspect-square"]')!, {
    dataTransfer: { files: [file] },
  })
  expect(select).toHaveBeenCalledTimes(2)
})
it('preserves the existing preview when decoding fails', async () => {
  vi.stubGlobal(
    'Image',
    class {
      onerror?: () => void
      set src(_value: string) {
        queueMicrotask(() => this.onerror?.())
      }
    }
  )
  const onSelect = vi.fn()
  const { container } = render(
    <LanguageProvider>
      <ImageUploader
        imageUrl="data:image/png;base64,old"
        onClear={vi.fn()}
        onImageSelect={onSelect}
      />
    </LanguageProvider>
  )
  fireEvent.drop(container.querySelector('[class*="aspect-square"]')!, {
    dataTransfer: { files: [new File(['broken'], 'bad.png', { type: 'image/png' })] },
  })
  await screen.findByRole('alert')
  expect(onSelect).not.toHaveBeenCalled()
  expect(screen.getByRole('img').getAttribute('src')).toBe('data:image/png;base64,old')
})
it('checks remote response status and normalizes accepted images to data URLs', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['png'], { type: 'image/png' }),
      })
  )
  await expect(loadImageInput('https://example.test/expired')).rejects.toThrow('fetchFailed')
  const result = await loadImageInput('https://example.test/image')
  expect(result.dataUrl).toMatch(/^data:image\/png;base64,/)
  expect(result.file.type).toBe('image/png')
})

it('downloads remote images as a local blob and reports HTTP failures', async () => {
  const { downloadImage } = await import('@/utils/fileUtils')
  vi.useFakeTimers()
  const create = vi.fn().mockReturnValue('blob:download-test')
  const revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['png'], { type: 'image/jpeg' }),
      })
      .mockResolvedValueOnce({ ok: false })
  )
  const downloads: string[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    downloads.push(this.download)
    expect(this.href).toBe('blob:download-test')
  })
  await downloadImage('https://example.test/result', 'result.png')
  expect(downloads).toEqual(['result.jpg'])
  await expect(downloadImage('https://example.test/expired', 'result.png')).rejects.toThrow(
    '图片下载失败'
  )
  expect(downloads).toHaveLength(1)
  vi.runAllTimers()
  expect(revoke).toHaveBeenCalledWith('blob:download-test')
  vi.useRealTimers()
})
