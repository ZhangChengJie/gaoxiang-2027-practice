import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { casePractices } from '../data/casePractice'
import { usePractice } from '../hooks/usePractice'
import {
  bestCaseScore, clearDraft, emptyPractice, latestOutline, loadPractice, normalizePractice,
  PRACTICE_KEY, recordCaseAttempt, recordOutlineAttempt, saveDraft, savePractice, scoreCase,
} from './practiceStore'
import type { CaseAttempt, OutlineAttempt } from './practiceStore'

const attempt = (at = 1, score = 10): CaseAttempt => ({ at, answers: { q: '分条作答\n第二点' }, hits: ['p'], score, total: 25 })
const outline = (at = 1): OutlineAttempt => ({ at, text: '摘要\n背景\n主体\n结尾', checked: ['a'], total: 9 })

describe('practiceStore:', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('空记录每次新建，异常根类型和未知版本返回空', () => {
    const first = emptyPractice(), second = emptyPractice()
    first.drafts.x = { q: '草稿' }
    expect(second).toEqual({ version: 1, cases: {}, outlines: {}, drafts: {} })
    for (const raw of [null, undefined, [], 'text', 12, true, { version: 2 }, { version: '1' }]) {
      expect(normalizePractice(raw)).toEqual(second)
    }
    expect(normalizePractice({})).toEqual(second)
    expect(normalizePractice({ cases: [], outlines: null, drafts: 3 })).toEqual(second)
  })

  it('逐字段丢弃非法内容、去重 id、不改变输入', () => {
    const raw = {
      version: 1,
      cases: {
        x: [
          { ...attempt(), answers: { q: '完整作答', empty: '', bad: 12, none: null }, hits: ['p', 'p', '', '  ', 8, 'other'], extra: true },
          { ...attempt(2), answers: [], hits: false },
          null, {}, { ...attempt(), at: -1 }, { ...attempt(), at: NaN },
          { ...attempt(), score: Infinity }, { ...attempt(), score: -1 },
          { ...attempt(), total: '25' }, { ...attempt(), score: 26 },
        ],
        bad: 'array expected', '': [attempt()],
      },
      outlines: {
        y: [{ ...outline(), checked: ['a', 'a', '', 1, 'b'], extra: true },
          { ...outline(2), checked: null }, null, {}, { ...outline(), text: 1 },
          { ...outline(), at: Infinity }, { ...outline(), total: -1 }, { ...outline(), total: 1.5 }],
        bad: {},
      },
      drafts: { good: { q: '草稿', empty: '', bad: false }, bad: null, array: [], '': {} },
      unrelated: true,
    }
    const original = structuredClone(raw)
    const result = normalizePractice(raw)
    expect(result.cases).toEqual({ x: [
      { ...attempt(), answers: { q: '完整作答', empty: '' }, hits: ['p', 'other'] },
      { ...attempt(2), answers: {}, hits: [] },
    ] })
    expect(result.outlines).toEqual({ y: [{ ...outline(), checked: ['a', 'b'] }, { ...outline(2), checked: [] }] })
    expect(result.drafts).toEqual({ good: { q: '草稿', empty: '' } })
    expect(result).not.toHaveProperty('unrelated')
    expect(raw).toEqual(original)
  })

  it('按时间保留最近 10 条，非法记录不占名额，时间相同保持输入顺序', () => {
    const cases = Array.from({ length: 15 }, (_, i) => attempt(i)).reverse()
    const outlines = Array.from({ length: 15 }, (_, i) => outline(i)).reverse()
    const result = normalizePractice({ cases: { x: [...cases, null, {}] }, outlines: { y: [...outlines, {}] } })
    expect(result.cases.x.map((a) => a.at)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    expect(result.outlines.y.map((a) => a.at)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    const sameTime = normalizePractice({ cases: { x: [attempt(1, 2), attempt(1, 3)] } })
    expect(sameTime.cases.x.map((a) => a.score)).toEqual([2, 3])
    expect(cases[0].at).toBe(14)
  })

  it('scoreCase 忽略未知项和重复项，逐问给分及满分正确，不改 hits', () => {
    const practice = casePractices[0]
    const [first, second] = practice.questions
    const hits = [first.scoringPoints[0].id, first.scoringPoints[0].id, second.scoringPoints[0].id, 'unknown']
    const original = [...hits]
    const result = scoreCase(practice, hits)
    expect(result).toEqual({ score: 4, total: 25, byQuestion: {
      [first.id]: { score: 2, total: 8 }, [second.id]: { score: 2, total: 8 },
      [practice.questions[2].id]: { score: 0, total: 9 },
    } })
    expect(hits).toEqual(original)
    for (const p of casePractices) {
      expect(scoreCase(p, []).score).toBe(0)
      expect(scoreCase(p, ['unknown']).score).toBe(0)
      const full = scoreCase(p, p.questions.flatMap((q) => q.scoringPoints.map((point) => point.id)))
      expect(full.score).toBe(25)
      expect(full.total).toBe(25)
      expect(Object.values(full.byQuestion).every((q) => q.score === q.total)).toBe(true)
    }
  })

  it('记录、草稿及查询保持不可变，空白作答和零分有效', () => {
    const initial = emptyPractice()
    expect(bestCaseScore(initial, 'x')).toBeNull()
    expect(latestOutline(initial, 'y')).toBeNull()
    let r = recordCaseAttempt(initial, 'x', { ...attempt(1, 0), answers: { q: '' }, hits: [] })
    expect(bestCaseScore(r, 'x')).toBe(0)
    r = recordCaseAttempt(r, 'x', attempt(2, 20))
    r = recordCaseAttempt(r, 'x', attempt(3, 5))
    r = recordOutlineAttempt(r, 'y', outline(3))
    r = recordOutlineAttempt(r, 'y', outline(1))
    expect(bestCaseScore(r, 'x')).toBe(20)
    expect(latestOutline(r, 'y')).toEqual(outline(3))
    const before = structuredClone(r)
    const drafted = saveDraft(saveDraft(saveDraft(r, 'case:x', 'q1', '第一问'), 'case:x', 'q2', '第二问'), 'outline:y', 'text', '提纲')
    const edited = saveDraft(drafted, 'case:x', 'q1', '')
    expect(edited.drafts).toEqual({ 'case:x': { q1: '', q2: '第二问' }, 'outline:y': { text: '提纲' } })
    expect(drafted.drafts['case:x'].q1).toBe('第一问')
    const cleared = clearDraft(edited, 'case:x')
    expect(cleared.drafts).toEqual({ 'outline:y': { text: '提纲' } })
    expect(cleared.cases).toEqual(r.cases)
    expect(clearDraft(cleared, 'absent')).toEqual(cleared)
    expect(r).toEqual(before)
    expect(initial).toEqual(emptyPractice())
  })

  it('连续记录截断至 10 条，不保留外部可变引用，不接受空 key', () => {
    let r = emptyPractice()
    for (let i = 0; i < 15; i++) {
      r = recordCaseAttempt(r, 'x', attempt(i))
      r = recordOutlineAttempt(r, 'y', outline(i))
    }
    expect(r.cases.x).toHaveLength(10)
    expect(r.outlines.y).toHaveLength(10)
    expect(r.cases.x[0].at).toBe(5)
    expect(latestOutline(r, 'y')!.at).toBe(14)
    const input = attempt(15)
    r = recordCaseAttempt(r, 'x', input)
    input.answers.q = '外部修改'
    input.hits.push('external')
    expect(r.cases.x[9].answers.q).not.toBe('外部修改')
    expect(r.cases.x[9].hits).toEqual(['p'])
    expect(recordCaseAttempt(r, '', attempt())).toEqual(r)
    expect(recordOutlineAttempt(r, ' ', outline())).toEqual(r)
    expect(saveDraft(r, '', 'q', 'text')).toBe(r)
    expect(saveDraft(r, 'x', '', 'text')).toBe(r)
  })

  it('特殊对象键作为数据处理，不污染原型，查询缺失键返回 null', () => {
    const raw = JSON.parse('{"version":1,"drafts":{"__proto__":{"constructor":"text"}}}')
    const normalized = normalizePractice(raw)
    expect(Object.hasOwn(normalized.drafts, '__proto__')).toBe(true)
    expect(Object.getPrototypeOf(normalized.drafts)).toBe(Object.prototype)
    let r = saveDraft(emptyPractice(), '__proto__', 'constructor', 'text')
    r = recordCaseAttempt(r, '__proto__', attempt())
    r = recordOutlineAttempt(r, 'constructor', outline())
    expect(bestCaseScore(r, '__proto__')).toBe(10)
    expect(latestOutline(r, 'constructor')).toEqual(outline())
    expect(bestCaseScore(emptyPractice(), 'constructor')).toBeNull()
    expect(latestOutline(emptyPractice(), '__proto__')).toBeNull()
    expect(Object.getPrototypeOf(r.cases)).toBe(Object.prototype)
    expect(Object.prototype).not.toHaveProperty('q')
    savePractice(r)
    expect(loadPractice()).toEqual(r)
  })

  it('save/load 往返保留作答、勾选、草稿，仅写指定存储 key', () => {
    let r = recordCaseAttempt(emptyPractice(), 'cp-01', attempt())
    r = recordOutlineAttempt(r, 'intro', outline())
    r = saveDraft(r, 'case:cp-01', 'cp-01-q1', '未提交\n作答')
    localStorage.setItem('gaoxiang-2027-progress-v1', 'untouched')
    savePractice(r)
    expect(loadPractice()).toEqual(r)
    expect(JSON.parse(localStorage.getItem(PRACTICE_KEY)!)).toEqual(r)
    expect(localStorage.getItem('gaoxiang-2027-progress-v1')).toBe('untouched')
  })

  it('空存储、坏 JSON、读取异常、写入异常和不可用 storage 均不抛', () => {
    expect(loadPractice()).toEqual(emptyPractice())
    localStorage.setItem(PRACTICE_KEY, '{bad')
    expect(loadPractice()).toEqual(emptyPractice())
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    expect(loadPractice()).toEqual(emptyPractice())
    expect(() => savePractice(emptyPractice())).not.toThrow()
    vi.stubGlobal('localStorage', undefined)
    expect(loadPractice()).toEqual(emptyPractice())
    expect(() => savePractice(emptyPractice())).not.toThrow()
  })

  it('hook 多消费者同步、持久化，保存失败时内存仍可使用', () => {
    const first = renderHook(() => usePractice()), second = renderHook(() => usePractice())
    const next = saveDraft(first.result.current.records, 'case:cp-01', 'q1', '已写作答')
    act(() => first.result.current.setRecords(next))
    expect(second.result.current.records).toEqual(next)
    expect(loadPractice()).toEqual(next)
    expect(first.result.current.setRecords).toBe(second.result.current.setRecords)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full') })
    const updated = recordCaseAttempt(next, 'cp-01', attempt())
    act(() => second.result.current.setRecords(updated))
    expect(first.result.current.records).toEqual(updated)
    expect(second.result.current.records).toEqual(updated)
  })

  it('hook 接收跨标签 storage 及 clear 事件，忽略其他 key 和 sessionStorage，重挂载刷新', () => {
    const hook = renderHook(() => usePractice())
    const next = recordOutlineAttempt(emptyPractice(), 'intro', outline())
    savePractice(next)
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'other', storageArea: localStorage })))
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: PRACTICE_KEY, storageArea: sessionStorage })))
    expect(hook.result.current.records).toEqual(emptyPractice())
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: PRACTICE_KEY, storageArea: localStorage })))
    expect(hook.result.current.records).toEqual(next)
    localStorage.clear()
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage })))
    expect(hook.result.current.records).toEqual(emptyPractice())
    hook.unmount()
    savePractice(next)
    const remounted = renderHook(() => usePractice())
    expect(remounted.result.current.records).toEqual(next)
  })
})
