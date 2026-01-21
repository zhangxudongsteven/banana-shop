import { NextResponse } from 'next/server'
import { loginWithPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const result = await loginWithPassword(username, password)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error?.message || '登录失败' }, { status: 401 })
  }
}
