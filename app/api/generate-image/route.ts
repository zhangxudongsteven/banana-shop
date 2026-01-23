import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GLM_API_KEY || process.env.OPENAI_API_KEY // Fallback or distinct

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: Missing API Key' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { prompt, model, size } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'glm-image',
        prompt: prompt,
        size: size || '1024x1024', // Default size if not provided
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('GLM API Error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || `GLM API Error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    // GLM response format: { created: ..., data: [{ url: "..." }] }

    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      throw new Error('Failed to generate image: No URL in response')
    }

    return NextResponse.json({
      imageUrl: imageUrl,
      text: null,
    })
  } catch (error: any) {
    console.error('Error calling GLM API:', error)
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 })
  }
}
