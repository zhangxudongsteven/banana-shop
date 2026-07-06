# Changelog

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
并遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)（语义化版本）。

## [0.6.0] - 2026-07-06

### 新增

- **开放个人 API Key 管理**：新增 Dashboard API Key 设置页，支持创建、复制、查看状态、撤销个人 Key，并通过 Tale 用户属性保存 Key 元数据和密钥哈希。
- **新增 REST API v1**：提供图片生成、图片编辑、视频生成和历史读取接口，统一使用 Bearer API Key 鉴权和权限范围校验。
- **新增本地 MCP Server**：新增 `pnpm mcp` 启动入口，提供 Banana Shop 图片生成、图片编辑、视频生成和历史读取 MCP tools。
- **补充 API 与 MCP 文档页**：Dashboard 新增 REST API 文档和 MCP 文档入口，并补充 `doc/MCP_SERVER.md`。

### 变更

- **抽取生成服务层**：将图片生成、图片分析、图片编辑和视频生成的 Provider 调用统一封装到 `lib/generation-service.ts`，供 Server Actions、REST API 和 MCP 复用。
- **增强历史记录来源标记**：生成历史新增 `source` 字段，用于区分 Dashboard、REST API 和 MCP 产生的记录，并在历史面板中展示。

### 修复

- **修复 API 请求体错误码**：REST API 对非法 JSON 或非对象请求体返回 400，不再误报为服务端 500。
- **修复空 Provider Profile 处理**：REST API 和 MCP 会将空白 `profileKey` 归一为默认配置，避免空字符串触发 profile 查找失败。
- **修复 API Key 使用时间写入风险**：`lastUsedAt` 更新改为非阻断写入，Tale 元数据临时写入失败不会影响有效 API Key 的业务请求。

## [0.5.2] - 2026-07-06

### 变更

- **升级 Tale JS SDK 至 2.4.4**：认证与历史记录集成改用 Tale App Client 和动态 `appTokenProvider`，统一服务端 App Token 获取逻辑。
- **补充 shadcn 项目配置**：新增 `components.json` 与 Tailwind 容器、accordion 动画和 `tailwindcss-animate` 配置，为后续组件扩展提供一致基线。
- **整理 UI 开发规范**：新增 `doc/UI_DESIGN_GUIDELINES.md`，并在 `AGENTS.md` 中保留 Skill 使用入口说明。

### 修复

- **修复服务端模块依赖缺失**：补充 `server-only` 依赖，确保 Tale 服务端客户端封装可被 TypeScript 与 Next.js 构建正确解析。
- **修复短信登录类型收窄**：规范短信验证码返回类型，避免非登录/注册类型进入登录验证流程。

## [0.5.1] - 2026-06-03

### 新增

- **分组创作入口**：将生成能力、网红玩法、照片编辑、设计产品、创意工具与艺术效果整理为分类入口，并支持手动整理首页分类顺序。
- **历史附件查看**：历史面板新增任务附件列表，可直接预览或打开输入图、参考图、蒙版、中间图、输出图与视频附件。
- **结果操作增强**：生成结果新增显式放大预览入口，并在对比视图中保留下载与继续编辑操作。

### 变更

- **升级 Next.js 至 16.2.7**：同步更新 `next` 依赖和锁文件。
- **优化创作页输入体验**：文本生成图片、文本生成视频和自定义改图统一提示词输入区域；仅对支持蒙版的效果显示蒙版工具。
- **优化历史结果复用**：从历史记录继续编辑时改用待处理输入状态，并在当前路由不适合接收图片输入时自动跳转到自定义改图。

### 修复

- **修复嵌套效果路由查找**：生成页通过扁平化分类树查找转换效果，确保分类内效果可直接访问。
- **修复附件翻译缺失**：补齐历史附件标题、操作与角色的中英文文案。

## [0.5.0] - 2026-06-02

### 新增

- **Tale UserTask 持久化历史**：生成历史从前端内存状态升级为 Tale UserTask 任务记录，支持刷新后恢复最近生成任务。
- **任务附件保存**：为输入图、参考图、蒙版、中间图、输出图与输出视频自动复用或创建 Tale 附件类型，并将媒体保存为 UserTask 附件。
- **历史面板任务化 UI**：历史面板新增同步状态、创建时间、提示词摘要、输入/参考缩略图、输出预览与刷新入口。

### 变更

- **升级 Next.js 至 16.2.6**：同步更新 `next` 依赖和锁文件。
- **扩大生成请求体限制**：配置 Server Actions 与 Proxy 客户端请求体上限为 25MB，修复大图生成/保存时 JSON 请求体被截断的问题。

### 修复

- **修复 Tale 任务类型识别**：UserTask 创建和查询使用 Tale 后端实际接受的任务类型名称，附件类型仍按任务类型 ID 归属，避免 `任务类型不存在` 错误。

### 文档

- 新增 UserTask 历史说明文档，并更新认证配置文档与环境变量示例。

## [0.4.0] - 2026-05-31

### 变更

- **升级 Tale JS SDK 至 2.3.0**：将 `@turinhub/tale-js-sdk` 从 1.3.0 升级到 2.3.0。
- **适配 SDK 2.x 认证响应字段**：认证集成改用 `expiredAt`、`smsId`、`smsType`、`verificationCode` 等 camelCase 字段。
- **显式处理短信登录 App Token**：短信验证码发送与验证流程通过 `getAppToken()` 获取应用 Token 后调用 SDK 认证接口。

### 文档

- 更新认证配置、路由保护和环境变量示例中的 SDK 版本与响应字段说明。

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
