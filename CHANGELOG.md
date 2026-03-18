# Changelog

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
并遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)（语义化版本）。

## [0.3.2] - 2026-03-18

### 变更

- **迁移至 @turinhub/tale-js-sdk**：将认证 SDK 从已弃用的 `tale-js-sdk` 迁移至 `@turinhub/tale-js-sdk`，确保使用最新的官方包。
- **更新环境配置**：更新 `.env.example` 中的注释，使用新的包名称。
- **更新依赖声明**：在 `package.json` 中更新认证 SDK 依赖。

### 修复

- 修复导入路径：将所有 `tale-js-sdk` 导入更新为 `@turinhub/tale-js-sdk`。
- 更新文档中的 SDK 名称和链接引用。

## [0.3.1] - 2026-03-18

### 变更

- **迁移至 Seedream 5.0 模型**：将图像编辑功能从已弃用的 `doubao-seededit-3-0-i2i-250628` 模型迁移至 `doubao-seedream-5-0-260128` 模型，使用 `reference_images` 参数实现图像到图像生成。
- **更新环境配置**：更新 `.env.example` 和 `.env.local` 中的图像编辑模型配置，确保使用最新的 Seedream 5.0 模型。
- **类型安全改进**：为火山引擎自定义 API 参数添加类型断言，确保 TypeScript 类型检查通过。

### 移除

- 删除 `app/api/image/edit/route.ts` 路由文件，图像编辑功能已完全迁移至 Server Actions。

## [0.3.0] - 2026-03-18

### 重构

- **迁移至火山引擎 Ark API**：将图像生成、分析、编辑和视频生成功能从 OpenAI 服务迁移至火山引擎 Ark API。
- **API 路由迁移至 Server Actions**：将图像相关 API 路由（/api/generate-image、/api/edit-image）重构为 Server Actions（actions/image-actions.ts）。
- **统一结果类型**：所有图像/视频生成操作统一使用 AuthResult<GeneratedContent> 返回类型，提供一致的错误处理机制。
- **简化 API 路由**：新增 /api/image/edit 路由作为 Server Actions 的补充，保留原有 API 调用接口。

### 新增

- **多图支持**：图像编辑功能现在支持通过增强提示词的方式处理多图输入。
- **视频生成入口**：新增 generateVideo Server Action 支持视频生成功能。

### 移除

- 移除 OpenAI 服务依赖（services/openaiService.ts）。
- 移除旧的蒙版编辑 API 路由（/api/edit-image）和图像生成 API 路由（/api/generate-image）。

### 配置

- 更新 .env.example：移除 OpenAI 相关配置，新增 VOLCENGINE_API_KEY 环境变量。
- 更新 next.config.ts：添加火山引擎域名到图片优化域名白名单。

## [0.2.0] - 2026-03-18

### 重构

- **认证系统迁移至 Server Actions**：将认证相关 API 路由（/api/auth/login、/api/auth/logout、/api/auth/me、/api/auth/sms/send、/api/auth/sms/verify）迁移至 Server Actions，统一在 lib/auth.ts 中管理。
- **统一错误处理**：为所有认证函数添加统一的 AuthResult 返回类型，改善错误处理和用户反馈。

### 安全

- **增强 Cookie 安全性**：为认证 Cookie 添加详细的安全配置注释，明确 httpOnly、secure、sameSite 等设置的安全作用。
- **API 错误信息优化**：在图像编辑 API 中改进错误处理，避免向客户端暴露敏感的服务端错误信息。
- **环境变量验证**：在启动时验证必需的环境变量，添加图像模型白名单验证机制。

### 配置

- 新增 VOLCENGINE_API_KEY 环境变量配置示例。

## [0.1.0] - 2026-03-18

### 新增

- 基于 Next.js 16 + React 19 搭建项目基础架构，完成首页、登录页与创作工作台页面结构。
- 提供多种 AI 图像玩法与编辑能力，包含风格化处理、线稿/上色流程、多图参考输入与自定义提示词。
- 支持图像局部编辑（蒙版绘制）、图像预览与下载、生成历史记录与结果复用。
- 增加视频生成功能入口，支持按宽高比发起视频生成流程。
- 集成中英文国际化（i18n）与主题切换（深色/浅色）能力。
- 集成用户认证体系（账号密码、短信验证码）及客户端认证状态管理。

### 变更

- 增加路由保护机制：对 `/dashboard` 及其子路由进行服务端拦截与客户端双层校验。
- 优化创作流程交互：支持”将结果作为下一轮输入”的连续创作体验。

### 安全

- 服务端接口在关键路径对鉴权状态与必要环境变量进行校验，降低未授权访问与配置缺失风险。
