'use client'

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, MessageSquare, User, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/AuthProvider'

type LoginMethod = 'password' | 'sms'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [showSmsVerify, setShowSmsVerify] = useState(false)

  // Get redirect URL from search params
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  // Password login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // SMS login state
  const [phone, setPhone] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [smsId, setSmsId] = useState('')
  const [smsType, setSmsType] = useState<'login' | 'register'>('login')
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for SMS
  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      toast.success(`欢迎回来，${data.user.username}！`)
      await refresh()
      router.push(redirectTo)
    } catch (error: any) {
      toast.error(error?.message || '登录失败，请检查用户名和密码')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendSms = async () => {
    if (!phone) {
      toast.error('请输入手机号码')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '发送验证码失败')
      }

      setSmsId(data.sms_id)
      setSmsType(data.type)
      setShowSmsVerify(true)
      startCountdown()
      toast.success('验证码已发送')
    } catch (error: any) {
      toast.error(error?.message || '发送验证码失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSmsVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsId, smsType, verificationCode: smsCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '验证码错误')
      }

      toast.success(`登录成功，欢迎！`)
      await refresh()
      router.push(redirectTo)
    } catch (error: any) {
      toast.error(error?.message || '验证码错误')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSmsForm = () => {
    setShowSmsVerify(false)
    setPhone('')
    setSmsCode('')
    setSmsId('')
  }

  const switchLoginMethod = (method: LoginMethod) => {
    setLoginMethod(method)
    resetSmsForm()
    setUsername('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/home" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
            <span className="text-2xl">🍌</span>
          </div>
          <span className="font-bold text-2xl">Banana Shop</span>
        </Link>

        {/* Login Card */}
        <Card className="p-8 bg-card/50 backdrop-blur border-border/50">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">欢迎回来</h1>
            <p className="text-muted-foreground">选择登录方式以访问 AI 图片编辑功能</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6 bg-muted/50 p-1 rounded-lg">
            <Button
              type="button"
              variant={loginMethod === 'password' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => switchLoginMethod('password')}
              className="flex-1"
            >
              <User className="h-4 w-4 mr-2" />
              账号密码
            </Button>
            <Button
              type="button"
              variant={loginMethod === 'sms' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => switchLoginMethod('sms')}
              className="flex-1"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              短信验证码
            </Button>
          </div>

          {/* Password Login Form */}
          {loginMethod === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-10"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!username || !password || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      登录
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* SMS Login Form - Phone Input */}
          {loginMethod === 'sms' && !showSmsVerify && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  手机号码 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+8613800138000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">输入手机号码以接收验证码</p>
              </div>

              <div className="pt-4">
                <Button
                  type="button"
                  onClick={handleSendSms}
                  className="w-full"
                  size="lg"
                  disabled={!phone || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      发送验证码
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* SMS Login Form - Code Verification */}
          {loginMethod === 'sms' && showSmsVerify && (
            <form onSubmit={handleSmsVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="smsCode" className="text-sm font-medium">
                  验证码 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="smsCode"
                  type="text"
                  placeholder="请输入6位验证码"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  required
                  className="h-10"
                  maxLength={6}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">验证码已发送至 {phone}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSmsForm}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendSms}
                  disabled={isSubmitting || countdown > 0}
                  className="flex-1"
                >
                  {countdown > 0 ? `重新发送 (${countdown}s)` : '重新发送'}
                </Button>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!smsCode || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  '验证登录'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            还没有账户？{' '}
            <button
              type="button"
              onClick={() => toast.info('系统暂不开放注册，请联系管理员开通账户')}
              className="text-orange-400 hover:text-orange-300 font-medium cursor-pointer underline-offset-4 hover:underline"
            >
              立即注册
            </button>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/home" className="text-sm text-muted-foreground hover:text-foreground">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-950/20 flex items-center justify-center">
          加载中...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
