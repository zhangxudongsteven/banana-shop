import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

if (!process.env.OPENAI_API_KEY) {
  // We can't really throw here as it might crash the server startup if env is missing in some envs
  // Better to check in handler
  console.error('OPENAI_API_KEY environment variable is not set.')
}

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
    return NextResponse.json(
      { error: 'Server configuration error: Missing API Key' },
      { status: 500 }
    )
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
      model: process.env.IMAGE_MODEL || 'gpt-4o',
      messages: messages,
    })

    const textResponse = completion.choices[0].message.content

    return NextResponse.json({
      imageUrl: null,
      text: textResponse,
    })
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error)
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 })
  }
}
