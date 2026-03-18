import { NextResponse } from 'next/server'
import { analyzeImage, editImageWithInstruction } from '@/lib/volcengine'

type EditImageRequest = {
  base64ImageData?: string
  mimeType?: string
  prompt?: string
  maskBase64?: string | null
  secondaryImage?: { base64: string; mimeType: string } | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EditImageRequest
    const { base64ImageData, mimeType, prompt, maskBase64, secondaryImage } = body

    if (!base64ImageData || !mimeType || !prompt) {
      return NextResponse.json({ success: false, error: '参数不完整' }, { status: 400 })
    }

    let enhancedPrompt = prompt
    if (secondaryImage) {
      const analysisResult = await analyzeImage(
        secondaryImage.base64,
        secondaryImage.mimeType,
        'Analyze this image and describe its style, colors, composition, and key visual elements. Focus on details that would be important for applying the same style to another image.'
      )

      if (analysisResult.text) {
        enhancedPrompt = `${prompt}\n\nReference style to apply: ${analysisResult.text}`
      }
    }

    if (maskBase64) {
      enhancedPrompt = `${prompt} Focus on transforming the main subject while preserving the overall composition.`
    }

    const result = await editImageWithInstruction(base64ImageData, mimeType, enhancedPrompt)

    return NextResponse.json({
      success: true,
      data: { imageUrl: result.imageUrl, text: null },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '图像编辑失败，请稍后重试'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
