import { describe, expect, it, beforeEach } from 'vitest'
import { loadProgress, saveProgress, migrateLegacyProgress } from './storage'

describe('progress storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns an empty valid state for invalid storage', () => {
    localStorage.setItem('gaoxiang-2027-progress-v1', '{bad')
    expect(loadProgress()).toEqual({ answered: {}, wrong: {} })
  })

  it('persists progress', () => {
    saveProgress({
      answered: { one: true },
      wrong: { one: { id: 'one', wrongCount: 1, lastWrongTime: 100 } },
    })
    const loaded = loadProgress()
    expect(loaded.answered).toEqual({ one: true })
    expect(loaded.wrong.one).toBeDefined()
    expect(loaded.wrong.one.id).toBe('one')
    expect(loaded.wrong.one.wrongCount).toBe(1)
  })

  it('migrates legacy array format', () => {
    localStorage.setItem('gaoxiang-2027-progress-v1', JSON.stringify({ answered: {}, wrong: ['a', 'b'] }))
    migrateLegacyProgress()
    const loaded = loadProgress()
    expect(loaded.wrong.a).toBeDefined()
    expect(loaded.wrong.a.wrongCount).toBe(1)
    expect(loaded.wrong.b).toBeDefined()
  })

  it('wrong count increments on repeat wrong answers', () => {
    saveProgress({
      answered: {},
      wrong: { q1: { id: 'q1', wrongCount: 2, lastWrongTime: Date.now() } },
    })
    const loaded = loadProgress()
    expect(loaded.wrong.q1.wrongCount).toBe(2)
  })
})
