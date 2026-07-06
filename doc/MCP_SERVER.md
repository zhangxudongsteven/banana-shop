# Banana Shop MCP Server

Banana Shop provides a local stdio MCP server for external agents. The server reuses the same
server-side services as the REST API:

- `lib/generation-service.ts` for image generation, image editing, and video generation.
- `lib/tale-history.ts` for generation history.
- `lib/api-auth.ts` and `lib/api-keys.ts` for API Key authentication and scope checks.

The MCP server does not expose `TALE_APP_SECRET`, `BANANA_API_KEY_PEPPER`, provider API keys, or
raw Banana Shop API Keys to the browser.

## Install

Install project dependencies with pnpm:

```bash
pnpm install
```

The MCP integration uses the official `@modelcontextprotocol/sdk` package and `zod` for tool
schemas.

## Configure API Key

Create a Banana Shop API Key from `/dashboard/settings/api-keys`. The key must include the scopes
used by the tools you plan to call:

- `image:generate`
- `image:edit`
- `video:generate`
- `history:read`

Provide the API Key to the MCP server with an environment variable:

```bash
BANANA_SHOP_API_KEY="bns_v1..." pnpm mcp
```

Alternatively pass it as a process argument:

```bash
pnpm mcp -- --api-key "bns_v1..."
```

`BANANA_API_KEY` is also accepted as a fallback environment variable for local agent configs. Do not
commit real API Keys to the repository.

The MCP process also needs the same server-side environment required by Banana Shop generation and
history features, including:

- `BANANA_API_KEY_PEPPER`
- `TALE_BASE_URL`
- `TALE_APP_KEY`
- `TALE_APP_SECRET`
- `TALE_API_KEYS_ATTRIBUTE_DEFINITION_ID`
- Provider keys such as `VOLCENGINE_API_KEY`, `GLM_API_KEY`, or `ALIYUN_DASHSCOPE_API_KEY`

## Client Configuration

For MCP clients that spawn stdio servers, use:

```json
{
  "mcpServers": {
    "banana-shop": {
      "command": "pnpm",
      "args": ["mcp"],
      "cwd": "/Users/zhangxudong/Gits/playground/banana-shop",
      "env": {
        "BANANA_SHOP_API_KEY": "bns_v1..."
      }
    }
  }
}
```

## Tools

### `banana_generate_image`

Generates an image from text. Requires `image:generate`.

Input:

```json
{
  "prompt": "A glossy banana-shaped spaceship in a product photo style",
  "transformationKey": "glmImage",
  "transformationTitle": "GLM Image",
  "profileKey": "glmImage",
  "recordHistory": true
}
```

Fields:

- `prompt` is required.
- `transformationKey` is required and maps to a Banana Shop text-to-image profile.
- `transformationTitle` is optional and is stored in history.
- `profileKey` is optional.
- `recordHistory` defaults to `true`.

Output includes `imageUrl`, `text`, and optional history metadata. If `imageUrl` is a data URL, the
tool also returns MCP image content.

### `banana_edit_image`

Edits an image with an instruction prompt. Requires `image:edit`.

Input:

```json
{
  "base64ImageData": "...",
  "mimeType": "image/png",
  "prompt": "Turn the object into a premium studio product shot",
  "secondaryImage": {
    "base64": "...",
    "mimeType": "image/jpeg"
  },
  "maskBase64": null,
  "maskMimeType": "image/png",
  "transformationKey": "image-edit",
  "transformationTitle": "Image Edit",
  "profileKey": "defaultImageEdit",
  "recordHistory": true
}
```

Fields:

- `base64ImageData`, `mimeType`, and `prompt` are required.
- `secondaryImage` is optional and can be `null`.
- `maskBase64` is optional and can be `null`.
- `maskMimeType` is only used for history storage when `maskBase64` is provided.
- `transformationKey`, `transformationTitle`, and `profileKey` are optional.
- `recordHistory` defaults to `true`.

Output includes `imageUrl`, `text`, and optional history metadata. If `imageUrl` is a data URL, the
tool also returns MCP image content.

### `banana_generate_video`

Generates a video from text. Requires `video:generate`.

Input:

```json
{
  "prompt": "A banana smoothie bottle rotating on a clean studio turntable",
  "aspectRatio": "16:9",
  "transformationKey": "text-to-video",
  "transformationTitle": "Text to Video",
  "recordHistory": true
}
```

Fields:

- `prompt` is required.
- `aspectRatio` is optional and must be `16:9` or `9:16`.
- `transformationKey` and `transformationTitle` are optional.
- `recordHistory` defaults to `true`.

Output includes `videoUrl`, `imageUrl`, `text`, and optional history metadata.

### `banana_list_history`

Lists generation history for the user that owns the configured API Key. Requires `history:read`.

Input:

```json
{
  "limit": 10
}
```

Fields:

- `limit` is optional and must be between 1 and 20.

Output:

```json
{
  "items": []
}
```

History items follow `GenerationHistoryItem` from `types.ts`.
