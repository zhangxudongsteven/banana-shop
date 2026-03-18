import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

// Validate required environment variables at startup
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is not set.')
}

// Validate and set the image model
const VALID_IMAGE_MODELS = ['gpt-4o', 'gpt-4-vision-preview', 'gpt-4o-mini'] as const
type ValidImageModel = (typeof VALID_IMAGE_MODELS)[number]

function isValidImageModel(model: string): model is ValidImageModel {
  return VALID_IMAGE_MODELS.includes(model as ValidImageModel)
}

const imageModel =
  process.env.IMAGE_MODEL && isValidImageModel(process.env.IMAGE_MODEL)
    ? process.env.IMAGE_MODEL
    : 'gpt-4o'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
})

// Helper to convert base64 to File-like object
async function base64ToFile(base64Data: string, filename: string, mimeType: string) {
  const buffer = Buffer.from(base64Data, 'base64')
  return await toFile(buffer as any, filename, { type: mimeType })
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { base64ImageData, mimeType, prompt, maskBase64, secondaryImage } = body

    if (!base64ImageData || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Scenario 1: Image Editing with Mask (DALL-E 2)
    if (maskBase64) {
      const imageFile = await base64ToFile(base64ImageData, 'image.png', mimeType)
      const maskFile = await base64ToFile(maskBase64, 'mask.png', 'image/png')

      const response = await openai.images.edit({
        image: imageFile,
        mask: maskFile,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      })

      const b64Json = response.data?.[0]?.b64_json
      if (b64Json) {
        return NextResponse.json({
          imageUrl: `data:image/png;base64,${b64Json}`,
          text: null,
        })
      } else {
        throw new Error('Failed to generate image.')
      }
    }

    // Scenario 2: Vision / Chat with Image (GPT-4o)
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64ImageData}`,
            },
          },
        ],
      },
    ]

    if (secondaryImage) {
      ;(messages[0].content as any[]).push({
        type: 'image_url',
        image_url: {
          url: `data:${secondaryImage.mimeType};base64,${secondaryImage.base64}`,
        },
      })
    }

    const completion = await openai.chat.completions.create({
      model: imageModel,
      messages: messages,
    })

    const textResponse = completion.choices[0].message.content

    return NextResponse.json({
      imageUrl: null,
      text: textResponse,
    })
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    // Don't expose detailed error messages to client for security
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
