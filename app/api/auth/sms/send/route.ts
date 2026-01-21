import { NextResponse } from 'next/server'
import { sendSmsCode } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: '手机号码不能为空' }, { status: 400 })
    }

    const result = await sendSmsCode(phone)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Send SMS error:', error)
    return NextResponse.json({ error: error?.message || '发送验证码失败' }, { status: 401 })
  }
}
