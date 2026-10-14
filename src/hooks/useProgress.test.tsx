import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAnswer, emptyProgress } from '../lib/progress'
import { loadProgress, saveProgress, STORAGE_KEY } from '../lib/storage'
import type { Question } from '../lib/types'
import { useProgress } from './useProgress'

const q: Question = { id: 'a', chapter: 'chapter', text: '题目', options: ['A'], answer: 0, explanation: '解析' }
const now = 1000000000
function Consumer({ name }: { name: string }) {
  const { progress, update, totalStats } = useProgress()
  return <div>
    <button onClick={() => update(q, false)}>答错 {name}</button>
    <output data-testid={name}>{JSON.stringify({ progress, totalStats })}</output>
  </div>
}

describe('useProgress:', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(Date, 'now').mockReturnValue(now)
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('两个组件各自调用 hook，一个 update 后另一个立即看到，连续作答不丢更新', () => {
    render(<><Consumer name="first" /><Consumer name="second" /></>)
    fireEvent.click(screen.getByText('答错 first'))
    const second = JSON.parse(screen.getByTestId('second').textContent!)
    expect(second.progress.stats.a.attempts).toBe(1)
    expect(second.totalStats).toEqual({ answeredCount: 1, wrongCount: 1, dueCount: 1 })
    fireEvent.click(screen.getByText('答错 second'))
    expect(screen.getByTestId('first').textContent).toBe(screen.getByTestId('second').textContent)
    expect(loadProgress().wrong.a.wrongCount).toBe(2)
  })

  it('保留原有方法，新增方法同步、保存并替换完整状态', () => {
    const first = renderHook(() => useProgress())
    const second = renderHook(() => useProgress())
    act(() => first.result.current.update(q, false))
    act(() => first.result.current.setCause(q.id, 'slow'))
    expect(second.result.current.progress.wrong.a.cause).toBe('slow')
    expect(first.result.current.wrongQuestions([q])).toEqual([q])
    expect(second.result.current.chapterProgress([q])).toEqual({ total: 1, done: 1, percent: 100 })
    expect(second.result.current.chapterProgress([])).toEqual({ total: 0, done: 0, percent: 0 })
    act(() => second.result.current.recordMockResult({ at: now, total: 1, correct: 1, durationSec: 60, byChapter: {} }))
    expect(first.result.current.progress.mockHistory).toHaveLength(1)
    act(() => first.result.current.clearWrong('a'))
    expect(second.result.current.wrongQuestions([q])).toEqual([])
    act(() => first.result.current.update(q, false))
    act(() => first.result.current.clearAllWrong())
    expect(second.result.current.totalStats.wrongCount).toBe(0)
    expect(loadProgress()).toEqual(second.result.current.progress)
    act(() => second.result.current.replaceProgress(emptyProgress()))
    expect(first.result.current.progress).toEqual(emptyProgress())
    expect(loadProgress()).toEqual(emptyProgress())
  })

  it('storage 事件同步其它标签页的写入和清空，忽略其它 key 和 sessionStorage', () => {
    const first = renderHook(() => useProgress())
    const second = renderHook(() => useProgress())
    const p = applyAnswer(emptyProgress(), q.id, false, now)
    saveProgress(p)
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', storageArea: localStorage })))
    expect(first.result.current.progress.wrong).toEqual({})
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, storageArea: sessionStorage })))
    expect(first.result.current.progress.wrong).toEqual({})
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, storageArea: localStorage })))
    expect(first.result.current.progress).toEqual(p)
    expect(second.result.current.progress).toEqual(p)
    localStorage.clear()
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage })))
    expect(first.result.current.progress).toEqual(emptyProgress())
    expect(second.result.current.progress).toEqual(emptyProgress())
  })

  it('所有实例卸载后重新挂载，读取最新存储', () => {
    const first = renderHook(() => useProgress())
    act(() => first.result.current.update(q, false))
    first.unmount()
    localStorage.clear()
    const second = renderHook(() => useProgress())
    expect(second.result.current.progress).toEqual(emptyProgress())
  })
})
