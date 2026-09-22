// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
const client = vi.hoisted(() => ({
  taskTypes: { get: vi.fn() },
  attachmentTypes: { listByRef: vi.fn(), create: vi.fn() },
  tasks: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    uploadAttachment: vi.fn(),
    updateOutput: vi.fn(),
    updateStatus: vi.fn(),
  },
  attachments: { getDownloadUrl: vi.fn() },
}))
vi.mock('@/lib/tale-app-client', () => ({ createTaleServerAppClient: () => client }))
import { listGenerationHistory, recordGenerationHistory } from '@/lib/tale-history'
import type { RecordGenerationHistoryInput } from '@/types'
const png = 'data:image/png;base64,aGVsbG8='
const input: RecordGenerationHistoryInput = {
  clientRequestId: 'req-1',
  transformationKey: 'customPrompt',
  transformationTitle: 'Edit',
  prompt: 'edit',
  kind: 'image-edit',
  source: 'dashboard',
  inputs: { primaryImageUrl: png },
  outputs: { imageUrl: png },
}
const task = (extra = {}) => ({
  taskId: 'task-1',
  userId: 'user-1',
  taskType: 'Banana Shop Generation',
  createdAt: '2026-09-22T00:00:00Z',
  taskInput: { app: 'banana-shop', clientRequestId: 'req-1', kind: 'image-edit' },
  taskOutput: {},
  taskStatus: 'running',
  attachments: [],
  ...extra,
})
const page = (content: unknown[], last = true) => ({ content, last, totalPages: last ? 1 : 2 })
beforeEach(() => {
  vi.clearAllMocks()
  client.taskTypes.get.mockResolvedValue({ typeId: 'type-1', typeName: 'Banana Shop Generation' })
  client.attachmentTypes.listByRef.mockResolvedValue(
    page(
      ['input', 'output'].map((role) => ({ typeId: role, typeCode: `banana_shop_${role}_image` }))
    )
  )
  client.tasks.list.mockResolvedValue(page([]))
  client.tasks.create.mockResolvedValue(task())
  client.tasks.get.mockResolvedValue(task())
  client.tasks.uploadAttachment.mockImplementation(async (_id, _type, _file, role) => ({
    attachmentId: role + '-id',
    remark: role,
  }))
  client.tasks.updateOutput.mockResolvedValue({})
  client.tasks.updateStatus.mockResolvedValue({})
  client.attachments.getDownloadUrl.mockResolvedValue({
    downloadUrl: 'https://example.test/image.png',
  })
})
describe('history recovery', () => {
  it('resumes the same task, reuses attachments and waits for all uploads before failing', async () => {
    let finish!: () => void
    const pending = new Promise<void>((resolve) => {
      finish = resolve
    })
    client.tasks.uploadAttachment.mockImplementation(async (_id, _type, _file, role) => {
      if (role === 'output') throw new Error('upload failed')
      await pending
      return { attachmentId: 'input-id', remark: role }
    })
    const failed = vi.fn()
    const save = recordGenerationHistory('user-1', input).catch(failed)
    await vi.waitFor(() => expect(client.tasks.uploadAttachment).toHaveBeenCalledTimes(2))
    expect(failed).not.toHaveBeenCalled()
    finish()
    await save
    expect(failed.mock.calls[0][0]).toMatchObject({ taskId: 'task-1', recovery: 'resume' })
    client.tasks.get.mockResolvedValue(
      task({ attachments: [{ attachmentId: 'input-id', typeId: 'input', remark: 'input' }] })
    )
    client.tasks.uploadAttachment.mockResolvedValue({ attachmentId: 'output-id', remark: 'output' })
    client.tasks.uploadAttachment.mockClear()
    await expect(
      recordGenerationHistory('user-1', { ...input, historyTaskId: 'task-1', recovery: 'resume' })
    ).resolves.toMatchObject({ taskId: 'task-1' })
    expect(client.tasks.create).toHaveBeenCalledTimes(1)
    expect(client.tasks.uploadAttachment).toHaveBeenCalledTimes(1)
    expect(client.tasks.uploadAttachment.mock.calls[0][3]).toBe('output')
  })
  it('does not recreate after an ambiguous create response; reconciles by request id', async () => {
    client.tasks.create.mockRejectedValueOnce(new Error('connection lost'))
    await expect(recordGenerationHistory('user-1', input)).rejects.toMatchObject({
      recovery: 'reconcile',
    })
    await expect(
      recordGenerationHistory('user-1', { ...input, recovery: 'reconcile' })
    ).rejects.toMatchObject({ recovery: 'reconcile' })
    expect(client.tasks.create).toHaveBeenCalledTimes(1)
    client.tasks.list.mockResolvedValue(page([task({ taskStatus: 'completed' })]))
    await expect(
      recordGenerationHistory('user-1', { ...input, recovery: 'reconcile' })
    ).resolves.toMatchObject({ taskId: 'task-1' })
    expect(client.tasks.create).toHaveBeenCalledTimes(1)
    expect(client.tasks.uploadAttachment).not.toHaveBeenCalled()
  })
  it('rejects a continuation for another user before uploading', async () => {
    client.tasks.get.mockResolvedValue(task({ userId: 'someone-else' }))
    await expect(
      recordGenerationHistory('user-1', { ...input, historyTaskId: 'task-1' })
    ).rejects.toThrow()
    expect(client.tasks.uploadAttachment).not.toHaveBeenCalled()
    expect(client.tasks.updateOutput).not.toHaveBeenCalled()
  })
  it('deduplicates simultaneous saves for the same request in this process', async () => {
    const a = recordGenerationHistory('user-1', input)
    const b = recordGenerationHistory('user-1', input)
    await Promise.all([a, b])
    expect(client.tasks.create).toHaveBeenCalledTimes(1)
  })
  it('filters videos before resolving URLs and continues pagination', async () => {
    const video = task({
      taskId: 'v',
      taskInput: { kind: 'video' },
      attachments: [{ attachmentId: 'video-id', remark: 'video', mimeType: 'video/mp4' }],
    })
    const picture = task({
      taskStatus: 'completed',
      attachments: [
        { attachmentId: 'output-id', typeId: 'output', remark: 'output', mimeType: 'image/png' },
      ],
    })
    client.tasks.list
      .mockResolvedValueOnce(page([video], false))
      .mockResolvedValueOnce(page([picture]))
    const result = await listGenerationHistory('user-1')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: 'task-1', historyStatus: 'synced' })
    expect(client.tasks.list).toHaveBeenCalledTimes(2)
    expect(client.attachments.getDownloadUrl).toHaveBeenCalledTimes(1)
    expect(client.attachments.getDownloadUrl.mock.calls[0][0].attachmentId).toBe('output-id')
  })
  it('does not describe remote running tasks as saved', async () => {
    client.tasks.list.mockResolvedValue(page([task()]))
    expect((await listGenerationHistory('user-1'))[0].historyStatus).toBe('syncing')
  })
})
