import { describe, expect, it, beforeEach } from 'vitest'
import { loadProgress, saveProgress } from './storage'

describe('progress storage', () => {
  beforeEach(() => localStorage.clear())
  it('returns an empty valid state for invalid storage', () => {
    localStorage.setItem('gaoxiang-2027-progress-v1', '{bad')
    expect(loadProgress()).toEqual({ answered: {}, wrong: [] })
  })
  it('persists progress', () => {
    saveProgress({ answered: { one: true }, wrong: ['one'] })
    expect(loadProgress()).toEqual({ answered: { one: true }, wrong: ['one'] })
  })
})
