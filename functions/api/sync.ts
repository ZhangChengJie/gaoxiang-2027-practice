interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Env {
  SYNC_KV: KVNamespace
}

interface PagesContext {
  request: Request
  env: Env
}

const MAX_BYTES = 512 * 1024
const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{5,31}$/

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS })
}

function normalizeCode(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  return CODE_PATTERN.test(trimmed) ? trimmed : null
}

async function hashKey(code: string): Promise<string> {
  const data = new TextEncoder().encode(`gaoxiang-2027-sync:${code}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `sync:${hex}`
}

export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  if (!ctx.env.SYNC_KV) {
    return json({ error: '云同步存储尚未配置' }, 503)
  }
  const url = new URL(ctx.request.url)
  const code = normalizeCode(url.searchParams.get('code'))
  if (!code) {
    return json({ error: '同步口令需为 6–32 位字母、数字、短横线或下划线' }, 400)
  }
  const key = await hashKey(code)
  const stored = await ctx.env.SYNC_KV.get(key)
  if (!stored) {
    return json({ exists: false, updatedAt: 0, data: null })
  }
  try {
    const parsed = JSON.parse(stored) as { updatedAt: number; data: unknown }
    return json({ exists: true, updatedAt: parsed.updatedAt ?? 0, data: parsed.data ?? null })
  } catch {
    return json({ exists: false, updatedAt: 0, data: null })
  }
}

export const onRequestPut = async (ctx: PagesContext): Promise<Response> => {
  if (!ctx.env.SYNC_KV) {
    return json({ error: '云同步存储尚未配置' }, 503)
  }
  const url = new URL(ctx.request.url)
  const code = normalizeCode(url.searchParams.get('code'))
  if (!code) {
    return json({ error: '同步口令需为 6–32 位字母、数字、短横线或下划线' }, 400)
  }
  const rawBody = await ctx.request.text()
  if (rawBody.length > MAX_BYTES) {
    return json({ error: '同步数据超过 512KB 上限' }, 413)
  }
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: '无效的 JSON 数据' }, 400)
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return json({ error: '同步数据格式不正确' }, 400)
  }
  const updatedAt = Date.now()
  const key = await hashKey(code)
  await ctx.env.SYNC_KV.put(key, JSON.stringify({ updatedAt, data: payload }))
  return json({ ok: true, updatedAt })
}
