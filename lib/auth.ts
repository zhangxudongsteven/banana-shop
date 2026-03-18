'use server'

import { cookies } from 'next/headers'
import {
  login,
  loginWithSms,
  verifySmsCode,
  type LoginResponse,
  type AuthUser,
} from '@turinhub/tale-js-sdk'

const COOKIE_NAME = 'auth_token'
const COOKIE_USER = 'auth_user'

// Cookie security settings
// Using 'lax' for sameSite to allow top-level navigation while preventing CSRF attacks
// 'lax' allows cookies to be sent on navigations from external links (user-friendly)
// but blocks cookies in cross-site POST requests (security)
const getCookieOptions = (expiresAt: string) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  expires: new Date(expiresAt),
  path: '/',
})

// Result types for server actions
export type AuthResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Authentication service using @turinhub/tale-js-sdk
 * All functions are server actions that can be called from client components
 */

/**
 * Login with username and password
 * Server action that can be called directly from client components
 */
export async function loginWithPassword(
  username: string,
  password: string
): Promise<AuthResult<LoginResponse>> {
  try {
    if (!username || !password) {
      return { success: false, error: '用户名和密码不能为空' }
    }

    const result = await login({ username, password })

    // Store token and user info in cookies
    const cookieStore = await cookies()
    const cookieOptions = getCookieOptions(result.token.expired_at)

    cookieStore.set(COOKIE_NAME, result.token.token, cookieOptions)
    cookieStore.set(COOKIE_USER, JSON.stringify(result.user), cookieOptions)

    return { success: true, data: result }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: '登录失败，请检查用户名和密码' }
  }
}

/**
 * Initiate SMS login by sending verification code
 * Server action that can be called directly from client components
 */
export async function sendSmsCode(
  phone: string
): Promise<AuthResult<{ sms_id: string; type: 'login' | 'register' }>> {
  try {
    if (!phone) {
      return { success: false, error: '手机号码不能为空' }
    }

    const result = await loginWithSms(phone)
    return { success: true, data: result }
  } catch (error) {
    console.error('Send SMS error:', error)
    return { success: false, error: '发送验证码失败，请稍后重试' }
  }
}

/**
 * Verify SMS code and complete login
 * Server action that can be called directly from client components
 */
export async function verifySmsLogin(
  smsId: string,
  smsType: 'login' | 'register',
  verificationCode: string
): Promise<AuthResult<LoginResponse>> {
  try {
    if (!smsId || !smsType || !verificationCode) {
      return { success: false, error: '参数不完整' }
    }

    const result = await verifySmsCode({
      sms_id: smsId,
      sms_type: smsType,
      verification_code: verificationCode,
    })

    // Store token and user info in cookies
    const cookieStore = await cookies()
    const cookieOptions = getCookieOptions(result.token.expired_at)

    cookieStore.set(COOKIE_NAME, result.token.token, cookieOptions)
    cookieStore.set(COOKIE_USER, JSON.stringify(result.user), cookieOptions)

    return { success: true, data: result }
  } catch (error) {
    console.error('Verify SMS error:', error)
    return { success: false, error: '验证码验证失败，请检查后重试' }
  }
}

/**
 * Logout user by clearing cookies
 * Server action that can be called directly from client components
 */
export async function logoutUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
    cookieStore.delete(COOKIE_USER)
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: '退出登录失败' }
  }
}

/**
 * Get current authenticated user from cookies
 * Server action that can be called directly from client components
 */
export async function getCurrentUser(): Promise<AuthResult<AuthUser>> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    const userJson = cookieStore.get(COOKIE_USER)?.value

    if (!token || !userJson) {
      return { success: false, error: '未登录' }
    }

    const user = JSON.parse(userJson)
    return { success: true, data: user }
  } catch (error) {
    console.error('Get current user error:', error)
    return { success: false, error: '获取用户信息失败' }
  }
}

/**
 * Get auth token from cookies
 * Internal helper function
 */
export async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

/**
 * Check if user is authenticated
 * Internal helper function
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return !!token
}
