import {
  type Attachment,
  type AttachmentType,
  type UserTask,
} from '@turinhub/tale-js-sdk'
import { createTaleServerAppClient, type TaleServerAppClient } from '@/lib/tale-app-client'
import type {
  GenerationHistoryAttachment,
  GenerationHistoryAttachmentRole,
  GenerationHistoryItem,
  RecordGenerationHistoryInput,
} from '@/types'

const DEFAULT_TASK_TYPE_ID = '52622b72-159c-4cf9-86f5-52f4fea15d56'
const TASK_TYPE_NAME = 'Banana Shop Generation'
const IMAGE_MAX_FILE_SIZE = 25 * 1024 * 1024
const VIDEO_MAX_FILE_SIZE = 200 * 1024 * 1024

type AttachmentSpec = {
  role: GenerationHistoryAttachmentRole
  envKey: string
  typeCode: string
  typeName: string
  description: string
  allowedExtensions: string[]
  allowedMimeTypes: string[]
  maxFileSize: number
}

const ATTACHMENT_SPECS: AttachmentSpec[] = [
  {
    role: 'input',
    envKey: 'TALE_INPUT_IMAGE_ATTACHMENT_TYPE_ID',
    typeCode: 'banana_shop_input_image',
    typeName: 'Banana Shop Input Image',
    description: 'Primary input image for Banana Shop generation tasks.',
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxFileSize: IMAGE_MAX_FILE_SIZE,
  },
  {
    role: 'reference',
    envKey: 'TALE_REFERENCE_IMAGE_ATTACHMENT_TYPE_ID',
    typeCode: 'banana_shop_reference_image',
    typeName: 'Banana Shop Reference Image',
    description: 'Secondary reference image for Banana Shop generation tasks.',
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxFileSize: IMAGE_MAX_FILE_SIZE,
  },
  {
    role: 'mask',
    envKey: 'TALE_MASK_IMAGE_ATTACHMENT_TYPE_ID',
    typeCode: 'banana_shop_mask_image',
    typeName: 'Banana Shop Mask Image',
    description: 'Mask image for Banana Shop localized editing tasks.',
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxFileSize: IMAGE_MAX_FILE_SIZE,
  },
  {
    role: 'intermediate',
    envKey: 'TALE_INTERMEDIATE_IMAGE_ATTACHMENT_TYPE_ID',
    typeCode: 'banana_shop_intermediate_image',
    typeName: 'Banana Shop Intermediate Image',
    description: 'Intermediate image such as line art from two-step Banana Shop tasks.',
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxFileSize: IMAGE_MAX_FILE_SIZE,
  },
  {
    role: 'output',
    envKey: 'TALE_OUTPUT_IMAGE_ATTACHMENT_TYPE_ID',
    typeCode: 'banana_shop_output_image',
    typeName: 'Banana Shop Output Image',
    description: 'Final output image for Banana Shop generation tasks.',
    allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    maxFileSize: IMAGE_MAX_FILE_SIZE,
  },
  {
    role: 'video',
    envKey: 'TALE_OUTPUT_VIDEO_ATTACHMENT_TYPE_ID',
    typeCode: 'banana_shop_output_video',
    typeName: 'Banana Shop Output Video',
    description: 'Final output video for Banana Shop generation tasks.',
    allowedExtensions: ['mp4', 'webm', 'mov'],
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxFileSize: VIDEO_MAX_FILE_SIZE,
  },
]

type HistoryInputPayload = {
  app: 'banana-shop'
  transformationKey: string
  transformationTitle: string
  prompt: string
  providerProfileKey?: string
  kind: RecordGenerationHistoryInput['kind']
  aspectRatio?: '16:9' | '9:16'
  hasPrimaryImage: boolean
  hasReferenceImage: boolean
  hasMaskImage: boolean
  schemaVersion: 1
}

type HistoryOutputPayload = {
  resultType: 'image' | 'video' | 'text'
  imageGenerated: boolean
  videoGenerated: boolean
  textGenerated: boolean
  attachmentIds: Partial<Record<GenerationHistoryAttachmentRole, string>>
  schemaVersion: 1
}

const getTaleAppClient = (): TaleServerAppClient => createTaleServerAppClient()

const getTaskType = async (app: TaleServerAppClient) => {
  const configuredTypeId = process.env.TALE_GENERATION_TASK_TYPE_ID || DEFAULT_TASK_TYPE_ID
  if (configuredTypeId) {
    try {
      return await app.taskTypes.get(configuredTypeId)
    } catch (error) {
      console.warn(
        `Configured Tale generation task type is unavailable (${configuredTypeId}); falling back to lookup/create.`,
        error
      )
    }
  }

  const enabledTypes = await app.taskTypes.listEnabled()
  const existing = enabledTypes.find((type) => type.typeName === TASK_TYPE_NAME)
  if (existing) return existing

  return await app.taskTypes.create({
    typeName: TASK_TYPE_NAME,
    description:
      'Banana Shop AI image/video generation history task type. Stores generation inputs, outputs, status, and related media attachments.',
    allowMultiple: true,
    isEnabled: true,
    remark: 'Automatically created by Banana Shop history integration.',
  })
}

const ensureAttachmentTypes = async (app: TaleServerAppClient, taskTypeId: string) => {
  const existingByRef = await app.attachmentTypes.listByRef({
    refType: 'task',
    refTypeId: taskTypeId,
    page: 0,
    size: 100,
  })

  const typeByRole = new Map<GenerationHistoryAttachmentRole, string>()

  for (const spec of ATTACHMENT_SPECS) {
    const configuredTypeId = process.env[spec.envKey]
    if (configuredTypeId) {
      typeByRole.set(spec.role, configuredTypeId)
      continue
    }

    const existing = existingByRef.content.find((type) => type.typeCode === spec.typeCode)
    if (existing) {
      typeByRole.set(spec.role, existing.typeId)
      continue
    }

    const created = await app.attachmentTypes.create({
      refType: 'task',
      refTypeId: taskTypeId,
      typeCode: spec.typeCode,
      typeName: spec.typeName,
      description: spec.description,
      allowedExtensions: spec.allowedExtensions,
      allowedMimeTypes: spec.allowedMimeTypes,
      maxFileSize: spec.maxFileSize,
      isUnique: false,
      isEnabled: true,
      remark: 'Automatically created by Banana Shop history integration.',
    })
    typeByRole.set(spec.role, created.typeId)
  }

  return typeByRole
}

const dataUrlToBlob = (dataUrl: string) => {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if (!match) throw new Error('Invalid data URL')

  const mimeType = match[1] || 'application/octet-stream'
  const isBase64 = Boolean(match[2])
  const payload = match[3] || ''
  const bytes = isBase64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8')

  return new Blob([bytes], { type: mimeType })
}

const urlToBlob = async (url: string) => {
  if (url.startsWith('data:')) return dataUrlToBlob(url)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch media for history upload: ${response.statusText}`)
  }
  return await response.blob()
}

const getExtensionForMimeType = (mimeType: string, fallback: string) => {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType === 'video/mp4') return 'mp4'
  if (mimeType === 'video/webm') return 'webm'
  if (mimeType === 'video/quicktime') return 'mov'
  return fallback
}

const uploadHistoryAttachment = async (
  app: TaleServerAppClient,
  taskId: string,
  attachmentTypes: Map<GenerationHistoryAttachmentRole, string>,
  role: GenerationHistoryAttachmentRole,
  url: string | null | undefined
) => {
  if (!url) return null

  const attachmentTypeId = attachmentTypes.get(role)
  if (!attachmentTypeId) return null

  const blob = await urlToBlob(url)
  const extension = getExtensionForMimeType(blob.type, role === 'video' ? 'mp4' : 'png')
  const filename = `${role}-${Date.now()}.${extension}`
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })

  return await app.tasks.uploadAttachment(taskId, attachmentTypeId, file, role)
}

const safeString = (value: unknown) => (typeof value === 'string' ? value : undefined)

const getAttachmentRole = (
  attachment: Attachment,
  typesById: Map<string, AttachmentType>
): GenerationHistoryAttachmentRole | null => {
  const attachmentType = typesById.get(attachment.typeId)
  const typeCode = attachmentType?.typeCode
  const spec = ATTACHMENT_SPECS.find((item) => item.typeCode === typeCode)
  if (spec) return spec.role

  const remark = attachment.remark
  if (
    remark === 'input' ||
    remark === 'reference' ||
    remark === 'mask' ||
    remark === 'intermediate' ||
    remark === 'output' ||
    remark === 'video'
  ) {
    return remark
  }

  return null
}

const getDownloadUrl = async (app: TaleServerAppClient, taskId: string, attachment: Attachment) => {
  const result = await app.attachments.getDownloadUrl({
    attachmentId: attachment.attachmentId,
    refType: 'task',
    refId: taskId,
    expiresInSeconds: 3600,
  })
  return result.downloadUrl
}

const normalizeHistoryItem = async (
  app: TaleServerAppClient,
  task: UserTask,
  attachmentTypesById: Map<string, AttachmentType>
): Promise<GenerationHistoryItem> => {
  const input = task.taskInput as Partial<HistoryInputPayload>
  const output = task.taskOutput as Partial<HistoryOutputPayload>
  const historyAttachments: GenerationHistoryAttachment[] = []

  const roleUrls = new Map<GenerationHistoryAttachmentRole, string>()
  for (const attachment of task.attachments || []) {
    const role = getAttachmentRole(attachment, attachmentTypesById)
    if (!role) continue

    let url: string | undefined
    try {
      url = await getDownloadUrl(app, task.taskId, attachment)
      roleUrls.set(role, url)
    } catch (error) {
      console.error('Failed to get history attachment download URL:', error)
    }

    historyAttachments.push({
      role,
      attachmentId: attachment.attachmentId,
      fileName: attachment.fileOriginalName || attachment.fileName,
      mimeType: attachment.mimeType,
      url,
    })
  }

  const imageUrl = roleUrls.get('output') || null
  const videoUrl = roleUrls.get('video')
  const secondaryImageUrl = roleUrls.get('intermediate') || null
  const resultType = output.resultType || (videoUrl ? 'video' : imageUrl ? 'image' : 'text')

  return {
    id: task.taskId,
    historyTaskId: task.taskId,
    historyStatus: task.taskStatus === 'failed' ? 'sync_failed' : 'synced',
    createdAt: task.createdAt,
    transformationKey: safeString(input.transformationKey),
    transformationTitle: safeString(input.transformationTitle) || task.taskTitle,
    prompt: safeString(input.prompt),
    providerProfileKey: safeString(input.providerProfileKey),
    kind: input.kind,
    imageUrl,
    secondaryImageUrl,
    videoUrl,
    text: resultType === 'text' ? safeString(task.taskOutput?.text) || null : null,
    inputImageUrl: roleUrls.get('input') || null,
    referenceImageUrl: roleUrls.get('reference') || null,
    maskImageUrl: roleUrls.get('mask') || null,
    attachments: historyAttachments,
  }
}

export const recordGenerationHistory = async (userId: string, input: RecordGenerationHistoryInput) => {
  const app = await getTaleAppClient()
  const taskType = await getTaskType(app)
  const attachmentTypes = await ensureAttachmentTypes(app, taskType.typeId)

  const taskInput: HistoryInputPayload = {
    app: 'banana-shop',
    transformationKey: input.transformationKey,
    transformationTitle: input.transformationTitle,
    prompt: input.prompt,
    providerProfileKey: input.providerProfileKey,
    kind: input.kind,
    aspectRatio: input.inputs?.aspectRatio,
    hasPrimaryImage: Boolean(input.inputs?.primaryImageUrl),
    hasReferenceImage: Boolean(input.inputs?.referenceImageUrl),
    hasMaskImage: Boolean(input.inputs?.maskImageUrl),
    schemaVersion: 1,
  }

  const task = await app.tasks.create({
    userId,
    taskTitle: input.transformationTitle || TASK_TYPE_NAME,
    taskType: taskType.typeName,
    taskStatus: 'running',
    taskInput,
    taskOutput: {
      schemaVersion: 1,
    },
    remark: 'Banana Shop generation history task.',
  })

  try {
    const uploadedAttachments = await Promise.all([
      uploadHistoryAttachment(app, task.taskId, attachmentTypes, 'input', input.inputs?.primaryImageUrl),
      uploadHistoryAttachment(
        app,
        task.taskId,
        attachmentTypes,
        'reference',
        input.inputs?.referenceImageUrl
      ),
      uploadHistoryAttachment(app, task.taskId, attachmentTypes, 'mask', input.inputs?.maskImageUrl),
      uploadHistoryAttachment(
        app,
        task.taskId,
        attachmentTypes,
        'intermediate',
        input.outputs.secondaryImageUrl
      ),
      uploadHistoryAttachment(app, task.taskId, attachmentTypes, 'output', input.outputs.imageUrl),
      uploadHistoryAttachment(app, task.taskId, attachmentTypes, 'video', input.outputs.videoUrl),
    ])

    const attachmentIds: Partial<Record<GenerationHistoryAttachmentRole, string>> = {}
    uploadedAttachments.forEach((attachment) => {
      if (!attachment?.remark) return
      const role = attachment.remark as GenerationHistoryAttachmentRole
      attachmentIds[role] = attachment.attachmentId
    })

    const resultType = input.outputs.videoUrl ? 'video' : input.outputs.imageUrl ? 'image' : 'text'
    const taskOutput: HistoryOutputPayload & { text?: string | null } = {
      resultType,
      imageGenerated: Boolean(input.outputs.imageUrl),
      videoGenerated: Boolean(input.outputs.videoUrl),
      textGenerated: Boolean(input.outputs.text),
      attachmentIds,
      schemaVersion: 1,
      text: input.outputs.text ?? null,
    }

    await app.tasks.updateOutput(task.taskId, taskOutput)
    await app.tasks.updateStatus(task.taskId, { taskStatus: 'completed' })
  } catch (error) {
    try {
      await app.tasks.updateStatus(task.taskId, { taskStatus: 'failed' })
    } catch (statusError) {
      console.error('Failed to mark history task as failed:', statusError)
    }
    throw error
  }

  return {
    taskId: task.taskId,
    createdAt: task.createdAt,
  }
}

export const listGenerationHistory = async (userId: string) => {
  const app = await getTaleAppClient()
  const taskType = await getTaskType(app)
  const attachmentTypePage = await app.attachmentTypes.listByRef({
    refType: 'task',
    refTypeId: taskType.typeId,
    page: 0,
    size: 100,
  })
  const attachmentTypesById = new Map(
    attachmentTypePage.content.map((attachmentType) => [attachmentType.typeId, attachmentType])
  )

  const tasks = await app.tasks.list({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
    userIds: userId,
    taskType: taskType.typeName,
    includeAttachments: true,
  })

  return await Promise.all(
    tasks.content.map((task) => normalizeHistoryItem(app, task, attachmentTypesById))
  )
}

export const getHistoryAttachmentDownloadUrl = async (attachmentId: string, taskId: string) => {
  const app = await getTaleAppClient()
  const result = await app.attachments.getDownloadUrl({
    attachmentId,
    refType: 'task',
    refId: taskId,
    expiresInSeconds: 3600,
  })
  return result.downloadUrl
}
