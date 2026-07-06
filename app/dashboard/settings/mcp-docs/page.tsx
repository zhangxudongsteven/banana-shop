'use client'

import Link from 'next/link'
import { BookOpen, KeyRound, Plug, TerminalSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/i18n/context'

const apiKeyPlaceholder = 'bns_v1.payload.secret'

const startWithEnvExample = `BANANA_SHOP_API_KEY="${apiKeyPlaceholder}" pnpm mcp`

const startWithArgExample = `pnpm mcp -- --api-key "${apiKeyPlaceholder}"`

const clientConfigExample = `{
  "mcpServers": {
    "banana-shop": {
      "command": "pnpm",
      "args": ["mcp"],
      "cwd": "/Users/zhangxudong/Gits/playground/banana-shop",
      "env": {
        "BANANA_SHOP_API_KEY": "${apiKeyPlaceholder}"
      }
    }
  }
}`

const imageToolExample = `{
  "prompt": "A glossy banana-shaped spaceship in a product photo style",
  "transformationKey": "glmImage",
  "transformationTitle": "GLM Image",
  "profileKey": "glmImage",
  "recordHistory": true
}`

const editToolExample = `{
  "base64ImageData": "...",
  "mimeType": "image/png",
  "prompt": "Turn the object into a premium studio product shot",
  "secondaryImage": {
    "base64": "...",
    "mimeType": "image/jpeg"
  },
  "maskBase64": null,
  "transformationKey": "image-edit",
  "transformationTitle": "Image Edit",
  "profileKey": "defaultImageEdit",
  "recordHistory": true
}`

const toolRows = [
  {
    name: 'banana_generate_image',
    scope: 'image:generate',
    input: '{ prompt, transformationKey, transformationTitle?, profileKey?, recordHistory? }',
  },
  {
    name: 'banana_edit_image',
    scope: 'image:edit',
    input:
      '{ base64ImageData, mimeType, prompt, secondaryImage?, maskBase64?, transformationKey?, transformationTitle?, profileKey?, recordHistory? }',
  },
  {
    name: 'banana_generate_video',
    scope: 'video:generate',
    input: '{ prompt, aspectRatio?, transformationKey?, transformationTitle?, recordHistory? }',
  },
  {
    name: 'banana_list_history',
    scope: 'history:read',
    input: '{ limit? }',
  },
]

export default function McpDocsPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Plug className="size-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('mcpDocs.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('mcpDocs.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/api-keys">
              <KeyRound data-icon="inline-start" />
              {t('mcpDocs.manageKeys')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/api-docs">
              <BookOpen data-icon="inline-start" />
              {t('mcpDocs.viewApiDocs')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('mcpDocs.startTitle')}</CardTitle>
          <CardDescription>{t('mcpDocs.startDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <CodeBlock title={t('mcpDocs.envExample')} value={startWithEnvExample} />
            <CodeBlock title={t('mcpDocs.argExample')} value={startWithArgExample} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('mcpDocs.clientTitle')}</CardTitle>
          <CardDescription>{t('mcpDocs.clientDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock title={t('mcpDocs.clientConfig')} value={clientConfigExample} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('mcpDocs.toolsTitle')}</CardTitle>
          <CardDescription>{t('mcpDocs.toolsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-3 font-medium">{t('mcpDocs.tool')}</th>
                  <th className="p-3 font-medium">{t('mcpDocs.scope')}</th>
                  <th className="p-3 font-medium">{t('mcpDocs.input')}</th>
                </tr>
              </thead>
              <tbody>
                {toolRows.map((row) => (
                  <tr key={row.name} className="border-t">
                    <td className="p-3">
                      <code>{row.name}</code>
                    </td>
                    <td className="p-3">
                      <code>{row.scope}</code>
                    </td>
                    <td className="p-3">
                      <code>{row.input}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('mcpDocs.examplesTitle')}</CardTitle>
          <CardDescription>{t('mcpDocs.examplesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <CodeBlock title={t('mcpDocs.imageExample')} value={imageToolExample} />
            <CodeBlock title={t('mcpDocs.editExample')} value={editToolExample} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('mcpDocs.securityTitle')}</CardTitle>
          <CardDescription>{t('mcpDocs.securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {['apiKey', 'scopes', 'history', 'secrets'].map((item) => (
              <div key={item} className="rounded-md border p-4">
                <div className="flex items-center gap-2 font-medium">
                  <TerminalSquare className="size-4 text-muted-foreground" />
                  {t(`mcpDocs.security.${item}.title`)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`mcpDocs.security.${item}.description`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CodeBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
        <code>{value}</code>
      </pre>
    </div>
  )
}
