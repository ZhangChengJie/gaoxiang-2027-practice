import { emptyProgress, localDateKey } from './progress'
import type { ErrorCause, MockResult, Progress } from './types'

export const STORAGE_KEY = 'gaoxiang-2027-progress-v1'
const APP = 'gaoxiang-2027-practice'
const causes: readonly ErrorCause[] = ['unknown', 'hesitant', 'careless', 'slow']

type RawObject = Record<string, unknown>
function isObject(value: unknown): value is RawObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
function count(value: unknown, fallback = 0): number {
  return finite(value) && Number.isInteger(value) ? value : fallback
}
function timestamp(value: unknown, fallback: number): number {
  return finite(value) ? value : fallback
}
function mapRecords<T>(raw: unknown, normalize: (value: unknown, key: string) => T | undefined): Record<string, T> {
  if (!isObject(raw)) return {}
  return Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => {
    if (!key) return []
    const result = normalize(value, key)
    return result === undefined ? [] : [[key, result]]
  }))
}
function normalizeMock(value: unknown): MockResult | undefined {
  if (!isObject(value) || !finite(value.at) || !finite(value.durationSec)
    || !finite(value.total) || !Number.isInteger(value.total)
    || !finite(value.correct) || !Number.isInteger(value.correct)) return undefined
  return {
    at: value.at, durationSec: value.durationSec,
    total: value.total, correct: Math.min(value.correct, value.total),
    byChapter: mapRecords(value.byChapter, (chapter) => {
      if (!isObject(chapter)) return undefined
      const total = count(chapter.total)
      return { total, correct: Math.min(count(chapter.correct), total) }
    }),
  }
}

export function normalizeProgress(raw: unknown, now: number): Progress {
  if (!isObject(raw)) return emptyProgress()
  const wrong = Array.isArray(raw.wrong)
    ? Object.fromEntries(raw.wrong.filter((id): id is string => typeof id === 'string' && id.length > 0)
      .map((id) => [id, { id, wrongCount: 1, lastWrongTime: now, reviewStage: 0, nextReviewAt: now }]))
    : mapRecords(raw.wrong, (value, id) => {
      if (!isObject(value)) return undefined
      const lastWrongTime = timestamp(value.lastWrongTime, now)
      const cause = causes.includes(value.cause as ErrorCause) ? value.cause as ErrorCause : undefined
      return {
        id, wrongCount: Math.max(1, count(value.wrongCount, 1)), lastWrongTime,
        ...(cause === undefined ? {} : { cause }),
        reviewStage: count(value.reviewStage) <= 3 ? count(value.reviewStage) : 0,
        nextReviewAt: timestamp(value.nextReviewAt, lastWrongTime),
      }
    })
  return {
    version: 2,
    answered: mapRecords(raw.answered, (value) => typeof value === 'boolean' ? value : undefined),
    stats: mapRecords(raw.stats, (value) => {
      if (!isObject(value)) return undefined
      const attempts = count(value.attempts)
      return {
        attempts, correct: Math.min(count(value.correct), attempts),
        lastAnswerTime: timestamp(value.lastAnswerTime, 0), lastCorrect: value.lastCorrect === true,
      }
    }),
    wrong,
    daily: mapRecords(raw.daily, (value, key) => {
      if (!isObject(value) || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return undefined
      const date = new Date(`${key}T12:00:00`).getTime()
      if (!Number.isFinite(date) || localDateKey(date) !== key) return undefined
      const answered = count(value.answered)
      return { answered, correct: Math.min(count(value.correct), answered) }
    }),
    mockHistory: Array.isArray(raw.mockHistory)
      ? raw.mockHistory.flatMap((value) => {
        const result = normalizeMock(value)
        return result ? [result] : []
      }).slice(-20) : [],
  }
}

export function loadProgress(): Progress {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'), Date.now())
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(p: Progress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function exportProgress(p: Progress, now: number): string {
  return JSON.stringify({ app: APP, exportedAt: now, progress: p })
}

export function importProgress(text: string, now: number): Progress {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON')
  }
  if (isObject(raw) && Object.hasOwn(raw, 'app')) {
    if (raw.app !== APP) throw new Error('这不是本应用导出的进度文件')
    raw = raw.progress
  }
  if (!isObject(raw) || !['version', 'answered', 'stats', 'wrong', 'daily', 'mockHistory']
    .some((key) => Object.hasOwn(raw, key))) {
    throw new Error('文件中缺少有效的进度数据')
  }
  return normalizeProgress(raw, now)
}
