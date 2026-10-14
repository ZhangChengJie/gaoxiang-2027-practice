import { describe, expect, it } from 'vitest'
import { allQuestions } from '../data/content'
import { DOMAINS } from '../data/domains'
import { specialTests } from '../data/specialTests'
import { emptyProgress } from './progress'
import { buildMockExam, MOCK_DURATION_SEC, MOCK_TOTAL, scoreMock } from './mock'
import type { Question } from './types'

function questions(domain: string, length: number, chapter = 'mixed'): Question[] {
  return Array.from({ length }, (_, i) => ({
    id: `${domain}-${chapter}-${i + 1}`, chapter, domain, topic: '基础概念',
    text: '题目', options: ['A', 'B'], answer: i % 2, explanation: '解析',
  }))
}
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}
function fullBank() {
  return DOMAINS.flatMap(({ key }) => questions(key, 20))
}
function expectDomainOrder(exam: Question[]) {
  const indices = exam.map((q) => DOMAINS.findIndex((domain) => domain.key === q.domain))
  expect(indices).toEqual([...indices].sort((a, b) => a - b))
}

describe('mock:', () => {
  it('权重总计 75，时长为 150 分钟', () => {
    expect(DOMAINS.reduce((sum, domain) => sum + domain.mockWeight, 0)).toBe(MOCK_TOTAL)
    expect(MOCK_TOTAL).toBe(75)
    expect(MOCK_DURATION_SEC).toBe(9000)
  })

  it('同章混合知识域时精确按域权重抽题，不修改来源且无重复', () => {
    const bank = fullBank()
    const original = structuredClone(bank)
    const exam = buildMockExam(bank, seeded(42))
    expect(exam).toHaveLength(75)
    for (const { key, mockWeight } of DOMAINS) {
      expect(exam.filter((q) => q.domain === key), key).toHaveLength(mockWeight)
    }
    expect(new Set(exam.map((q) => q.id)).size).toBe(75)
    expect(bank).toEqual(original)
  })

  it('某域不足时从其它正权重域补齐，并保持分组和英文最后', () => {
    const bank = fullBank().filter((q) => q.domain !== 'it-tech' && q.domain !== 'informatization')
    bank.push(...questions('informatization', 2))
    const exam = buildMockExam(bank, seeded(10))
    expect(exam).toHaveLength(75)
    expect(exam.filter((q) => q.domain === 'informatization')).toHaveLength(2)
    expect(exam.some((q) => q.domain === 'it-tech')).toBe(false)
    expect(exam.every((q) => DOMAINS.find((domain) => domain.key === q.domain)!.mockWeight > 0)).toBe(true)
    expect(new Set(exam.map((q) => q.id)).size).toBe(75)
    expectDomainOrder(exam)
    expect(exam.at(-1)?.domain).toBe('english')
  })

  it('排除零权重、未知域和 09/09a 章，即使论文章误标正权重域；总量不足返回可用题', () => {
    const allowed = questions('risk', 4)
    const bank = [
      ...allowed, allowed[0],
      ...['advanced', 'method', 'unknown'].flatMap((domain) => questions(domain, 100)),
      ...['09', '09a', '09-高分论文方法', '09a-论文范文集'].flatMap((chapter) => questions('risk', 100, chapter)),
    ]
    const exam = buildMockExam(bank, seeded(10))
    expect(exam).toHaveLength(4)
    expect(new Set(exam.map((q) => q.id))).toEqual(new Set(allowed.map((q) => q.id)))
    expect(buildMockExam([], seeded(1))).toEqual([])
  })

  it('按 DOMAINS 展示顺序分组，与章顺序无关，英文为最后五道', () => {
    const exam = buildMockExam(fullBank().reverse(), seeded(99))
    expect(exam.slice(-5).every((q) => q.domain === 'english')).toBe(true)
    expectDomainOrder(exam)
  })

  it('固定 rng 可复现，不同种子改变抽样与域内顺序', () => {
    expect(buildMockExam(fullBank(), seeded(1))).toEqual(buildMockExam(fullBank(), seeded(1)))
    const first = buildMockExam(fullBank(), seeded(1)).filter((q) => q.domain === 'risk')
    const second = buildMockExam(fullBank(), seeded(2)).filter((q) => q.domain === 'risk')
    expect(first.map((q) => q.id).sort()).not.toEqual(second.map((q) => q.id).sort())
    expect(first.map((q) => q.id)).not.toEqual(second.map((q) => q.id))
  })

  it('实际题库含生成的绩效域题，综合章可入模考且精确按域抽满 75', () => {
    const exam = buildMockExam(allQuestions, seeded(123))
    expect(exam).toHaveLength(75)
    for (const { key, mockWeight } of DOMAINS) {
      expect(exam.filter((q) => q.domain === key), key).toHaveLength(mockWeight)
    }
    expect(exam.some((q) => q.chapter === 'performance')).toBe(true)
    expect(exam.some((q) => /^(10|11|17)-/.test(q.chapter))).toBe(true)
    expectDomainOrder(exam)
  })

  it('scoreMock 未作答算错，兼容字段 byChapter 按 domain 汇总，不修改输入', () => {
    const qs = [...questions('risk', 2, 'a'), ...questions('risk', 1, 'b'), ...questions('cost', 2, 'a')]
    const answers = { 'risk-a-1': 0, 'risk-a-2': 0, 'cost-a-1': 0 }
    expect(scoreMock(qs, answers, 900, 123)).toEqual({
      at: 123, total: 5, correct: 2, durationSec: 900,
      byChapter: { risk: { total: 3, correct: 1 }, cost: { total: 2, correct: 1 } },
    })
    expect(answers).toEqual({ 'risk-a-1': 0, 'risk-a-2': 0, 'cost-a-1': 0 })
    expect(scoreMock([], {}, 0, 123)).toEqual({ at: 123, total: 0, correct: 0, durationSec: 0, byChapter: {} })
  })

  it('专项使用传入的错题本排序，mock 专项直接使用题数组和域权重', () => {
    const p = emptyProgress()
    const qs = questions('risk', 40)
    for (const [index, q] of qs.entries()) {
      p.wrong[q.id] = { id: q.id, wrongCount: index, lastWrongTime: 0, reviewStage: 0, nextReviewAt: 0 }
    }
    const errors = specialTests.find((t) => t.key === 'errors')!
    expect(errors.filter(qs, p).map((q) => q.id)).toEqual(qs.slice(10).reverse().map((q) => q.id))
    const mock = specialTests.find((t) => t.key === 'mock')!
    expect(mock.filter(questions('method', 100), p)).toEqual([])
    expect(mock.filter(questions('performance', 100, 'performance'), p)).toHaveLength(75)
    expect(mock.description).toBe('按真题分布抽 75 题')
    expect(specialTests.find((t) => t.key === 'performance')!.description).toContain('40 题')
  })
})
