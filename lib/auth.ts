'use server'

import { cookies } from 'next/headers'
import { login, loginWithSms, verifySmsCode, type LoginResponse } from 'tale-js-sdk'

const COOKIE_NAME = 'auth_token'
const COOKIE_USER = 'auth_user'

/**
 * Authentication service using tale-js-sdk
 */

/**
 * Login with username and password
 */
export async function loginWithPassword(
  username: string,
  password: string
): Promise<LoginResponse> {
  const result = await login({ username, password })

  // Store token and user info in cookies
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, result.token.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(result.token.expired_at),
    path: '/',
  })

  cookieStore.set(COOKIE_USER, JSON.stringify(result.user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(result.token.expired_at),
    path: '/',
  })

  return result
}

/**
 * Initiate SMS login by sending verification code
 */
export async function sendSmsCode(phone: string) {
  return await loginWithSms(phone)
}

/**
 * Verify SMS code and complete login
 */
export async function verifySmsLogin(
  smsId: string,
  smsType: 'login' | 'register',
  verificationCode: string
): Promise<LoginResponse> {
  const result = await verifySmsCode({
    sms_id: smsId,
    sms_type: smsType,
    verification_code: verificationCode,
  })

  // Store token and user info in cookies
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, result.token.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(result.token.expired_at),
    path: '/',
  })

  cookieStore.set(COOKIE_USER, JSON.stringify(result.user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(result.token.expired_at),
    path: '/',
  })

  return result
}

/**
 * Logout user by clearing cookies
 */
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete(COOKIE_USER)
}

/**
 * Get current authenticated user from cookies
 */
export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const userJson = cookieStore.get(COOKIE_USER)?.value

  if (!token || !userJson) {
    return null
  }

  try {
    return JSON.parse(userJson)
  } catch {
    return null
  }
}

/**
 * Get auth token from cookies
 */
export async function getToken() {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return !!token
}
