import { NextResponse } from 'next/server'
import { verifySmsLogin } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { smsId, smsType, verificationCode } = body

    if (!smsId || !smsType || !verificationCode) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 })
    }

    const result = await verifySmsLogin(smsId, smsType, verificationCode)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Verify SMS error:', error)
    return NextResponse.json({ error: error?.message || '验证码验证失败' }, { status: 401 })
  }
}
