import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'

import { ApiAuthError, authenticateApiKey } from '@/lib/api-auth'
import type { ApiKeyScope } from '@/lib/api-keys'
import { optionalTrimmedString } from '@/lib/api-request'
import { toUserFacingProviderError } from '@/lib/ai/providers/errors'
import { dataUrlFromBase64, recordGenerationHistorySafely } from '@/lib/generation-history-service'
import { editImage, generateImage, generateVideo } from '@/lib/generation-service'
import { listGenerationHistory } from '@/lib/tale-history'
import type { GeneratedContent } from '@/types'

const server = new McpServer({
  name: 'banana-shop',
  version: '0.6.0',
})

const imageContentSchema = {
  imageUrl: z.string().nullable(),
  text: z.string().nullable(),
  secondaryImageUrl: z.string().nullable().optional(),
  historyTaskId: z.string().optional(),
  historyStatus: z.enum(['local', 'syncing', 'synced', 'sync_failed']).optional(),
  historyError: z.string().optional(),
  createdAt: z.string().optional(),
  transformationTitle: z.string().optional(),
  prompt: z.string().optional(),
  kind: z.string().optional(),
  source: z.enum(['dashboard', 'api', 'mcp']).optional(),
}

const videoContentSchema = {
  videoUrl: z.string(),
  imageUrl: z.string().nullable(),
  text: z.string().nullable(),
  secondaryImageUrl: z.string().nullable().optional(),
  historyTaskId: z.string().optional(),
  historyStatus: z.enum(['local', 'syncing', 'synced', 'sync_failed']).optional(),
  historyError: z.string().optional(),
  createdAt: z.string().optional(),
  transformationTitle: z.string().optional(),
  prompt: z.string().optional(),
  kind: z.string().optional(),
  source: z.enum(['dashboard', 'api', 'mcp']).optional(),
}

const secondaryImageSchema = z
  .object({
    base64: z.string().min(1).describe('Base64 image data without a data URL prefix.'),
    mimeType: z.string().min(1).describe('Image MIME type, for example image/png.'),
  })
  .nullable()
  .optional()

const getApiKeyFromRuntime = () => {
  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg.startsWith('--api-key=')) return arg.slice('--api-key='.length)
    if (arg === '--api-key') return args[index + 1]
  }

  return process.env.BANANA_SHOP_API_KEY || process.env.BANANA_API_KEY
}

const configuredApiKey = getApiKeyFromRuntime()

const ensureScope = async (scope: ApiKeyScope) => authenticateApiKey(configuredApiKey, scope)

const toJsonText = (value: unknown) => JSON.stringify(value, null, 2)

const toStructuredContent = (value: unknown) => value as Record<string, unknown>

const parseDataUrl = (value: string | null | undefined) => {
  if (!value?.startsWith('data:')) return null
  const match = value.match(/^data:([^;,]+)?;base64,(.*)$/)
  if (!match) return null

  return {
    mimeType: match[1] || 'image/png',
    base64: match[2] || '',
  }
}

const contentForResult = (result: unknown) => {
  const content: { type: 'text'; text: string }[] = [{ type: 'text', text: toJsonText(result) }]
  return content
}

const imageResponseForResult = (result: GeneratedContent) => {
  const content: (
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
  )[] = contentForResult(result)
  const image = parseDataUrl(result.imageUrl)
  if (image) {
    content.push({ type: 'image', data: image.base64, mimeType: image.mimeType })
  }

  return {
    content,
    structuredContent: toStructuredContent(result),
  }
}

const toolError = (error: unknown, fallback: string) => ({
  content: [
    {
      type: 'text' as const,
      text:
        error instanceof ApiAuthError ? error.message : toUserFacingProviderError(error, fallback),
    },
  ],
  isError: true,
})

server.registerTool(
  'banana_generate_image',
  {
    title: 'Banana Generate Image',
    description: 'Generate an image from a text prompt using Banana Shop.',
    inputSchema: {
      prompt: z.string().min(1).describe('Text prompt for image generation.'),
      transformationKey: z
        .string()
        .min(1)
        .describe('Banana Shop transformation key, for example glmImage.'),
      transformationTitle: z
        .string()
        .optional()
        .describe('Optional human-readable title stored in history.'),
      profileKey: z.string().optional().describe('Optional provider profile key.'),
      recordHistory: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to write the generation result to Tale history.'),
    },
    outputSchema: imageContentSchema,
  },
  async ({ prompt, transformationKey, transformationTitle, profileKey, recordHistory }) => {
    try {
      const auth = await ensureScope('image:generate')
      const normalizedProfileKey = optionalTrimmedString(profileKey)
      const result = await generateImage({
        prompt,
        transformationKey,
        profileKey: normalizedProfileKey,
      })
      const data =
        recordHistory === false
          ? result
          : await recordGenerationHistorySafely(
              auth.userId,
              result,
              {
                transformationKey,
                transformationTitle: transformationTitle || transformationKey,
                prompt,
                providerProfileKey: normalizedProfileKey,
                kind: 'text-to-image',
                source: 'mcp',
                outputs: {
                  imageUrl: result.imageUrl,
                  text: result.text,
                },
              },
              'MCP history sync error'
            )

      return imageResponseForResult(data)
    } catch (error) {
      return toolError(error, '图像生成失败，请稍后重试')
    }
  }
)

server.registerTool(
  'banana_edit_image',
  {
    title: 'Banana Edit Image',
    description: 'Edit an image with an instruction prompt using Banana Shop.',
    inputSchema: {
      base64ImageData: z
        .string()
        .min(1)
        .describe('Primary image base64 data without a data URL prefix.'),
      mimeType: z.string().min(1).describe('Primary image MIME type, for example image/png.'),
      prompt: z.string().min(1).describe('Instruction prompt for image editing.'),
      maskBase64: z
        .string()
        .nullable()
        .optional()
        .describe('Optional mask image base64 data without a data URL prefix.'),
      maskMimeType: z
        .string()
        .optional()
        .describe('Optional mask image MIME type. Defaults to image/png for history storage.'),
      secondaryImage: secondaryImageSchema.describe('Optional reference image.'),
      transformationKey: z
        .string()
        .optional()
        .describe('Optional history transformation key. Defaults to image-edit.'),
      transformationTitle: z
        .string()
        .optional()
        .describe('Optional human-readable title stored in history.'),
      profileKey: z.string().optional().describe('Optional image edit provider profile key.'),
      recordHistory: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to write the edit result to Tale history.'),
    },
    outputSchema: imageContentSchema,
  },
  async ({
    base64ImageData,
    mimeType,
    prompt,
    maskBase64,
    maskMimeType,
    secondaryImage,
    transformationKey,
    transformationTitle,
    profileKey,
    recordHistory,
  }) => {
    try {
      const auth = await ensureScope('image:edit')
      const parsedSecondaryImage = secondaryImage ?? null
      const result = await editImage(
        base64ImageData,
        mimeType,
        prompt,
        maskBase64 || null,
        parsedSecondaryImage,
        optionalTrimmedString(profileKey)
      )
      const historyTransformationKey = transformationKey || 'image-edit'
      const data =
        recordHistory === false
          ? result
          : await recordGenerationHistorySafely(
              auth.userId,
              result,
              {
                transformationKey: historyTransformationKey,
                transformationTitle: transformationTitle || historyTransformationKey,
                prompt,
                providerProfileKey: optionalTrimmedString(profileKey),
                kind: parsedSecondaryImage ? 'multi-image-edit' : 'image-edit',
                source: 'mcp',
                inputs: {
                  primaryImageUrl: dataUrlFromBase64(mimeType, base64ImageData),
                  referenceImageUrl: parsedSecondaryImage
                    ? dataUrlFromBase64(parsedSecondaryImage.mimeType, parsedSecondaryImage.base64)
                    : null,
                  maskImageUrl: maskBase64
                    ? dataUrlFromBase64(maskMimeType || 'image/png', maskBase64)
                    : null,
                },
                outputs: {
                  imageUrl: result.imageUrl,
                  text: result.text,
                },
              },
              'MCP history sync error'
            )

      return imageResponseForResult(data)
    } catch (error) {
      return toolError(error, '图像编辑失败，请稍后重试')
    }
  }
)

server.registerTool(
  'banana_generate_video',
  {
    title: 'Banana Generate Video',
    description: 'Generate a video from a text prompt using Banana Shop.',
    inputSchema: {
      prompt: z.string().min(1).describe('Text prompt for video generation.'),
      aspectRatio: z.enum(['16:9', '9:16']).optional().describe('Optional video aspect ratio.'),
      transformationKey: z
        .string()
        .optional()
        .describe('Optional history transformation key. Defaults to text-to-video.'),
      transformationTitle: z
        .string()
        .optional()
        .describe('Optional human-readable title stored in history.'),
      recordHistory: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to write the generation result to Tale history.'),
    },
    outputSchema: videoContentSchema,
  },
  async ({ prompt, aspectRatio, transformationKey, transformationTitle, recordHistory }) => {
    try {
      const auth = await ensureScope('video:generate')
      const result = await generateVideo(prompt, aspectRatio)
      const historyTransformationKey = transformationKey || 'text-to-video'
      const data =
        recordHistory === false
          ? result
          : await recordGenerationHistorySafely(
              auth.userId,
              result,
              {
                transformationKey: historyTransformationKey,
                transformationTitle: transformationTitle || historyTransformationKey,
                prompt,
                kind: 'video',
                source: 'mcp',
                inputs: {
                  aspectRatio,
                },
                outputs: {
                  videoUrl: result.videoUrl,
                  text: result.text,
                },
              },
              'MCP history sync error'
            )

      return {
        content: contentForResult(data),
        structuredContent: toStructuredContent(data),
      }
    } catch (error) {
      return toolError(error, '视频生成失败，请稍后重试')
    }
  }
)

server.registerTool(
  'banana_list_history',
  {
    title: 'Banana List History',
    description: 'List generation history for the Banana Shop user that owns the API key.',
    inputSchema: {
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Optional max item count. The underlying service currently returns up to 20.'),
    },
    outputSchema: {
      items: z.array(z.unknown()),
    },
  },
  async ({ limit }) => {
    try {
      const auth = await ensureScope('history:read')
      const items = await listGenerationHistory(auth.userId)
      const data = { items: typeof limit === 'number' ? items.slice(0, limit) : items }

      return {
        content: contentForResult(data),
        structuredContent: toStructuredContent(data),
      }
    } catch (error) {
      return toolError(error, '获取历史记录失败')
    }
  }
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error('Banana Shop MCP server failed:', error)
  process.exit(1)
})
