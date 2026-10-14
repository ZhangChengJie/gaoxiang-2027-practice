import { describe, expect, it } from 'vitest'
import {
  accuracyOf, applyAnswer, clearAllWrong, domainAccuracy, dueWrongIds, emptyProgress, ERROR_CAUSE_LABELS,
  isDue, localDateKey, recordMock, removeWrong, REVIEW_INTERVALS_DAYS, setWrongCause, todayStat, weakestDomains,
} from './progress'
import type { MockResult, Question } from './types'
import { DOMAINS } from '../data/domains'

const now = new Date(2026, 9, 14, 12).getTime()
const day = 86400000

describe('progress:', () => {
  it('首次答错入本，同时记录统计和本地日期', () => {
    const p = applyAnswer(emptyProgress(), 'a', false, now)
    expect(p.wrong.a).toEqual({ id: 'a', wrongCount: 1, lastWrongTime: now, reviewStage: 0, nextReviewAt: now })
    expect(p.answered).toEqual({ a: true })
    expect(p.stats.a).toEqual({ attempts: 1, correct: 0, lastAnswerTime: now, lastCorrect: false })
    expect(todayStat(p, now)).toEqual({ answered: 1, correct: 0 })
    expect(ERROR_CAUSE_LABELS).toEqual({ unknown: '不会', hesitant: '犹豫', careless: '粗心', slow: '会但慢' })
  })

  it('重复答错加次数、重置 stage 并保留 cause', () => {
    let p = setWrongCause(applyAnswer(emptyProgress(), 'a', false, now), 'a', 'hesitant')
    p = applyAnswer(p, 'a', true, now)
    const next = applyAnswer(p, 'a', false, now + 1)
    expect(next.wrong.a).toEqual({
      id: 'a', wrongCount: 2, lastWrongTime: now + 1, cause: 'hesitant', reviewStage: 0, nextReviewAt: now + 1,
    })
    expect(next.stats.a.attempts).toBe(3)
    expect(next.stats.a.correct).toBe(1)
  })

  it('依次在到期边界答对，推进 stage 并安排 1/3/7 天后复习，第四次移出', () => {
    let p = applyAnswer(emptyProgress(), 'a', false, now)
    let at = now
    for (const [index, interval] of REVIEW_INTERVALS_DAYS.entries()) {
      expect(isDue(p.wrong.a, at - 1)).toBe(false)
      expect(isDue(p.wrong.a, at)).toBe(true)
      p = applyAnswer(p, 'a', true, at)
      expect(p.wrong.a.reviewStage).toBe(index + 1)
      expect(p.wrong.a.nextReviewAt).toBe(at + interval * day)
      at = p.wrong.a.nextReviewAt
    }
    p = applyAnswer(p, 'a', true, at)
    expect(p.wrong.a).toBeUndefined()
    expect(p.stats.a).toMatchObject({ attempts: 5, correct: 4, lastCorrect: true })
  })

  it('未到期答对保持错题记录，仍更新所有统计', () => {
    const p = applyAnswer(applyAnswer(emptyProgress(), 'a', false, now), 'a', true, now)
    const next = applyAnswer(p, 'a', true, now + 1)
    expect(next.wrong.a).toBe(p.wrong.a)
    expect(next.stats.a).toMatchObject({ attempts: 3, correct: 2, lastAnswerTime: now + 1 })
    expect(todayStat(next, now)).toEqual({ answered: 3, correct: 2 })
  })

  it('不在错题本的答对只更新统计', () => {
    const p = applyAnswer(emptyProgress(), 'a', true, now)
    expect(p.wrong).toEqual({})
    expect(p.stats.a).toEqual({ attempts: 1, correct: 1, lastAnswerTime: now, lastCorrect: true })
    expect(p.answered.a).toBe(true)
    expect(todayStat(p, now)).toEqual({ answered: 1, correct: 1 })
  })

  it('daily 跨本地午夜分别累计', () => {
    const before = new Date(2026, 9, 14, 23, 59, 59).getTime()
    const after = new Date(2026, 9, 15, 0, 0, 1).getTime()
    let p = applyAnswer(emptyProgress(), 'a', true, before)
    p = applyAnswer(p, 'b', false, before)
    p = applyAnswer(p, 'a', true, after)
    expect(localDateKey(before)).toBe('2026-10-14')
    expect(localDateKey(after)).toBe('2026-10-15')
    expect(p.daily).toEqual({ '2026-10-14': { answered: 2, correct: 1 }, '2026-10-15': { answered: 1, correct: 1 } })
    expect(todayStat(p, before - day)).toEqual({ answered: 0, correct: 0 })
  })

  it('accuracyOf 统计独立题数和累计次数，旧答题标记没有正确率', () => {
    const p = emptyProgress()
    p.answered.legacy = true
    expect(accuracyOf(p, [])).toEqual({ attempted: 0, attempts: 0, correct: 0, accuracy: null })
    expect(accuracyOf(p, ['legacy'])).toEqual({ attempted: 1, attempts: 0, correct: 0, accuracy: null })
    const next = applyAnswer(applyAnswer(p, 'a', false, now), 'a', true, now)
    expect(accuracyOf(next, ['a', 'a', 'legacy', 'missing'])).toEqual({ attempted: 2, attempts: 2, correct: 1, accuracy: 0.5 })
  })

  it('dueWrongIds 按到期时间升序，同时间按错误次数降序', () => {
    let p = applyAnswer(emptyProgress(), 'a', false, now - 2)
    p = applyAnswer(p, 'b', false, now - 1)
    p = applyAnswer(p, 'c', false, now - 1)
    p = applyAnswer(p, 'c', false, now - 1)
    p = applyAnswer(p, 'future', false, now + 1)
    expect(dueWrongIds(p, now)).toEqual(['a', 'c', 'b'])
  })

  it('setWrongCause 对不存在的题原样返回，移除和清空不丢统计', () => {
    const p = applyAnswer(emptyProgress(), 'a', false, now)
    expect(setWrongCause(p, 'missing', 'slow')).toBe(p)
    expect(setWrongCause(p, 'a', 'careless').wrong.a.cause).toBe('careless')
    for (const next of [removeWrong(p, 'a'), clearAllWrong(p)]) {
      expect(next.wrong).toEqual({})
      expect(next.stats).toEqual(p.stats)
      expect(next.answered).toEqual(p.answered)
    }
  })

  it('recordMock 保留最近 20 次，新的在后', () => {
    let p = emptyProgress()
    for (let at = 0; at < 25; at++) {
      p = recordMock(p, { at, total: 75, correct: 60, durationSec: 100, byChapter: {} })
    }
    expect(p.mockHistory).toHaveLength(20)
    expect(p.mockHistory.map((r) => r.at)).toEqual(Array.from({ length: 20 }, (_, i) => i + 5))
  })

  it('所有变更都不修改入参', () => {
    const p = applyAnswer(emptyProgress(), 'a', false, now)
    const original = structuredClone(p)
    function freeze(value: object): void {
      Object.values(value).forEach((item: unknown) => {
        if (item !== null && typeof item === 'object') freeze(item)
      })
      Object.freeze(value)
    }
    freeze(p)
    applyAnswer(p, 'a', true, now)
    applyAnswer(p, 'a', false, now)
    setWrongCause(p, 'a', 'slow')
    removeWrong(p, 'a')
    clearAllWrong(p)
    const result: MockResult = { at: now, total: 0, correct: 0, durationSec: 0, byChapter: {} }
    recordMock(p, result)
    expect(p).toEqual(original)
    expect(emptyProgress()).not.toBe(emptyProgress())
  })
})

function domainQuestion(id: string, domain: string, chapter = 'mixed'): Question {
  return { id, chapter, domain, topic: '基础概念', text: '题目', options: ['A'], answer: 0, explanation: '解析' }
}

describe('progress: 知识域统计', () => {
  it('每个 DOMAINS 按顺序返回，空题域 total=0、accuracy=null', () => {
    const rows = domainAccuracy(emptyProgress(), [])
    expect(rows).toEqual(DOMAINS.map(({ key, title }) => ({
      domain: key, title, total: 0, attempted: 0, attempts: 0, correct: 0, accuracy: null,
    })))
  })

  it('同域跨章累计作答次数，去重题目，旧标记计 attempted 但不推测正确率', () => {
    const questions = [domainQuestion('a', 'risk', 'chapter-a'), domainQuestion('b', 'risk', 'chapter-b'),
      domainQuestion('legacy', 'risk'), domainQuestion('c', 'cost')]
    let p = applyAnswer(emptyProgress(), 'a', false, now)
    p = applyAnswer(p, 'a', true, now)
    p = applyAnswer(p, 'b', true, now)
    p.answered.legacy = true
    p.answered.c = true
    p = applyAnswer(p, 'orphan', false, now)
    const original = structuredClone(p)
    const rows = domainAccuracy(p, [...questions, questions[0]])
    expect(rows.find((row) => row.domain === 'risk')).toEqual({
      domain: 'risk', title: '项目风险管理', total: 3, attempted: 3, attempts: 3, correct: 2, accuracy: 2 / 3,
    })
    expect(rows.find((row) => row.domain === 'cost')).toMatchObject({ total: 1, attempted: 1, attempts: 0, accuracy: null })
    expect(p).toEqual(original)
  })

  it('保留有 stats 但无 answered 标记的累计口径', () => {
    const p = applyAnswer(emptyProgress(), 'a', false, now)
    delete p.answered.a
    expect(domainAccuracy(p, [domainQuestion('a', 'risk')]).find((row) => row.domain === 'risk'))
      .toMatchObject({ attempted: 1, attempts: 1, correct: 0, accuracy: 0 })
  })

  it('薄弱域按累计次数达门槛后升序取 n，排除方法域，保留英文及零权重高级域', () => {
    const questions = ['risk', 'english', 'method', 'cost', 'quality', 'advanced', 'scope']
      .map((domain) => domainQuestion(domain, domain))
    let p = emptyProgress()
    const outcomes: Record<string, boolean[]> = {
      risk: [false, false, false, false, true],
      english: [false, false, false, false, false],
      method: [false, false, false, false, false],
      cost: [false, false, true, true, true],
      quality: [false, false, false, false],
      advanced: [false, false, true, true, true],
    }
    for (const [id, answers] of Object.entries(outcomes)) {
      for (const right of answers) p = applyAnswer(p, id, right, now)
    }
    p.answered.scope = true
    expect(weakestDomains(p, questions).map((row) => row.domain)).toEqual(['english', 'risk', 'cost'])
    expect(weakestDomains(p, questions, 10).map((row) => row.domain)).toEqual(['english', 'risk', 'cost', 'advanced'])
    expect(weakestDomains(p, questions, 1, 4).map((row) => row.domain)).toEqual(['quality'])
    expect(weakestDomains(p, questions, 0)).toEqual([])
    expect(weakestDomains(p, questions, -1)).toEqual([])
    expect(weakestDomains(p, questions, 10, 0).some((row) => row.domain === 'scope')).toBe(false)
  })
})
