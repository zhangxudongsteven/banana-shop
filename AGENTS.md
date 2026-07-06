# AGENTS.md

## 项目概览

Banana Shop 是一个 AI 图片/视频生成与编辑应用。当前项目基于 Next.js App Router 构建，提供图片上传、风格转换、多图参考、文本生成图片、视频生成、历史记录、认证登录与受保护的 Dashboard 工作流。

后续开发应优先保持现有产品形态：图片创作工具优先，认证与生成能力服务端封装，前端围绕 Dashboard 编辑体验迭代。

## 技术栈与包管理

- 包管理器：`pnpm@10.28.1`
- 框架：Next.js 16、React 19
- 语言：TypeScript
- 样式：Tailwind CSS
- UI 基础：`components/ui/*`、Radix Slot、class-variance-authority、lucide-react
- 认证：`@turinhub/tale-js-sdk`
- AI 服务：OpenAI SDK 兼容调用 Volcengine Ark API

## 常用命令

- `pnpm dev`：启动本地开发服务。
- `pnpm build`：执行生产构建检查。
- `pnpm lint`：运行 lint 检查。
- `pnpm format`：使用 Prettier 格式化项目。

提交前至少运行与改动相关的检查。涉及路由、Server Actions、构建配置、依赖、类型或跨页面行为时，优先运行 `pnpm build`。

## 目录职责

- `app/`：Next.js App Router 页面、布局与路由入口。
- `app/dashboard/`：受保护的图片编辑与转换主工作区。
- `components/`：复用 UI 与业务组件。
- `components/ui/`：基础 UI 原语，新增按钮、输入框、卡片等通用组件时优先放在这里。
- `actions/`：Server Actions，封装图片、视频、分析等服务端调用。
- `lib/`：服务端/共享工具、认证服务、AI 服务配置与常量。
- `i18n/`：中英文文案与语言上下文。
- `theme/`：主题上下文与明暗主题状态。
- `contexts/`：跨组件业务状态，例如历史记录。
- `public/examples/`：转换效果示例图片。
- `doc/`：认证、路由保护等项目说明文档。

## 开发约定

- 优先复用现有组件、工具函数和目录结构，不为单点需求引入新的架构层。
- 使用 `@/*` 路径别名引用项目内模块；同目录附近的小范围引用可沿用现有相对路径风格。
- 需要浏览器状态、`localStorage`、事件处理或 React hooks 的组件必须显式添加 `'use client'`。
- 服务端能力优先放在 Server Actions 或 `lib/` 中，不在客户端组件中直接访问密钥、服务端 SDK 或敏感配置。
- UI 变更应与现有 Tailwind 风格保持一致，优先使用 `components/ui/*` 与 `lucide-react` 图标。
- 新增转换能力时，优先扩展 `lib/constants.ts` 中的 `TRANSFORMATIONS`，并同步补齐类型、文案和示例资源。
- 保持错误处理模式一致：服务端动作返回 `AuthResult` 风格的 `{ success, data, error }` 结果，用户可见错误使用中文文案。

## UI 与交互 Skill 使用约定

- 详细规范维护在 `doc/UI_DESIGN_GUIDELINES.md`，避免在本文件继续堆叠过长 UI 说明。
- 产品 UI 设计方案优先使用 `frontend-design`。
- 组件实现与项目一致性优先使用 `shadcn` 与 `tailwind-design-system`。
- React / Next.js 实现质量优先使用 `vercel-react-best-practices`。
- AI Chat Prompt 输入体验仅在引入聊天式创作时按需使用 `ai-elements`。

## 认证与路由保护

- 认证能力集中在 `lib/auth.ts`，基于 `@turinhub/tale-js-sdk`。
- 登录态通过 httpOnly cookie 保存，主要 cookie 为 `auth_token` 与 `auth_user`。
- 受保护路由由根目录 `proxy.ts` 管理；新增需要登录访问的页面时，必须确认路由是否加入保护列表。
- 客户端读取登录态时使用 `components/AuthProvider.tsx` 提供的认证上下文。
- 认证相关环境变量参考 `.env.example` 和 `doc/AUTH_SETUP.md`。

## AI 服务约定

- Volcengine Ark / OpenAI-compatible 调用集中在 `lib/volcengine.ts`。
- API Key、Base URL、模型名通过环境变量配置，不要硬编码真实密钥。
- 图片生成、图片分析、图片编辑、视频生成应通过 `actions/image-actions.ts` 暴露给前端。
- 返回给前端的生成内容遵循 `types.ts` 中的 `GeneratedContent`。
- 客户端不要直接调用 Volcengine 或 OpenAI SDK。

## i18n 与主题

- 新增用户可见文案时，同步维护 `i18n/zh.ts` 与 `i18n/en.ts`。
- 组件中优先通过 `useTranslation()` 读取翻译 key，避免硬编码会出现在多语言界面的长文案。
- 主题状态由 `theme/context.tsx` 管理，并通过 `data-theme` 写入 `document.documentElement`。
- 不要绕过现有 ThemeProvider 直接创建新的主题状态来源。

## 验证要求

- 文档或纯静态资源改动：检查文件位置、拼写、Markdown 渲染与引用路径。
- UI 或交互改动：至少运行相关页面的本地验证；有条件时使用浏览器实际检查关键流程。
- Server Actions、认证、路由保护、环境变量、构建配置或依赖改动：运行 `pnpm build`。
- 格式化大范围改动前注意工作区状态，避免把无关文件卷入提交。
