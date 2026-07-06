import 'server-only'

import crypto from 'node:crypto'
import { createTaleServerAppClient } from '@/lib/tale-app-client'

const API_KEY_ATTRIBUTE_NAME = 'banana_shop_api_keys'
const DEFAULT_API_KEY_ATTRIBUTE_DEFINITION_ID = 'uad_dd75a89a1d6a41d799944d952e6ccc69'
const API_KEY_PREFIX = 'bns_v1'
const LAST_USED_AT_UPDATE_INTERVAL_MS = 5 * 60 * 1000

export const API_KEY_SCOPES = [
  'image:generate',
  'image:edit',
  'video:generate',
  'history:read',
] as const

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number]
export type ApiKeyStatus = 'active' | 'revoked'

export interface StoredApiKey {
  kid: string
  name: string
  prefix: string
  secretHash: string
  scopes: ApiKeyScope[]
  status: ApiKeyStatus
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
}

export interface ApiKeysPayload {
  schemaVersion: 1
  keys: StoredApiKey[]
}

export type PublicApiKey = Omit<StoredApiKey, 'secretHash'>

interface ParsedApiKey {
  userId: string
  kid: string
  secret: string
}

const apiKeyMutationQueues = new Map<string, Promise<void>>()

const emptyPayload = (): ApiKeysPayload => ({ schemaVersion: 1, keys: [] })

const getPepper = () => {
  const pepper = process.env.BANANA_API_KEY_PEPPER
  if (!pepper) {
    throw new Error('BANANA_API_KEY_PEPPER is not configured')
  }
  return pepper
}

const base64UrlEncode = (value: string | Buffer) => Buffer.from(value).toString('base64url')

const base64UrlDecodeJson = (value: string) =>
  JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { uid?: string; kid?: string }

const hashSecret = (secret: string) =>
  crypto.createHmac('sha256', getPepper()).update(secret).digest('hex')

const safeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const toPublicKey = ({ secretHash, ...item }: StoredApiKey): PublicApiKey => item

const normalizeStoredKey = (value: unknown): StoredApiKey | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<StoredApiKey>
  if (!item.kid || !item.name || !item.prefix || !item.secretHash || !item.createdAt) return null

  return {
    kid: item.kid,
    name: item.name,
    prefix: item.prefix,
    secretHash: item.secretHash,
    scopes: API_KEY_SCOPES.filter((scope) => item.scopes?.includes(scope)),
    status: item.status === 'revoked' ? 'revoked' : 'active',
    createdAt: item.createdAt,
    lastUsedAt: item.lastUsedAt || null,
    expiresAt: item.expiresAt || null,
    revokedAt: item.revokedAt || null,
  }
}

const normalizePayload = (value: unknown): ApiKeysPayload => {
  if (!value || typeof value !== 'object') return emptyPayload()
  const payload = value as Partial<ApiKeysPayload>
  if (!Array.isArray(payload.keys)) return emptyPayload()

  return {
    schemaVersion: 1,
    keys: payload.keys.map(normalizeStoredKey).filter((item): item is StoredApiKey => !!item),
  }
}

export async function getApiKeyAttributeDefinitionId() {
  if (process.env.TALE_API_KEYS_ATTRIBUTE_DEFINITION_ID) {
    return process.env.TALE_API_KEYS_ATTRIBUTE_DEFINITION_ID
  }

  const app = createTaleServerAppClient()
  const definitions = await app.userAttributes.listDefinitions({
    page: 0,
    size: 100,
    keyword: API_KEY_ATTRIBUTE_NAME,
  })
  const existing = definitions.content.find((item) => item.attributeName === API_KEY_ATTRIBUTE_NAME)
  if (existing) return existing.openId

  const created = await app.userAttributes.createDefinition({
    attributeName: API_KEY_ATTRIBUTE_NAME,
    description:
      'Banana Shop per-user API keys. Stores API key metadata and secret hashes only; raw keys are never persisted.',
    schemaDefinition: {
      type: 'object',
      required: ['schemaVersion', 'keys'],
      properties: {
        schemaVersion: { type: 'integer', const: 1 },
        keys: { type: 'array' },
      },
    },
    isEnabled: true,
    remark: 'Managed by Banana Shop API key integration.',
  })

  return created.openId
}

async function getUserApiKeysPayload(userId: string) {
  const app = createTaleServerAppClient()
  const definitionId = await getApiKeyAttributeDefinitionId()
  const result = await app.userAttributes.listUserAttributes(userId, { page: 0, size: 100 })
  const item = result.content.find((attribute) => attribute.attributeDefinitionId === definitionId)

  return {
    definitionId,
    payload: normalizePayload(item?.attributeValue),
  }
}

async function saveUserApiKeysPayload(
  userId: string,
  definitionId: string,
  payload: ApiKeysPayload
) {
  const app = createTaleServerAppClient()
  await app.userAttributes.set(userId, definitionId, {
    attributeValue: payload as unknown as Record<string, unknown>,
    remark: 'Banana Shop API key metadata.',
  })
}

async function withUserApiKeyMutation<T>(userId: string, mutation: () => Promise<T>): Promise<T> {
  const previous = apiKeyMutationQueues.get(userId) || Promise.resolve()
  let releaseCurrent: () => void = () => {}
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve
  })
  const queued = previous.catch(() => undefined).then(() => current)
  apiKeyMutationQueues.set(userId, queued)

  await previous.catch(() => undefined)
  try {
    return await mutation()
  } finally {
    releaseCurrent()
    if (apiKeyMutationQueues.get(userId) === queued) {
      apiKeyMutationQueues.delete(userId)
    }
  }
}

export async function listApiKeys(userId: string): Promise<PublicApiKey[]> {
  const { payload } = await getUserApiKeysPayload(userId)
  return payload.keys.map(toPublicKey)
}

export async function createApiKey(userId: string, name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) {
    throw new Error('API Key 名称不能为空')
  }

  return await withUserApiKeyMutation(userId, async () => {
    const { definitionId, payload } = await getUserApiKeysPayload(userId)
    const kid = crypto.randomUUID()
    const secret = crypto.randomBytes(32).toString('base64url')
    const encodedPayload = base64UrlEncode(JSON.stringify({ uid: userId, kid }))
    const key = `${API_KEY_PREFIX}.${encodedPayload}.${secret}`
    const now = new Date().toISOString()
    const item: StoredApiKey = {
      kid,
      name: trimmedName,
      prefix: `${API_KEY_PREFIX}.${encodedPayload.slice(0, 12)}`,
      secretHash: hashSecret(secret),
      scopes: [...API_KEY_SCOPES],
      status: 'active',
      createdAt: now,
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
    }

    await saveUserApiKeysPayload(userId, definitionId, {
      schemaVersion: 1,
      keys: [item, ...payload.keys],
    })

    return { key, item: toPublicKey(item) }
  })
}

export async function revokeApiKey(userId: string, kid: string) {
  return await withUserApiKeyMutation(userId, async () => {
    const { definitionId, payload } = await getUserApiKeysPayload(userId)
    const now = new Date().toISOString()
    let updatedItem: PublicApiKey | null = null
    const keys = payload.keys.map((item) => {
      if (item.kid !== kid) return item
      const updated = {
        ...item,
        status: 'revoked' as const,
        revokedAt: item.revokedAt || now,
      }
      updatedItem = toPublicKey(updated)
      return updated
    })

    if (!updatedItem) throw new Error('API Key 不存在')

    await saveUserApiKeysPayload(userId, definitionId, { schemaVersion: 1, keys })
    return updatedItem
  })
}

export function parseApiKey(apiKey: string): ParsedApiKey | null {
  const [prefix, encodedPayload, secret] = apiKey.split('.')
  if (prefix !== API_KEY_PREFIX || !encodedPayload || !secret) return null

  try {
    const payload = base64UrlDecodeJson(encodedPayload)
    if (!payload.uid || !payload.kid) return null
    return { userId: payload.uid, kid: payload.kid, secret }
  } catch {
    return null
  }
}

export async function verifyApiKey(apiKey: string) {
  const parsed = parseApiKey(apiKey)
  if (!parsed) return null

  const { payload } = await getUserApiKeysPayload(parsed.userId)
  const item = payload.keys.find((key) => key.kid === parsed.kid)
  if (!item || item.status !== 'active') return null
  if (item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now()) return null
  if (!safeCompare(hashSecret(parsed.secret), item.secretHash)) return null

  await updateApiKeyLastUsedAtSafely(parsed.userId, parsed.kid, parsed.secret)

  return {
    userId: parsed.userId,
    keyId: item.kid,
    scopes: item.scopes,
  }
}

async function updateApiKeyLastUsedAtSafely(userId: string, kid: string, secret: string) {
  try {
    await updateApiKeyLastUsedAt(userId, kid, secret)
  } catch (error) {
    console.warn('Failed to update API key lastUsedAt:', error)
  }
}

async function updateApiKeyLastUsedAt(userId: string, kid: string, secret: string) {
  await withUserApiKeyMutation(userId, async () => {
    const { definitionId, payload } = await getUserApiKeysPayload(userId)
    const item = payload.keys.find((key) => key.kid === kid)
    if (!item || item.status !== 'active') return
    if (item.expiresAt && new Date(item.expiresAt).getTime() <= Date.now()) return
    if (!safeCompare(hashSecret(secret), item.secretHash)) return

    const now = Date.now()
    if (
      item.lastUsedAt &&
      now - new Date(item.lastUsedAt).getTime() < LAST_USED_AT_UPDATE_INTERVAL_MS
    ) {
      return
    }

    const lastUsedAt = new Date(now).toISOString()
    const keys = payload.keys.map((key) => (key.kid === kid ? { ...key, lastUsedAt } : key))
    await saveUserApiKeysPayload(userId, definitionId, { schemaVersion: 1, keys })
  })
}
