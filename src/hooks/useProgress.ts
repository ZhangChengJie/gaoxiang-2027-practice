import { useCallback, useSyncExternalStore } from 'react'
import { loadProgress, saveProgress, STORAGE_KEY } from '../lib/storage'
import {
  applyAnswer, clearAllWrong as clearWrongRecords, dueWrongIds, recordMock,
  removeWrong, setWrongCause,
} from '../lib/progress'
import type { ErrorCause, MockResult, Progress, Question } from '../lib/types'

let current: Progress | undefined
const listeners = new Set<() => void>()
function getSnapshot(): Progress {
  current ??= loadProgress()
  return current
}
function notify(): void {
  for (const listener of listeners) listener()
}
function onStorage(event: StorageEvent): void {
  if ((event.key !== STORAGE_KEY && event.key !== null)
    || (event.storageArea !== null && event.storageArea !== window.localStorage)) return
  current = loadProgress()
  notify()
}
function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    // Refresh after periods without mounted consumers, when other tabs may have written.
    current = loadProgress()
    window.addEventListener('storage', onStorage)
  }
  listeners.add(listener)
  listener()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}
function replaceProgress(p: Progress): void {
  saveProgress(p)
  current = p
  notify()
}
function update(q: Question, right: boolean): void {
  replaceProgress(applyAnswer(getSnapshot(), q.id, right, Date.now()))
}
function setCause(id: string, cause: ErrorCause): void {
  replaceProgress(setWrongCause(getSnapshot(), id, cause))
}
function clearWrong(id: string): void {
  replaceProgress(removeWrong(getSnapshot(), id))
}
function clearAllWrong(): void {
  replaceProgress(clearWrongRecords(getSnapshot()))
}
function recordMockResult(r: MockResult): void {
  replaceProgress(recordMock(getSnapshot(), r))
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const wrongQuestions = useCallback((allQuestions: Question[]) => {
    return allQuestions.filter((q) => progress.wrong[q.id])
  }, [progress.wrong])
  const chapterProgress = useCallback((qs: Question[]) => {
    const total = qs.length
    const done = qs.filter((q) => progress.answered[q.id]).length
    return { total, done, percent: total > 0 ? Math.round(done / total * 100) : 0 }
  }, [progress.answered])
  const totalStats = {
    answeredCount: Object.values(progress.answered).filter(Boolean).length,
    wrongCount: Object.keys(progress.wrong).length,
    dueCount: dueWrongIds(progress, Date.now()).length,
  }
  return {
    progress, update, setCause, clearWrong, clearAllWrong, recordMockResult, replaceProgress,
    chapterProgress, totalStats, wrongQuestions,
  }
}
