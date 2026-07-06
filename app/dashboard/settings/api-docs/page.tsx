'use client'

import Link from 'next/link'
import { BookOpen, Code2, KeyRound, Plug, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/i18n/context'

const apiKeyPlaceholder = 'bns_v1.payload.secret'

const endpointRows = [
  {
    method: 'POST',
    path: '/api/v1/images/generate',
    scope: 'image:generate',
    body: '{ prompt, transformationKey, transformationTitle?, profileKey? }',
  },
  {
    method: 'POST',
    path: '/api/v1/images/edit',
    scope: 'image:edit',
    body: '{ base64ImageData, mimeType, prompt, transformationKey?, transformationTitle?, maskBase64?, maskMimeType?, secondaryImage?, profileKey? }',
  },
  {
    method: 'POST',
    path: '/api/v1/videos/generate',
    scope: 'video:generate',
    body: '{ prompt, aspectRatio?, transformationKey?, transformationTitle? }',
  },
  {
    method: 'GET',
    path: '/api/v1/history',
    scope: 'history:read',
    body: '-',
  },
]

const curlExample = `curl -X POST https://your-domain.com/api/v1/images/generate \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A cinematic banana shop storefront at night",
    "transformationKey": "glmImage",
    "transformationTitle": "GLM Image",
    "profileKey": "glmImage"
  }'`

const fetchExample = `const response = await fetch("https://your-domain.com/api/v1/images/edit", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKeyPlaceholder}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    base64ImageData: imageBase64,
    mimeType: "image/png",
    prompt: "Turn this into a polished product photo",
    transformationKey: "image-edit",
    transformationTitle: "Image Edit",
    profileKey: "defaultImageEdit"
  })
})

const result = await response.json()`

const videoExample = `curl -X POST https://your-domain.com/api/v1/videos/generate \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A rotating 3D banana mascot in a clean studio",
    "aspectRatio": "16:9",
    "transformationKey": "text-to-video",
    "transformationTitle": "Text to Video"
  }'`

const responseExample = `{
  "success": true,
  "data": {
    "imageUrl": "data:image/png;base64,...",
    "text": null,
    "historyTaskId": "task_...",
    "historyStatus": "synced"
  }
}`

export default function ApiDocsPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('apiDocs.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('apiDocs.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/api-keys">
              <KeyRound data-icon="inline-start" />
              {t('apiDocs.manageKeys')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/mcp-docs">
              <Plug data-icon="inline-start" />
              {t('apiDocs.viewMcpDocs')}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('apiDocs.authTitle')}</CardTitle>
          <CardDescription>{t('apiDocs.authDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
            <code>{`Authorization: Bearer ${apiKeyPlaceholder}`}</code>
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('apiDocs.endpointsTitle')}</CardTitle>
          <CardDescription>{t('apiDocs.endpointsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-3 font-medium">{t('apiDocs.method')}</th>
                  <th className="p-3 font-medium">{t('apiDocs.path')}</th>
                  <th className="p-3 font-medium">{t('apiDocs.scope')}</th>
                  <th className="p-3 font-medium">{t('apiDocs.body')}</th>
                </tr>
              </thead>
              <tbody>
                {endpointRows.map((row) => (
                  <tr key={row.path} className="border-t">
                    <td className="p-3">
                      <code>{row.method}</code>
                    </td>
                    <td className="p-3">
                      <code>{row.path}</code>
                    </td>
                    <td className="p-3">
                      <code>{row.scope}</code>
                    </td>
                    <td className="p-3">
                      <code>{row.body}</code>
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
          <CardTitle>{t('apiDocs.examplesTitle')}</CardTitle>
          <CardDescription>{t('apiDocs.examplesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <CodeBlock title={t('apiDocs.textToImageExample')} value={curlExample} />
            <CodeBlock title={t('apiDocs.imageEditExample')} value={fetchExample} />
            <CodeBlock title={t('apiDocs.videoExample')} value={videoExample} />
            <CodeBlock title={t('apiDocs.responseExample')} value={responseExample} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('apiDocs.errorsTitle')}</CardTitle>
          <CardDescription>{t('apiDocs.errorsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {['400', '401', '403', '500'].map((code) => (
              <div key={code} className="rounded-md border p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Server className="size-4 text-muted-foreground" />
                  HTTP {code}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t(`apiDocs.errors.${code}`)}</p>
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
