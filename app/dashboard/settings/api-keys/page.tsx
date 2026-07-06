'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Check,
  Clipboard,
  KeyRound,
  Loader2,
  Plug,
  Plus,
  RotateCw,
  Shield,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createApiKeyAction,
  listApiKeysAction,
  revokeApiKeyAction,
} from '@/actions/api-key-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/i18n/context'

interface ApiKeyItem {
  kid: string
  name: string
  prefix: string
  scopes: string[]
  status: 'active' | 'revoked'
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
}

const formatDate = (value: string | null) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function ApiKeysPage() {
  const { t } = useTranslation()
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [name, setName] = useState('')
  const [createdKey, setCreatedKey] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [pendingRevokeKid, setPendingRevokeKid] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeKeys = keys.filter((item) => item.status === 'active')
  const revokedKeys = keys.filter((item) => item.status === 'revoked')

  const loadKeys = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await listApiKeysAction()
    if (!result.success) {
      setError(result.error || t('apiKeys.errors.load'))
      setIsLoading(false)
      return
    }

    setKeys(result.data || [])
    setIsLoading(false)
  }, [t])

  useEffect(() => {
    void loadKeys()
  }, [loadKeys])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error(t('apiKeys.errors.nameRequired'))
      return
    }

    setIsSubmitting(true)
    const result = await createApiKeyAction({ name })
    setIsSubmitting(false)

    if (!result.success || !result.data) {
      toast.error(result.error || t('apiKeys.errors.create'))
      return
    }

    setCreatedKey(result.data.key)
    setKeys((current) => [result.data!.item, ...current])
    setName('')
    setCopied(false)
    toast.success(t('apiKeys.created'))
  }

  const handleCopy = async () => {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey)
    setCopied(true)
    toast.success(t('apiKeys.copied'))
  }

  const handleRevokeConfirmed = async (kid: string) => {
    setRevokeTarget(kid)
    const result = await revokeApiKeyAction({ kid })
    setRevokeTarget(null)
    setPendingRevokeKid(null)

    if (!result.success || !result.data) {
      toast.error(result.error || t('apiKeys.errors.revoke'))
      return
    }

    setKeys((current) => current.map((item) => (item.kid === kid ? result.data! : item)))
    toast.success(t('apiKeys.revoked'))
  }

  return (
    <div className="container mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-24">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <KeyRound className="size-6 text-primary" />
              <h1 className="text-2xl font-bold">{t('apiKeys.title')}</h1>
            </div>
            <p className="text-muted-foreground">{t('apiKeys.description')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/api-docs">
                <BookOpen data-icon="inline-start" />
                {t('apiKeys.viewDocs')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings/mcp-docs">
                <Plug data-icon="inline-start" />
                {t('apiKeys.viewMcpDocs')}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('apiKeys.createTitle')}</CardTitle>
          <CardDescription>{t('apiKeys.createDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="api-key-name">{t('apiKeys.nameLabel')}</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('apiKeys.namePlaceholder')}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Plus data-icon="inline-start" />
                )}
                {t('apiKeys.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {createdKey && (
        <Card>
          <CardHeader>
            <CardTitle>{t('apiKeys.createdTitle')}</CardTitle>
            <CardDescription>{t('apiKeys.createdDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <code className="break-all rounded-md bg-muted p-3 text-sm">{createdKey}</code>
              <div>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <Check data-icon="inline-start" />
                  ) : (
                    <Clipboard data-icon="inline-start" />
                  )}
                  {copied ? t('apiKeys.copied') : t('apiKeys.copy')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{t('apiKeys.listTitle')}</CardTitle>
              <CardDescription>{t('apiKeys.listDescription')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadKeys} disabled={isLoading}>
              <RotateCw data-icon="inline-start" />
              {t('apiKeys.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" data-icon="inline-start" />
              {t('apiKeys.loading')}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : keys.length === 0 ? (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              {t('apiKeys.empty')}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeKeys.map((item) => (
                <div
                  key={item.kid}
                  className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span
                        className={
                          item.status === 'active'
                            ? 'rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary'
                            : 'rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                        }
                      >
                        {t(`apiKeys.status.${item.status}`)}
                      </span>
                    </div>
                    <code className="text-sm text-muted-foreground">{item.prefix}...</code>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {t('apiKeys.createdAt')}: {formatDate(item.createdAt)}
                      </span>
                      <span>
                        {t('apiKeys.lastUsedAt')}: {formatDate(item.lastUsedAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <Shield className="size-3" />
                      {item.scopes.join(', ')}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {pendingRevokeKid === item.kid ? (
                      <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 md:min-w-56">
                        <div className="text-xs text-destructive">
                          {t('apiKeys.confirmRevoke')}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setPendingRevokeKid(null)}
                            disabled={revokeTarget === item.kid}
                          >
                            {t('apiKeys.cancel')}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            disabled={revokeTarget === item.kid}
                            onClick={() => handleRevokeConfirmed(item.kid)}
                          >
                            {revokeTarget === item.kid ? (
                              <Loader2 className="animate-spin" data-icon="inline-start" />
                            ) : (
                              <Trash2 data-icon="inline-start" />
                            )}
                            {t('apiKeys.confirm')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={item.status === 'revoked' || revokeTarget === item.kid}
                        onClick={() => setPendingRevokeKid(item.kid)}
                      >
                        <Trash2 data-icon="inline-start" />
                        {t('apiKeys.revoke')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {activeKeys.length === 0 && revokedKeys.length > 0 && (
                <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                  {t('apiKeys.noActive')}
                </div>
              )}

              {revokedKeys.length > 0 && (
                <details className="group rounded-md border bg-muted/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-sm font-medium">
                    <span>
                      {t('apiKeys.revokedSection')} ({revokedKeys.length})
                    </span>
                    <span className="text-muted-foreground transition-transform group-open:rotate-180">
                      ▾
                    </span>
                  </summary>
                  <div className="flex flex-col gap-3 border-t p-3">
                    {revokedKeys.map((item) => (
                      <div
                        key={item.kid}
                        className="flex flex-col gap-3 rounded-md border bg-background p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {t(`apiKeys.status.${item.status}`)}
                            </span>
                          </div>
                          <code className="text-sm text-muted-foreground">{item.prefix}...</code>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {t('apiKeys.createdAt')}: {formatDate(item.createdAt)}
                            </span>
                            <span>
                              {t('apiKeys.lastUsedAt')}: {formatDate(item.lastUsedAt)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                            <Shield className="size-3" />
                            {item.scopes.join(', ')}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button variant="destructive" size="sm" disabled>
                            <Trash2 data-icon="inline-start" />
                            {t('apiKeys.revoke')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
