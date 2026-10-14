import { describe, expect, it } from 'vitest'
import { buildDailyPlan, DAILY_NEW_COUNT, DAILY_REVIEW_COUNT } from './dailyPlan'
import { MOCK_WEIGHTS } from './mock'
import { applyAnswer, emptyProgress, removeWrong } from './progress'
import type { Question } from './types'

const [low, high, medium] = Object.keys(MOCK_WEIGHTS)
const now = 1000000000
function question(chapter: string, n: number): Question {
  return { id: `${chapter}-${n}`, chapter, text: '题目', options: ['A'], answer: 0, explanation: '解析' }
}

describe('dailyPlan:', () => {
  it('review 只选存在的到期题，按到期顺序，最多 15 道', () => {
    const qs = Array.from({ length: 20 }, (_, i) => question(low, i + 1))
    let p = applyAnswer(emptyProgress(), 'missing', false, 1)
    for (const [i, q] of qs.entries()) p = applyAnswer(p, q.id, false, now - 100 + i)
    const future = question(low, 21)
    p = applyAnswer(p, future.id, false, now + 1)
    const plan = buildDailyPlan([...qs, future], p, now, () => 0)
    expect(DAILY_REVIEW_COUNT).toBe(15)
    expect(DAILY_NEW_COUNT).toBe(30)
    expect(plan.review).toEqual(qs.slice(0, 15))
    expect(plan.fresh.some((q) => plan.review.includes(q))).toBe(false)
  })

  it('fresh 优先低正确率章节，跨章轮转且章内保持原题号顺序', () => {
    const qs = [high, medium, low].flatMap((chapter) => Array.from({ length: 21 }, (_, i) => question(chapter, i + 1)))
    let p = applyAnswer(emptyProgress(), question(low, 21).id, false, now)
    p = applyAnswer(p, question(high, 21).id, true, now)
    // medium 无历史，按 0.5 排在正确率 0 和 1 之间。
    const original = structuredClone(p)
    const plan = buildDailyPlan([...qs].reverse(), p, now, () => 0)
    expect(plan.fresh).toHaveLength(30)
    expect(plan.fresh.slice(0, 6).map((q) => q.id)).toEqual([
      question(low, 1).id, question(medium, 1).id, question(high, 1).id,
      question(low, 2).id, question(medium, 2).id, question(high, 2).id,
    ])
    for (const chapter of [low, medium, high]) {
      expect(plan.fresh.filter((q) => q.chapter === chapter)).toHaveLength(10)
    }
    expect(p).toEqual(original)
  })

  it('不足时先补最近答错且不在本中的题，再按已答题累计正确率升序补', () => {
    const [highQ, lowQ, newQ, recent, pending, old] = Array.from({ length: 6 }, (_, i) => question(low, i + 1))
    let p = emptyProgress()
    for (const right of [true, true, false, true]) p = applyAnswer(p, highQ.id, right, now)
    for (const right of [false, false, false, true]) p = applyAnswer(p, lowQ.id, right, now)
    p = removeWrong(removeWrong(p, highQ.id), lowQ.id)
    p = removeWrong(applyAnswer(p, recent.id, false, now), recent.id)
    p = applyAnswer(p, pending.id, false, now)
    p.wrong[pending.id].nextReviewAt = now + 1
    p.answered[old.id] = true
    const ignored = question('performance', 1)
    const qs = [highQ, lowQ, newQ, recent, pending, old, ignored]
    const plan = buildDailyPlan(qs, p, now, () => 0)
    expect(plan.review).toEqual([])
    expect(plan.fresh.map((q) => q.id)).toEqual([newQ, recent, pending, lowQ, old, highQ].map((q) => q.id))
    expect(new Set(plan.fresh.map((q) => q.id)).size).toBe(6)
  })

  it('空题库返回空计划，多余 fallback 仍不超过 30 且去重', () => {
    expect(buildDailyPlan([], emptyProgress(), now)).toEqual({ review: [], fresh: [] })
    const qs = Array.from({ length: 40 }, (_, i) => question(low, i + 1))
    let p = emptyProgress()
    for (const q of qs) p = applyAnswer(p, q.id, true, now)
    const plan = buildDailyPlan([...qs, qs[0]], p, now, () => 0)
    expect(plan.fresh).toHaveLength(30)
    expect(new Set(plan.fresh.map((q) => q.id)).size).toBe(30)
  })
})
