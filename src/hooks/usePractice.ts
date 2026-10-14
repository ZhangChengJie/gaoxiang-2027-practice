import { useSyncExternalStore } from 'react'
import { loadPractice, normalizePractice, PRACTICE_KEY, savePractice } from '../lib/practiceStore'
import type { PracticeRecords } from '../lib/practiceStore'

let current: PracticeRecords | undefined
const listeners = new Set<() => void>()
function getSnapshot(): PracticeRecords {
  current ??= loadPractice()
  return current
}
function notify(): void {
  for (const listener of listeners) listener()
}
function onStorage(event: StorageEvent): void {
  if (event.key !== PRACTICE_KEY && event.key !== null) return
  // Accessing localStorage itself can throw when browser storage is disabled.
  try {
    if (event.storageArea !== null && event.storageArea !== window.localStorage) return
  } catch {
    return
  }
  current = loadPractice()
  notify()
}
function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    current = loadPractice()
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
  }
  listeners.add(listener)
  listener()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
  }
}
function setRecords(next: PracticeRecords): void {
  current = normalizePractice(next)
  savePractice(current)
  notify()
}
export function usePractice() {
  const records = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { records, setRecords }
}
