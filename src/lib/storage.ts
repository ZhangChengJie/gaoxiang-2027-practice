export type Progress = { answered: Record<string, boolean>; wrong: string[] }
const KEY = 'gaoxiang-2027-progress-v1'
export function loadProgress(): Progress {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return { answered: value.answered ?? {}, wrong: Array.isArray(value.wrong) ? value.wrong : [] } }
  catch { return { answered: {}, wrong: [] } }
}
export function saveProgress(progress: Progress) { localStorage.setItem(KEY, JSON.stringify(progress)) }
