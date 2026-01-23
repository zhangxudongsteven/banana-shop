# Banana Shop - 认证配置指南

## 概述

Banana Shop 已集成完整的用户认证系统，支持以下登录方式：

- 账号密码登录
- 短信验证码登录

认证系统使用 `tale-js-sdk` (v1.1.0) 实现。

## 环境配置

### 1. 复制环境变量文件

```bash
cp .env.example .env.local
```

### 2. 配置 Tale 认证服务

在 `.env.local` 文件中配置以下参数：

```env
# Tale Authentication Configuration (tale-js-sdk v1.1.0)
# Get your credentials from your Tale admin panel
TALE_BASE_URL=https://your-tale-api-url.com
TALE_APP_KEY=your_app_key_here
TALE_APP_SECRET=your_app_secret_here
```

**参数说明：**

- `TALE_BASE_URL`: Tale API 服务地址
- `TALE_APP_KEY`: 应用密钥
- `TALE_APP_SECRET`: 应用密钥

**获取凭证：**

1. 访问你的 Tale 管理面板
2. 创建新应用或使用现有应用
3. 获取 App Key 和 App Secret
4. 记录 API Base URL

## 项目结构

```
banana-shop/
├── lib/
│   └── auth.ts                    # 认证服务（服务器端）
├── components/
│   └── AuthProvider.tsx           # 认证上下文提供者
├── app/
│   ├── login/
│   │   └── page.tsx              # 登录页面
│   └── api/auth/
│       ├── me/route.ts           # 获取当前用户
│       ├── login/route.ts        # 密码登录
│       ├── logout/route.ts       # 登出
│       └── sms/
│           ├── send/route.ts     # 发送短信验证码
│           └── verify/route.ts   # 验证短信验证码
```

## 使用方式

### 在客户端使用认证上下文

```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'

export default function MyComponent() {
  const { user, isLoading, isAuthenticated, refresh } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <div>Please login</div>
  }

  return <div>Welcome, {user?.username}!</div>
}
```

### 服务器端获取当前用户

```ts
import { getCurrentUser } from '@/lib/auth'

const user = await getCurrentUser()
if (user) {
  console.log('Current user:', user.username)
}
```

### 检查用户是否已认证

```ts
import { isAuthenticated } from '@/lib/auth'

const isAuth = await isAuthenticated()
```

### 登出用户

```ts
import { logout } from '@/lib/auth'

await logout()
```

## API 路由

### POST /api/auth/login

账号密码登录

**请求体：**

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**响应：**

```json
{
  "user": {
    "id": "123",
    "username": "user@example.com"
  },
  "token": {
    "token": "jwt_token_here",
    "expired_at": "2026-01-22T12:00:00Z"
  }
}
```

### POST /api/auth/sms/send

发送短信验证码

**请求体：**

```json
{
  "phone": "+8613800138000"
}
```

**响应：**

```json
{
  "sms_id": "sms_123",
  "type": "login"
}
```

### POST /api/auth/sms/verify

验证短信验证码并登录

**请求体：**

```json
{
  "smsId": "sms_123",
  "smsType": "login",
  "verificationCode": "123456"
}
```

### GET /api/auth/me

获取当前登录用户信息

**响应：**

```json
{
  "user": {
    "id": "123",
    "username": "user@example.com"
  }
}
```

### POST /api/auth/logout

登出当前用户

**响应：**

```json
{
  "success": true
}
```

## Cookie 配置

认证系统使用 httpOnly cookie 存储令牌和用户信息：

- `auth_token`: JWT 认证令牌
- `auth_user`: 用户信息 JSON

**Cookie 安全设置：**

- `httpOnly`: true（防止 XSS 攻击）
- `secure`: 生产环境为 true（仅 HTTPS）
- `sameSite`: 'lax'（防止 CSRF 攻击）
- `expires`: 与令牌过期时间一致

## 页面路由

- `/home` - 首页
- `/login` - 登录页
- `/dashboard` - 编辑器（需要登录）
- `/api/auth/*` - 认证 API

## 开发建议

### 保护需要认证的页面

在需要认证的页面组件中检查 `isAuthenticated` 状态：

```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <div>Protected Content</div>
}
```

### 显示登录/登出按钮

```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

export default function Nav() {
  const { isAuthenticated, user } = useAuth()

  return (
    <nav>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user?.username}</span>
          <LogoutButton />
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </nav>
  )
}
```

## 依赖

- `tale-js-sdk`: v1.1.0 - Tale 认证 SDK
- `sonner`: v2.0.7 - Toast 通知库

## 故障排查

### 登录失败

1. 检查 `.env.local` 中的 Tale 凭证是否正确
2. 确认 `TALE_BASE_URL` 可访问
3. 查看浏览器控制台和网络请求的错误信息

### Cookie 未设置

1. 检查浏览器是否允许 Cookie
2. 确认使用的是 http 或 https（生产环境）
3. 检查 Cookie 域名设置

### 用户状态不更新

调用 `refresh()` 方法手动刷新用户状态：

```tsx
const { refresh } = useAuth()
await refresh()
```

## 更多信息

参考 [tale-js-sdk 文档](https://www.npmjs.com/package/tale-js-sdk) 了解更多认证 API 详情。
