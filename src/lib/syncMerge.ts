import type { Progress, QuestionStat, WrongRecord } from './types'
import { emptyProgress } from './progress'
import { emptyPractice, normalizePractice, type PracticeRecords } from './practiceStore'
import { normalizeProgress } from './storage'
import type { ProjectProfile } from '../data/essayModels'

export type SyncPayload = {
  version: 1
  progress: Progress
  practice: PracticeRecords
  projectFacts?: ProjectProfile[]
  caseRead?: string[]
  essayRead?: string[]
}

function mergeStats(a: Record<string, QuestionStat>, b: Record<string, QuestionStat>): Record<string, QuestionStat> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const out: Record<string, QuestionStat> = {}
  for (const id of keys) {
    const sa = a[id]
    const sb = b[id]
    if (!sa) { out[id] = sb; continue }
    if (!sb) { out[id] = sa; continue }
    if (sa.attempts !== sb.attempts) {
      out[id] = sa.attempts > sb.attempts ? sa : sb
    } else {
      out[id] = sa.lastAnswerTime >= sb.lastAnswerTime ? sa : sb
    }
  }
  return out
}

function mergeWrong(
  a: Record<string, WrongRecord>,
  b: Record<string, WrongRecord>,
  statsA: Record<string, QuestionStat>,
  statsB: Record<string, QuestionStat>,
): Record<string, WrongRecord> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const out: Record<string, WrongRecord> = {}
  for (const id of keys) {
    const wa = a[id]
    const wb = b[id]
    if (wa && wb) {
      // 两端都在错题本中：取错次更多或最近更新的记录，保留已选错因
      const primary =
        wa.lastWrongTime !== wb.lastWrongTime
          ? (wa.lastWrongTime > wb.lastWrongTime ? wa : wb)
          : (wa.reviewStage >= wb.reviewStage ? wa : wb)
      const secondary = primary === wa ? wb : wa
      out[id] = {
        ...primary,
        wrongCount: Math.max(wa.wrongCount, wb.wrongCount),
        cause: primary.cause ?? secondary.cause,
      }
    } else if (wa) {
      // 仅本地有：若远端在更晚时间答对并已移出错题本，则尊重远端移出
      const sb = statsB[id]
      if (!(sb && sb.lastCorrect && sb.lastAnswerTime > wa.lastWrongTime && sb.attempts > (statsA[id]?.attempts ?? 0))) {
        out[id] = wa
      }
    } else if (wb) {
      const sa = statsA[id]
      if (!(sa && sa.lastCorrect && sa.lastAnswerTime > wb.lastWrongTime && sa.attempts > (statsB[id]?.attempts ?? 0))) {
        out[id] = wb
      }
    }
  }
  return out
}

export function mergeProgress(local: Progress, remote: Progress): Progress {
  const answered: Record<string, boolean> = { ...remote.answered }
  for (const [id, v] of Object.entries(local.answered)) {
    if (v) answered[id] = true
  }

  const stats = mergeStats(local.stats, remote.stats)
  const wrong = mergeWrong(local.wrong, remote.wrong, local.stats, remote.stats)

  const dailyDates = new Set([...Object.keys(local.daily), ...Object.keys(remote.daily)])
  const daily: Progress['daily'] = {}
  for (const date of dailyDates) {
    const da = local.daily[date]
    const db = remote.daily[date]
    if (!da) daily[date] = db
    else if (!db) daily[date] = da
    else daily[date] = da.answered >= db.answered ? da : db
  }

  const mockMap = new Map<number, Progress['mockHistory'][number]>()
  for (const r of [...remote.mockHistory, ...local.mockHistory]) {
    mockMap.set(r.at, r)
  }
  const mockHistory = [...mockMap.values()].sort((x, y) => x.at - y.at).slice(-20)

  return { version: 2, answered, stats, wrong, daily, mockHistory }
}

function mergeAttemptMap<T extends { at: number }>(
  a: Record<string, T[]>,
  b: Record<string, T[]>,
): Record<string, T[]> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const out: Record<string, T[]> = {}
  for (const key of keys) {
    const byAt = new Map<number, T>()
    for (const item of [...(b[key] ?? []), ...(a[key] ?? [])]) {
      byAt.set(item.at, item)
    }
    out[key] = [...byAt.values()].sort((x, y) => x.at - y.at)
  }
  return out
}

export function mergePractice(local: PracticeRecords, remote: PracticeRecords): PracticeRecords {
  const drafts: PracticeRecords['drafts'] = { ...remote.drafts }
  for (const [k, v] of Object.entries(local.drafts)) {
    drafts[k] = { ...(drafts[k] ?? {}), ...v }
  }
  return {
    version: 1,
    cases: mergeAttemptMap(local.cases, remote.cases),
    outlines: mergeAttemptMap(local.outlines, remote.outlines),
    drafts,
  }
}

function mergeProfiles(local?: ProjectProfile[], remote?: ProjectProfile[]): ProjectProfile[] | undefined {
  if (!local && !remote) return undefined
  const map = new Map<string, ProjectProfile>()
  for (const p of [...(remote ?? []), ...(local ?? [])]) {
    if (p && typeof p.id === 'string') map.set(p.id, p)
  }
  return [...map.values()]
}

function mergeStrings(a?: string[], b?: string[]): string[] {
  return [...new Set([...(b ?? []), ...(a ?? [])])]
}

export function normalizeSyncPayload(raw: unknown, now: number): SyncPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  return {
    version: 1,
    progress: obj.progress ? normalizeProgress(obj.progress, now) : emptyProgress(),
    practice: obj.practice ? normalizePractice(obj.practice) : emptyPractice(),
    projectFacts: Array.isArray(obj.projectFacts) ? (obj.projectFacts as ProjectProfile[]) : undefined,
    caseRead: Array.isArray(obj.caseRead) ? obj.caseRead.filter((x): x is string => typeof x === 'string') : [],
    essayRead: Array.isArray(obj.essayRead) ? obj.essayRead.filter((x): x is string => typeof x === 'string') : [],
  }
}

export function mergeSyncPayload(local: SyncPayload, remote: SyncPayload | null): SyncPayload {
  if (!remote) return local
  return {
    version: 1,
    progress: mergeProgress(local.progress, remote.progress),
    practice: mergePractice(local.practice, remote.practice),
    projectFacts: mergeProfiles(local.projectFacts, remote.projectFacts),
    caseRead: mergeStrings(local.caseRead, remote.caseRead),
    essayRead: mergeStrings(local.essayRead, remote.essayRead),
  }
}
