import { describe, expect, it } from 'vitest'
import { specialTests } from '../data/specialTests'
import { emptyProgress } from './progress'
import { buildMockExam, MOCK_DURATION_SEC, MOCK_TOTAL, MOCK_WEIGHTS, scoreMock } from './mock'
import type { Question } from './types'

function questions(chapter: string, length: number): Question[] {
  return Array.from({ length }, (_, i) => ({
    id: `${chapter}-${i + 1}`, chapter, text: '题目', options: ['A', 'B'], answer: i % 2, explanation: '解析',
  }))
}
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}
function fullChapters() {
  return Object.keys(MOCK_WEIGHTS).map((key) => ({ key, questions: questions(key, 20) }))
}

describe('mock:', () => {
  it('权重总计 75，时长为 150 分钟', () => {
    expect(Object.values(MOCK_WEIGHTS).reduce((sum, value) => sum + value, 0)).toBe(MOCK_TOTAL)
    expect(MOCK_TOTAL).toBe(75)
    expect(MOCK_DURATION_SEC).toBe(9000)
  })

  it('各章充足时精确按权重抽题，不修改来源且无重复', () => {
    const chapters = fullChapters()
    const original = structuredClone(chapters)
    const exam = buildMockExam(chapters, seeded(42))
    expect(exam).toHaveLength(75)
    for (const [chapter, weight] of Object.entries(MOCK_WEIGHTS)) {
      expect(exam.filter((q) => q.chapter === chapter)).toHaveLength(weight)
    }
    expect(new Set(exam.map((q) => q.id)).size).toBe(75)
    expect(chapters).toEqual(original)
  })

  it('某章不足时从其它有权重章节随机补齐至 75', () => {
    const chapters = fullChapters()
    chapters[0].questions = questions(chapters[0].key, 2)
    chapters[1].questions = []
    const exam = buildMockExam(chapters, seeded(10))
    expect(exam).toHaveLength(75)
    expect(exam.filter((q) => q.chapter === chapters[0].key)).toHaveLength(2)
    expect(exam.some((q) => q.chapter === chapters[1].key)).toBe(false)
    expect(new Set(exam.map((q) => q.id)).size).toBe(75)
  })

  it('不抽无权重章节，总量不足时返回全部可用题', () => {
    const key = Object.keys(MOCK_WEIGHTS)[0]
    const allowed = questions(key, 4)
    const chapters = [
      { key, questions: [...allowed, allowed[0]] },
      ...['09', '09a', '10-记忆与复盘', '11-六周冲刺', 'performance'].map((key) => ({ key, questions: questions(key, 100) })),
    ]
    const exam = buildMockExam(chapters, seeded(10))
    expect(exam).toHaveLength(4)
    expect(new Set(exam.map((q) => q.id))).toEqual(new Set(allowed.map((q) => q.id)))
    expect(buildMockExam([], seeded(1))).toEqual([])
  })

  it('按章节字典序分组，英文始终在最后五道', () => {
    const exam = buildMockExam(fullChapters().reverse(), seeded(99))
    expect(exam.slice(-5).every((q) => q.chapter === '20-英文术语')).toBe(true)
    const chapters = exam.map((q) => q.chapter)
    expect(chapters).toEqual([...chapters].sort())
  })

  it('固定 rng 可复现，不同种子改变抽样与章内顺序', () => {
    expect(buildMockExam(fullChapters(), seeded(1))).toEqual(buildMockExam(fullChapters(), seeded(1)))
    expect(buildMockExam(fullChapters(), seeded(1))).not.toEqual(buildMockExam(fullChapters(), seeded(2)))
  })

  it('scoreMock 未作答算错，按 chapter 汇总，不修改输入', () => {
    const qs = [...questions('a', 3), ...questions('b', 2)]
    const answers = { 'a-1': 0, 'a-2': 0, 'b-1': 0 }
    expect(scoreMock(qs, answers, 900, 123)).toEqual({
      at: 123, total: 5, correct: 2, durationSec: 900,
      byChapter: { a: { total: 3, correct: 1 }, b: { total: 2, correct: 1 } },
    })
    expect(answers).toEqual({ 'a-1': 0, 'a-2': 0, 'b-1': 0 })
    expect(scoreMock([], {}, 0, 123)).toEqual({ at: 123, total: 0, correct: 0, durationSec: 0, byChapter: {} })
  })

  it('专项使用传入的错题本排序，并通过模考抽题逻辑排除无权重题', () => {
    const p = emptyProgress()
    const qs = questions('a', 40)
    for (const [index, q] of qs.entries()) {
      p.wrong[q.id] = { id: q.id, wrongCount: index, lastWrongTime: 0, reviewStage: 0, nextReviewAt: 0 }
    }
    const errors = specialTests.find((t) => t.key === 'errors')!
    expect(errors.filter(qs, p).map((q) => q.id)).toEqual(qs.slice(10).reverse().map((q) => q.id))
    const mock = specialTests.find((t) => t.key === 'mock')!
    expect(mock.filter(questions('performance', 100), p)).toEqual([])
    expect(mock.description).toBe('按真题分布抽 75 题')
    expect(specialTests.find((t) => t.key === 'performance')!.description).toContain('40 题')
  })
})
