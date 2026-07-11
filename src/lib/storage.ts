import type { WrongRecord, Progress } from './types'

const KEY = 'gaoxiang-2027-progress-v1'

export function loadProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return {
      answered: value.answered ?? {},
      wrong: parseWrongRecords(value.wrong),
    }
  } catch {
    return { answered: {}, wrong: {} }
  }
}

function parseWrongRecords(raw: unknown): Record<string, WrongRecord> {
  if (typeof raw !== 'object' || raw === null) return {}
  const records: Record<string, WrongRecord> = {}
  for (const [id, val] of Object.entries(raw)) {
    if (typeof val === 'object' && val !== null) {
      const v = val as Record<string, unknown>
      records[id] = {
        id: String(v.id ?? id),
        wrongCount: typeof v.wrongCount === 'number' ? v.wrongCount : 1,
        lastWrongTime: typeof v.lastWrongTime === 'number' ? v.lastWrongTime : Date.now(),
      }
    }
  }
  return records
}

export function saveProgress(progress: Progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

// Legacy migration: old format was wrong: string[]
// If old format detected, convert to new format
export function migrateLegacyProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return
    const value = JSON.parse(raw)
    if (Array.isArray(value.wrong)) {
      const wrong: Record<string, WrongRecord> = {}
      for (const id of value.wrong) {
        wrong[id] = { id, wrongCount: 1, lastWrongTime: Date.now() }
      }
      const progress: Progress = { answered: value.answered ?? {}, wrong }
      saveProgress(progress)
    }
  } catch {
    // ignore migration errors
  }
}
