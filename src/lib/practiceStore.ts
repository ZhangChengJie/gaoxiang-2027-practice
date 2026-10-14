import type { CasePractice } from '../data/casePractice'

export const PRACTICE_KEY = 'gaoxiang-2027-practice-v1'
export type CaseAttempt = { at: number; answers: Record<string, string>; hits: string[]; score: number; total: number }
export type OutlineAttempt = { at: number; text: string; checked: string[]; total: number }
export type PracticeRecords = {
  version: 1
  cases: Record<string, CaseAttempt[]>
  outlines: Record<string, OutlineAttempt[]>
  drafts: Record<string, Record<string, string>>
}

type RawObject = Record<string, unknown>
function object(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
// Treat keys as data: never assign untrusted names through a prototype setter.
function map<T>(raw: unknown, read: (value: unknown) => T | undefined): Record<string, T> {
  if (!object(raw)) return {}
  return Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => {
    if (!key.trim()) return []
    const result = read(value)
    return result === undefined ? [] : [[key, result]]
  }))
}
function strings(raw: unknown): Record<string, string> {
  return map(raw, (value) => typeof value === 'string' ? value : undefined)
}
function ids(raw: unknown): string[] {
  return Array.isArray(raw)
    ? [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
    : []
}
function caseAttempt(raw: unknown): CaseAttempt | undefined {
  if (!object(raw) || !nonnegative(raw.at) || !nonnegative(raw.score) || !nonnegative(raw.total)
    || raw.score > raw.total) return undefined
  return { at: raw.at, answers: strings(raw.answers), hits: ids(raw.hits), score: raw.score, total: raw.total }
}
function outlineAttempt(raw: unknown): OutlineAttempt | undefined {
  if (!object(raw) || !nonnegative(raw.at) || typeof raw.text !== 'string'
    || !nonnegative(raw.total) || !Number.isInteger(raw.total)) return undefined
  return { at: raw.at, text: raw.text, checked: ids(raw.checked), total: raw.total }
}
// Oldest first; a stable sort keeps submission order for equal timestamps.
function recent<T extends { at: number }>(raw: unknown, read: (value: unknown) => T | undefined): T[] | undefined {
  if (!Array.isArray(raw)) return undefined
  return raw.flatMap((value) => {
    const attempt = read(value)
    return attempt === undefined ? [] : [attempt]
  }).sort((a, b) => a.at - b.at).slice(-10)
}
export function emptyPractice(): PracticeRecords {
  return { version: 1, cases: {}, outlines: {}, drafts: {} }
}
export function normalizePractice(raw: unknown): PracticeRecords {
  if (!object(raw) || (raw.version !== undefined && raw.version !== 1)) return emptyPractice()
  return {
    version: 1,
    cases: map(raw.cases, (value) => recent(value, caseAttempt)),
    outlines: map(raw.outlines, (value) => recent(value, outlineAttempt)),
    drafts: map(raw.drafts, (value) => object(value) ? strings(value) : undefined),
  }
}
export function loadPractice(): PracticeRecords {
  try {
    return normalizePractice(JSON.parse(localStorage.getItem(PRACTICE_KEY) ?? 'null'))
  } catch {
    return emptyPractice()
  }
}
export function savePractice(r: PracticeRecords): void {
  try {
    localStorage.setItem(PRACTICE_KEY, JSON.stringify(normalizePractice(r)))
  } catch {
    // The in-memory hook remains usable if storage is unavailable or full.
  }
}
export function scoreCase(practice: CasePractice, hits: string[]): {
  score: number; total: number; byQuestion: Record<string, { score: number; total: number }>
} {
  const selected = new Set(hits)
  const byQuestion = Object.fromEntries(practice.questions.map((q) => [q.id, {
    score: q.scoringPoints.reduce((sum, point) => sum + (selected.has(point.id) ? point.score : 0), 0),
    total: q.score,
  }]))
  return {
    score: Object.values(byQuestion).reduce((sum, q) => sum + q.score, 0),
    total: Object.values(byQuestion).reduce((sum, q) => sum + q.total, 0),
    byQuestion,
  }
}
export function recordCaseAttempt(r: PracticeRecords, caseId: string, attempt: CaseAttempt): PracticeRecords {
  const base = normalizePractice(r)
  if (!caseId.trim()) return base
  const previous = Object.hasOwn(base.cases, caseId) ? base.cases[caseId] : []
  return { ...base, cases: { ...base.cases, [caseId]: recent([...previous, attempt], caseAttempt) ?? [] } }
}
export function recordOutlineAttempt(r: PracticeRecords, essayId: string, attempt: OutlineAttempt): PracticeRecords {
  const base = normalizePractice(r)
  if (!essayId.trim()) return base
  const previous = Object.hasOwn(base.outlines, essayId) ? base.outlines[essayId] : []
  return { ...base, outlines: { ...base.outlines, [essayId]: recent([...previous, attempt], outlineAttempt) ?? [] } }
}
export function saveDraft(r: PracticeRecords, key: string, field: string, text: string): PracticeRecords {
  if (!key.trim() || !field.trim()) return r
  const previous = Object.hasOwn(r.drafts, key) ? r.drafts[key] : {}
  return { ...r, drafts: { ...r.drafts, [key]: { ...previous, [field]: text } } }
}
export function clearDraft(r: PracticeRecords, key: string): PracticeRecords {
  const drafts = Object.fromEntries(Object.entries(r.drafts).filter(([id]) => id !== key))
  return { ...r, drafts }
}
export function bestCaseScore(r: PracticeRecords, caseId: string): number | null {
  const attempts = Object.hasOwn(r.cases, caseId) ? r.cases[caseId] : []
  return attempts.length ? attempts.reduce((best, attempt) => Math.max(best, attempt.score), 0) : null
}
export function latestOutline(r: PracticeRecords, essayId: string): OutlineAttempt | null {
  const attempts = Object.hasOwn(r.outlines, essayId) ? r.outlines[essayId] : []
  return attempts.reduce<OutlineAttempt | null>((latest, attempt) =>
    latest === null || attempt.at >= latest.at ? attempt : latest, null)
}
