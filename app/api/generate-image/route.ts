import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Only use GLM API key for GLM image generation
  const apiKey = process.env.GLM_API_KEY

  if (!apiKey) {
    console.error('GLM_API_KEY is not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
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
      // Don't expose detailed error messages to client
      return NextResponse.json(
        { error: 'Failed to generate image. Please try again.' },
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
  } catch (error) {
    console.error('Error calling GLM API:', error)
    // Don't expose detailed error messages to client for security
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}
