import type { DailyStat, ErrorCause, MockResult, Progress, WrongRecord } from './types'

export const ERROR_CAUSE_LABELS: Record<ErrorCause, string> = {
  unknown: '不会', hesitant: '犹豫', careless: '粗心', slow: '会但慢',
}
export const REVIEW_INTERVALS_DAYS = [1, 3, 7] as const
const DAY_MS = 24 * 60 * 60 * 1000

export function emptyProgress(): Progress {
  return { version: 2, answered: {}, stats: {}, wrong: {}, daily: {}, mockHistory: [] }
}

export function localDateKey(now: number): string {
  const date = new Date(now)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function applyAnswer(p: Progress, questionId: string, right: boolean, now: number): Progress {
  const stat = p.stats[questionId]
  const date = localDateKey(now)
  const day = todayStat(p, now)
  const wrong = { ...p.wrong }
  const existing = wrong[questionId]
  if (!right) {
    wrong[questionId] = {
      ...existing, id: questionId, wrongCount: (existing?.wrongCount ?? 0) + 1,
      lastWrongTime: now, reviewStage: 0, nextReviewAt: now,
    }
  } else if (existing && isDue(existing, now)) {
    const reviewStage = existing.reviewStage + 1
    if (reviewStage > REVIEW_INTERVALS_DAYS.length) {
      delete wrong[questionId]
    } else {
      wrong[questionId] = {
        ...existing, reviewStage,
        nextReviewAt: now + REVIEW_INTERVALS_DAYS[reviewStage - 1] * DAY_MS,
      }
    }
  }
  return {
    ...p,
    answered: { ...p.answered, [questionId]: true },
    stats: {
      ...p.stats,
      [questionId]: {
        attempts: (stat?.attempts ?? 0) + 1, correct: (stat?.correct ?? 0) + Number(right),
        lastAnswerTime: now, lastCorrect: right,
      },
    },
    wrong,
    daily: { ...p.daily, [date]: { answered: day.answered + 1, correct: day.correct + Number(right) } },
  }
}

export function setWrongCause(p: Progress, questionId: string, cause: ErrorCause): Progress {
  const record = p.wrong[questionId]
  if (!record) return p
  return { ...p, wrong: { ...p.wrong, [questionId]: { ...record, cause } } }
}

export function removeWrong(p: Progress, questionId: string): Progress {
  const wrong = { ...p.wrong }
  delete wrong[questionId]
  return { ...p, wrong }
}

export function clearAllWrong(p: Progress): Progress {
  return { ...p, wrong: {} }
}

export function isDue(record: WrongRecord, now: number): boolean {
  return now >= record.nextReviewAt
}

export function dueWrongIds(p: Progress, now: number): string[] {
  return Object.keys(p.wrong)
    .filter((id) => isDue(p.wrong[id], now))
    .sort((a, b) => p.wrong[a].nextReviewAt - p.wrong[b].nextReviewAt
      || p.wrong[b].wrongCount - p.wrong[a].wrongCount)
}

export function accuracyOf(p: Progress, questionIds: string[]): {
  attempted: number; attempts: number; correct: number; accuracy: number | null
} {
  let attempted = 0
  let attempts = 0
  let correct = 0
  for (const id of new Set(questionIds)) {
    const stat = p.stats[id]
    if (p.answered[id] || stat?.attempts > 0) attempted++
    attempts += stat?.attempts ?? 0
    correct += stat?.correct ?? 0
  }
  return { attempted, attempts, correct, accuracy: attempts ? correct / attempts : null }
}

export function todayStat(p: Progress, now: number): DailyStat {
  return p.daily[localDateKey(now)] ?? { answered: 0, correct: 0 }
}

export function recordMock(p: Progress, result: MockResult): Progress {
  return { ...p, mockHistory: [...p.mockHistory, result].slice(-20) }
}
