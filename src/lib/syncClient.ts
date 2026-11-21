import { loadProgress } from './storage'
import { loadPractice, savePractice } from './practiceStore'
import { mergeSyncPayload, normalizeSyncPayload, type SyncPayload } from './syncMerge'
import type { ProjectProfile } from '../data/essayModels'
import type { Progress } from './types'
import type { PracticeRecords } from './practiceStore'

const SYNC_CODE_KEY = 'gaoxiang-2027-sync-code'
const LAST_SYNC_KEY = 'gaoxiang-2027-last-sync-at'
const PROJECT_FACTS_KEY = 'gaoxiang-2027-project-facts-v1'
const CASE_READ_KEY = 'gaoxiang-2027-case-read'
const ESSAY_READ_KEY = 'gaoxiang-2027-essay-read'

export const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{5,31}$/

export function getSyncCode(): string {
  try {
    return localStorage.getItem(SYNC_CODE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setSyncCode(raw: string): string {
  const code = raw.trim().toLowerCase()
  try {
    if (code) localStorage.setItem(SYNC_CODE_KEY, code)
    else localStorage.removeItem(SYNC_CODE_KEY)
  } catch {
    // 忽略
  }
  return code
}

export function getLastSyncAt(): number {
  try {
    const n = Number(localStorage.getItem(LAST_SYNC_KEY) ?? '0')
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

function setLastSyncAt(ts: number) {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(ts))
  } catch {
    // 忽略
  }
}

export function generateSyncCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const pick = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `gx-${pick(4)}-${pick(4)}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 忽略
  }
}

export function collectLocalPayload(): SyncPayload {
  return {
    version: 1,
    progress: loadProgress(),
    practice: loadPractice(),
    projectFacts: readJson<ProjectProfile[] | undefined>(PROJECT_FACTS_KEY, undefined),
    caseRead: readJson<string[]>(CASE_READ_KEY, []),
    essayRead: readJson<string[]>(ESSAY_READ_KEY, []),
  }
}

export type SyncCallbacks = {
  applyProgress: (p: Progress) => void
  applyPractice: (r: PracticeRecords) => void
}

export type SyncResult = {
  ok: true
  updatedAt: number
  mergedAnswered: number
  mergedWrong: number
  pulledRemote: boolean
}

export async function performSync(rawCode: string, callbacks: SyncCallbacks): Promise<SyncResult> {
  const code = rawCode.trim().toLowerCase()
  if (!CODE_PATTERN.test(code)) {
    throw new Error('同步口令需为 6–32 位字母、数字、短横线或下划线')
  }

  const getRes = await fetch(`/api/sync?code=${encodeURIComponent(code)}`, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!getRes.ok) {
    const err = (await getRes.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || `拉取云端失败（${getRes.status}）`)
  }
  const getData = (await getRes.json()) as { exists: boolean; updatedAt: number; data: unknown }

  const now = Date.now()
  const local = collectLocalPayload()
  const remote = getData.exists ? normalizeSyncPayload(getData.data, now) : null
  const merged = mergeSyncPayload(local, remote)

  // 写回本地全部状态
  callbacks.applyProgress(merged.progress)
  savePractice(merged.practice)
  callbacks.applyPractice(merged.practice)
  if (merged.projectFacts && merged.projectFacts.length > 0) {
    writeJson(PROJECT_FACTS_KEY, merged.projectFacts)
  }
  if (merged.caseRead) writeJson(CASE_READ_KEY, merged.caseRead)
  if (merged.essayRead) writeJson(ESSAY_READ_KEY, merged.essayRead)

  // 上传合并结果到云端
  const putRes = await fetch(`/api/sync?code=${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(merged),
    cache: 'no-store',
  })
  if (!putRes.ok) {
    const err = (await putRes.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || `上传云端失败（${putRes.status}）`)
  }
  const putData = (await putRes.json()) as { updatedAt?: number }
  const updatedAt = putData.updatedAt ?? now
  setLastSyncAt(updatedAt)

  return {
    ok: true,
    updatedAt,
    mergedAnswered: Object.keys(merged.progress.answered).length,
    mergedWrong: Object.keys(merged.progress.wrong).length,
    pulledRemote: Boolean(remote),
  }
}
