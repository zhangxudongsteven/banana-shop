# Banana Shop - 路由保护配置

## 概述

Banana Shop 使用 Next.js 16 的 **Proxy** 功能来保护需要认证的路由。Proxy 在页面渲染之前拦截请求，提供服务器级别的路由保护。

## 架构

### 双层保护机制

```
┌─────────────────────────────────────────┐
│         Next.js Proxy (服务器端)         │
│  - 检查 Cookie 中的 auth_token          │
│  - 重定向未认证用户到 /login             │
│  - 拦截所有受保护的路由                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     客户端认证检查 (AuthProvider)        │
│  - 提供全局认证状态                      │
│  - 客户端路由保护                        │
│  - 用户信息管理                          │
└─────────────────────────────────────────┘
```

## Proxy 配置

### 文件位置

`proxy.ts` (项目根目录)

### 保护的路由

当前受保护的路由：

- `/editor` - 编辑器页面
- `/editor/*` - 编辑器的所有子路由

### 公开路由

- `/` - 首页（重定向到 /home）
- `/home` - 首页
- `/login` - 登录页

## 工作流程

### 1. 未认证用户访问受保护路由

```
用户访问 /editor
    ↓
Proxy 检查 auth_token Cookie
    ↓
Token 不存在
    ↓
重定向到 /login?redirect=/editor
    ↓
用户登录后返回原页面
```

### 2. 已认证用户访问受保护路由

```
用户访问 /editor
    ↓
Proxy 检查 auth_token Cookie
    ↓
Token 存在
    ↓
允许访问 /editor
```

### 3. 已认证用户访问登录页

```
用户访问 /login
    ↓
Proxy 检查 auth_token Cookie
    ↓
Token 存在
    ↓
重定向到 /editor
```

## 配置修改

### 添加新的受保护路由

编辑 `proxy.ts` 文件：

```typescript
// 定义受保护的路由
const protectedRoutes = ['/editor', '/dashboard', '/settings']

// 检查当前路径是否是受保护路由
const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
```

### 添加新的公开路由

公开路由不需要在 proxy 中配置，只需确保它们不在 `protectedRoutes` 数组中。

### 添加认证路由

编辑 `proxy.ts` 文件：

```typescript
// 定义认证路由（已登录用户访问时重定向）
const authRoutes = ['/login', '/register']

// 检查当前路径是否是认证路由
const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
```

## 客户端保护

### 在组件中使用 AuthProvider

```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function MyProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/my-protected-page')
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

### 条件渲染

```tsx
'use client'

import { useAuth } from '@/components/AuthProvider'

export default function MyComponent() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <div>Please login to view this content</div>
  }

  return (
    <div>
      Welcome, {user?.username}!{/* 受保护的内容 */}
    </div>
  )
}
```

## 重定向机制

### 登录后返回原页面

当用户访问受保护路由时被重定向到登录页，登录成功后会自动返回到原页面。

**实现方式：**

1. **Proxy 添加重定向参数**

```typescript
if (isProtectedRoute && !authToken) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}
```

2. **登录页面读取重定向参数**

```tsx
const searchParams = useSearchParams()
const redirectTo = searchParams.get('redirect') || '/editor'

// 登录成功后
router.push(redirectTo)
```

## Cookie 配置

认证 Cookie 由服务器设置，具有以下安全特性：

```typescript
cookieStore.set('auth_token', token, {
  httpOnly: true, // 防止 XSS 攻击
  secure: process.env.NODE_ENV === 'production', // 仅 HTTPS
  sameSite: 'lax', // 防止 CSRF 攻击
  expires: new Date(expired_at),
  path: '/',
})
```

## 排除规则

Proxy 不会处理以下路径：

```typescript
filter: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
```

排除的路径：

- `_next/static` - 静态资源
- `_next/image` - 图片优化
- `favicon.ico` - 网站图标
- 静态文件（svg, png, jpg, jpeg, gif, webp）

## 调试

### 检查 Proxy 是否正常工作

1. **查看浏览器网络请求**
   - 打开开发者工具 → Network
   - 访问受保护路由
   - 查看 302 重定向响应

2. **检查 Cookie**
   - 打开开发者工具 → Application → Cookies
   - 确认 `auth_token` Cookie 存在

3. **测试不同场景**
   - 未登录访问 `/editor` → 应重定向到 `/login?redirect=/editor`
   - 已登录访问 `/editor` → 应正常显示
   - 已登录访问 `/login` → 应重定向到 `/editor`

### 常见问题

**Q: 为什么 Proxy 不生效？**

A: 检查以下几点：

1. 确认 `proxy.ts` 文件在项目根目录
2. 确认 `filter` 配置正确
3. 清除 `.next` 缓存后重新构建

**Q: 为什么登录后还是被重定向？**

A: 可能的原因：

1. Cookie 未正确设置（检查 Cookie 配置）
2. Token 已过期（重新登录）
3. CORS 问题（检查 API 配置）

**Q: 如何禁用 Proxy？**

A: 删除或重命名 `proxy.ts` 文件。

## 性能考虑

### Proxy 性能影响

- **最小化**：Proxy 只在匹配的路由上运行
- **异步**：不会阻塞其他请求
- **边缘运行**：在 Vercel Edge Network 上运行（如果部署在 Vercel）

### 优化建议

1. **精确匹配**：使用具体的路由而不是通配符
2. **快速检查**：Cookie 检查非常快速
3. **避免复杂逻辑**：保持 Proxy 逻辑简单

## 安全最佳实践

1. **始终使用 Proxy**：服务器端保护更安全
2. **双重验证**：结合客户端检查
3. **HTTPS**：生产环境必须使用 HTTPS
4. **Cookie 安全**：httpOnly, secure, sameSite
5. **Token 过期**：设置合理的过期时间
6. **登出清理**：登出时清除 Cookie

## 相关文档

- [Next.js Proxy 文档](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [认证配置指南](./AUTH_SETUP.md)
- [tale-js-sdk 文档](https://www.npmjs.com/package/tale-js-sdk)
