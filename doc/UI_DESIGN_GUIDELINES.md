# Banana Shop UI 设计规范

本文档用于沉淀 Banana Shop 后续 UI 设计、组件实现、React/Next.js 实现质量与 AI Chat Prompt 输入体验的工作约定。`AGENTS.md` 只保留入口说明；细节优先维护在本文档。

## 项目 UI 基线

- 产品定位：AI 图片/视频生成与编辑工具，核心体验围绕 Dashboard 创作工作区，而不是营销页或通用 SaaS 管理后台。
- 当前技术状态：Next.js App Router、React 19、Tailwind CSS v3、shadcn `components.json`、`components/ui/*` 本地 UI 原语、Radix Slot、class-variance-authority、lucide-react。
- 当前组件状态：项目已配置 shadcn，采用 `new-york` 风格、RSC、TSX、CSS variables、`lucide` 图标库；已有组件仍以本地 `components/ui/*` 原语为准，不假设 registry 组件已经安装。
- 主题状态：`theme/context.tsx` 通过 `data-theme` 写入 `document.documentElement`，颜色 token 主要定义在 `app/globals.css` 与 `tailwind.config.js`。
- 产品视觉：默认深色编辑环境，橙黄强调色承载生成、创作、焦点状态；浅色主题已有粉红/红色强调色，应同步维护可读性。

## Skill 使用顺序

1. 产品 UI 设计方案：使用 `frontend-design`。
2. 组件实现与项目一致性：使用 `shadcn` 与 `tailwind-design-system`。
3. React / Next.js 实现质量：使用 `vercel-react-best-practices`。
4. AI Chat Prompt 输入体验：按需使用 `ai-elements`。

使用这些 Skill 时，应先检查本项目现有代码和文档，再提炼方案。不要把 Skill 的通用建议直接套到项目里。

## 1. 产品 UI 设计方案

使用 `frontend-design` 时，先明确本次 UI 变更服务的创作任务：上传图片、选择转换、输入 Prompt、多图参考、蒙版编辑、文本生成图片、视频生成、结果对比、历史复用，或它们之间的某个流程。

设计原则：

- 第一屏应优先呈现可操作的创作工作区，不做纯介绍型 Hero。
- Dashboard 的信息层级以“输入、生成控制、结果预览、历史复用”为核心。
- 图片、视频和生成结果是主视觉，装饰性背景、抽象图形和大面积营销式排版应克制使用。
- 空状态要指向下一步动作，例如上传图片、输入 Prompt、选择转换，而不是只表达情绪。
- 加载状态要区分普通生成、视频拉取、两步生成等已有任务阶段。
- 错误状态要说明用户能做什么，保持中文可见错误文案。
- 历史记录、使用生成图作为输入、结果对比视图属于创作闭环，应保持入口清晰。

布局建议：

- 创作页继续采用输入栏与结果栏并列的主结构，移动端单列堆叠。
- 图片上传、蒙版、Prompt、模型/服务商选择、比例选择都属于输入控制，不应散落到结果区。
- 结果区优先展示可检视内容，下载、继续编辑、作为输入等动作放在结果附近。
- 转换选择页可使用网格，但每个卡片必须稳定尺寸，避免标题、图标、拖拽状态导致布局跳动。

文案建议：

- 控件文案描述动作结果，例如“生成图片”“下载结果”“作为输入继续编辑”。
- 不使用实现细节命名用户操作，例如不要把普通用户可见入口命名为 action、provider profile、base64。
- 新增用户可见文案必须同步维护 `i18n/zh.ts` 与 `i18n/en.ts`。

## 2. 组件实现与项目一致性

使用 `shadcn` 与 `tailwind-design-system` 时，要基于项目当前状态执行：Tailwind v3、已配置 `components.json`、本地 `components/ui` 原语有限。只有当明确需要引入新基础组件时，才通过 shadcn CLI 添加组件；不要绕过本地配置手写 registry 组件。

组件约定：

- 通用按钮、输入框、标签、卡片等优先放在 `components/ui/*`。
- 业务组件放在 `components/`，例如上传器、结果展示、历史面板、转换选择器。
- 图标优先使用 `lucide-react`；不要继续新增手写 SVG，除非没有合适图标或需要特殊图形。
- 按钮、工具按钮、切换按钮应使用稳定尺寸；图标按钮需要 `aria-label`。
- 选项集合优先使用清晰的分段或网格选择，不用多个样式分叉的裸按钮堆叠复杂状态。
- Card 只用于真正需要框住的工具面板、结果面板或重复项；不要把页面区块层层套成卡片。

Tailwind 与 token 约定：

- 继续优先使用语义 token：`bg-background`、`text-foreground`、`bg-card`、`text-muted-foreground`、`border-border`、`bg-primary` 等。
- 现有自定义 CSS 变量如 `--bg-card`、`--accent-primary`、`--text-secondary` 可以继续使用，但新增变量应先判断是否能映射到语义 token。
- 明暗主题都要更新，不能只改默认深色主题。
- 避免把新功能做成另一套独立配色；新增状态色应进入全局 token 或复用现有 token。
- 使用 `gap-*` 管理间距，避免继续扩大 `space-y-*` 的使用。
- 固定格式元素需要稳定尺寸，例如上传框、结果框、转换卡片、工具按钮、比例选择器。

设计系统边界：

- 本项目当前不做 Tailwind v4 迁移；`tailwind-design-system` 只用于 token、主题、响应式和组件规范思路。
- 如果未来要切换 shadcn preset、base style 或 Tailwind 主版本，必须先预览 diff，并记录迁移影响。

## 3. React / Next.js 实现质量

使用 `vercel-react-best-practices` 时，重点检查 Dashboard 创作链路的状态边界、渲染成本和服务端能力隔离。

实现原则：

- 默认让页面和组件尽量保持服务端能力封装；需要 hooks、事件、localStorage、canvas、拖拽、文件读取时才使用 `'use client'`。
- 客户端组件不得直接访问 Volcengine、OpenAI SDK、真实 API Key 或服务端认证 SDK。
- 图片生成、图片编辑、图片分析、视频生成继续通过 `actions/image-actions.ts` 暴露。
- 重型浏览器组件如 canvas、结果预览、图片 Modal 可以继续使用 `next/dynamic` 禁用 SSR。
- `localStorage` 数据要有容错解析，避免损坏数据导致页面不可用。
- 生成中、失败、成功、继续编辑要保持单向清晰状态，避免旧结果和新错误同时误导用户。

性能与状态建议：

- 上传图片、拖拽状态、蒙版绘制、结果对比滑杆等高频交互应尽量局部化状态。
- 计算型逻辑优先用 `useMemo` 或普通函数隔离，避免在主 render 中重复构建大对象。
- 事件处理函数传给深层组件时优先使用 `useCallback`，但不要为简单表达式滥用 memo。
- 独立的异步请求应并行；有依赖关系的两步生成要明确阶段文案和错误边界。
- 历史记录写入不要阻塞用户查看当前生成结果。

## 4. AI Chat Prompt 输入体验

只有当产品引入聊天式创作、多轮改图、消息流、工具调用展示、Prompt 对话历史等体验时，才使用 `ai-elements`。普通表单式 Prompt 输入继续沿用当前 textarea 与本地 UI 原语。

适合引入 Chat UI 的场景：

- 用户通过多轮对话逐步修改同一张图。
- AI 返回建议、追问或工具调用过程，需要消息流展示。
- Prompt 历史需要按对话组织，而不是简单表单输入。
- 同一创作任务里需要展示用户输入、系统分析、生成结果、后续修订建议。

不适合引入 Chat UI 的场景：

- 单次文本生成图片。
- 单次图片风格转换。
- 只有一个 Prompt textarea 和一个生成按钮。
- 只是想保存 Prompt 模板或展示最终 Prompt。

引入约定：

- 先确认是否已经安装 AI SDK 和 ai-elements 相关组件；没有时不要假设存在。
- 组件目录建议使用 `components/ai-elements/`，并保持代码可本地审查和修改。
- Chat 仍然不能绕过 Server Actions 直接访问服务端密钥。
- 消息流应服务创作结果，不能挤占图片预览和编辑工具的主空间。
- Prompt 输入需要支持清晰的提交状态、禁用状态、错误提示和历史上下文。

## 更新规范

- 新增 Dashboard UI 模式、基础组件、主题 token、AI Chat 输入形态时，同步更新本文档。
- 如果本文档与 `AGENTS.md` 冲突，以 `AGENTS.md` 的高层规则为准，并及时修订本文档。
- 如果项目迁移到 Tailwind v4 或完整 shadcn registry，必须先更新“项目 UI 基线”和“组件实现与项目一致性”。
