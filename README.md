# Banana Shop

Banana Shop 是一个面向图像创作的 AI 工作台，支持文生图、风格转换、整图编辑、多图参考、结果对比与历史复用。基于 Next.js 16、React 19、TypeScript 和 Tailwind CSS v3，使用 Tale 认证及历史存储，通过服务端调用已配置的模型服务商。

## 本地运行

项目使用 `pnpm@10.28.1`：

```sh
corepack pnpm install
cp .env.example .env.local
# 填写 Tale 凭证和需要使用的模型服务商配置
corepack pnpm dev
```

打开 `http://localhost:3000`。Dashboard 需要登录；认证配置见 [认证说明](doc/AUTH_SETUP.md)。密钥仅配置在服务端环境变量中。

## 图像创作

- 上传原图或输入描述，选择转换方式和模型，再生成图片。
- 生成期间锁定输入，上一版结果仍可预览、对比和下载；失败后可使用当前输入重试。
- “继续编辑”统一将结果载入自定义改图页；历史远程图片读取失败时保留当前输入。
- 上传支持 PNG、JPEG、WebP，每张最多 8 MiB，双图合计最多 16 MiB；文件必须能正常解码。
- 历史保存失败可在当前会话重试已有图片，已知任务仅补传缺失附件。未保存结果应先下载；硬刷新后无法恢复仅保存在会话中的载荷。

从 0.8.0 起，视频生成、蒙版绘制和选区抠图已下线。旧视频 API 返回 HTTP 410，视频历史隐藏，云端旧记录及文件不删除；旧图像历史中的蒙版附件仍可查看。编辑接口允许空蒙版，非空蒙版返回错误且不调用模型。

## 验证与构建

```sh
corepack pnpm lint
corepack pnpm test
corepack pnpm build
corepack pnpm start
```

`lint` 当前执行 TypeScript 类型检查。`corepack pnpm test:ui` 可启动仅绑定本机的独立组件预览，使用模拟生成和历史服务，不代表真实模型或 Tale 服务已验收。完整覆盖和验证边界见 [图像创作优化验证](doc/IMAGE_WORKFLOW_VALIDATION.md)。

## 接口与项目说明

- [MCP 与 REST API](doc/MCP_SERVER.md)：API Key、启动方式和图片工具示例；登录后也可在 Dashboard 设置页查看接口文档。
- [历史记录存储与恢复](doc/USER_TASK_HISTORY.md)：Tale 任务、附件和保存恢复边界。
- [UI 开发规范](doc/UI_DESIGN_GUIDELINES.md)。
- [版本变更](CHANGELOG.md)。

## 后续验证

- 真实账号登录、模型生成和 Tale 写入验收。
- GLM 图片模型实测；OpenRouter、速创 API 接入评估。
