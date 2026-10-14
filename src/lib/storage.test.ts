import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAnswer, emptyProgress, recordMock, setWrongCause } from './progress'
import { exportProgress, importProgress, loadProgress, normalizeProgress, saveProgress, STORAGE_KEY } from './storage'

const now = 123456789

describe('storage:', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('坏 JSON、无存储、错误根类型和读取异常返回空进度', () => {
    expect(loadProgress()).toEqual(emptyProgress())
    localStorage.setItem(STORAGE_KEY, '{bad')
    expect(loadProgress()).toEqual(emptyProgress())
    expect(normalizeProgress(null, now)).toEqual(emptyProgress())
    expect(normalizeProgress([], now)).toEqual(emptyProgress())
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(loadProgress()).toEqual(emptyProgress())
  })

  it('v1 对象无损迁移，不编造历史正确率或 daily', () => {
    const raw = { answered: { a: true, b: true }, wrong: { a: { id: 'a', wrongCount: 8, lastWrongTime: 100 } } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw))
    expect(loadProgress()).toEqual({
      ...emptyProgress(), answered: raw.answered,
      wrong: { a: { ...raw.wrong.a, reviewStage: 0, nextReviewAt: 100 } },
    })
    expect(raw.wrong.a).not.toHaveProperty('reviewStage')
  })

  it('string[] 旧格式迁移，过滤无效 id', () => {
    const p = normalizeProgress({ answered: { a: true }, wrong: ['a', 'b', 42, null, ''] }, now)
    expect(p.answered).toEqual({ a: true })
    expect(p.wrong).toEqual(Object.fromEntries(['a', 'b'].map((id) => [id, {
      id, wrongCount: 1, lastWrongTime: now, nextReviewAt: now, reviewStage: 0,
    }])))
  })

  it('非法 cause 丢弃，合法 cause 和 v2 复习字段保留', () => {
    const p = normalizeProgress({ wrong: {
      a: { wrongCount: 3, lastWrongTime: 100, reviewStage: 2, nextReviewAt: 200, cause: 'typo' },
      b: { cause: 'unknown' }, c: { cause: 'slow' }, d: { cause: 'careless' }, e: { cause: 'hesitant' },
    } }, now)
    expect(p.wrong.a).toEqual({ id: 'a', wrongCount: 3, lastWrongTime: 100, reviewStage: 2, nextReviewAt: 200 })
    expect(['b', 'c', 'd', 'e'].map((id) => p.wrong[id].cause)).toEqual(['unknown', 'slow', 'careless', 'hesitant'])
  })

  it('缺字段和错误字段逐项规范化，计数与日期合法，输入不变', () => {
    const raw = {
      answered: { a: true, b: false, bad: 'yes' },
      wrong: { a: { id: 'mismatch', wrongCount: -2, lastWrongTime: NaN, reviewStage: 8, nextReviewAt: Infinity }, bad: null },
      stats: { a: { attempts: 3, correct: 10, lastAnswerTime: 'bad', lastCorrect: 'yes' }, bad: [] },
      daily: { '2026-10-14': { answered: 2, correct: 4 }, '2026-02-30': {}, nope: {}, '2026-10-15': null },
      mockHistory: [null, {}, { at: -1 }],
    }
    const original = structuredClone(raw)
    const p = normalizeProgress(raw, now)
    expect(p.answered).toEqual({ a: true, b: false })
    expect(p.wrong).toEqual({ a: { id: 'a', wrongCount: 1, lastWrongTime: now, reviewStage: 0, nextReviewAt: now } })
    expect(p.stats).toEqual({ a: { attempts: 3, correct: 3, lastAnswerTime: 0, lastCorrect: false } })
    expect(p.daily).toEqual({ '2026-10-14': { answered: 2, correct: 2 } })
    expect(p.mockHistory).toEqual([])
    expect(raw).toEqual(original)
  })

  it('mockHistory 保留最近 20 条并规范化章节', () => {
    const history = Array.from({ length: 25 }, (_, at) => ({ at, total: 3, correct: 2, durationSec: 100, byChapter: { a: { total: 3, correct: 2 } } }))
    const p = normalizeProgress({ mockHistory: history }, now)
    expect(p.mockHistory).toEqual(history.slice(5))
  })

  it('save/load 和 export/import 往返相等', () => {
    let p = applyAnswer(emptyProgress(), 'a', false, now)
    p = setWrongCause(p, 'a', 'careless')
    p = applyAnswer(p, 'a', true, now)
    p = recordMock(p, { at: now, total: 1, correct: 1, durationSec: 50, byChapter: { chapter: { total: 1, correct: 1 } } })
    saveProgress(p)
    expect(loadProgress()).toEqual(p)
    const text = exportProgress(p, now)
    expect(JSON.parse(text)).toEqual({ app: 'gaoxiang-2027-practice', exportedAt: now, progress: p })
    expect(importProgress(text, now + 1)).toEqual(p)
  })

  it('import 非 JSON / app 不匹配抛出指定中文信息', () => {
    expect(() => importProgress('{bad', now)).toThrow('文件不是有效的 JSON')
    expect(() => importProgress('{"app":"another-app","progress":{}}', now)).toThrow('这不是本应用导出的进度文件')
    for (const raw of [null, [], 'text', 1, {}, { app: 'gaoxiang-2027-practice', progress: null }]) {
      expect(() => importProgress(JSON.stringify(raw), now)).toThrow('文件中缺少有效的进度数据')
    }
  })

  it('import 接受无包装 v2 和旧 progress', () => {
    const p = applyAnswer(emptyProgress(), 'a', true, now)
    expect(importProgress(JSON.stringify(p), now)).toEqual(p)
    expect(importProgress('{"wrong":["a"]}', now)).toEqual(normalizeProgress({ wrong: ['a'] }, now))
  })
})
