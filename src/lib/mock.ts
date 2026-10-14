import type { MockResult, Question } from './types'
import { DOMAINS } from '../data/domains'

export const MOCK_TOTAL = 75
export const MOCK_DURATION_SEC = 150 * 60

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function buildMockExam(questions: Question[], rng: () => number = Math.random): Question[] {
  const eligibleDomains = DOMAINS.filter((domain) => domain.mockWeight > 0)
  const pools = new Map(eligibleDomains.map(({ key }) => [key, [] as Question[]]))
  const seen = new Set<string>()
  for (const question of questions) {
    const pool = pools.get(question.domain)
    if (!pool || /^(09|09a)(-|$)/.test(question.chapter) || seen.has(question.id)) continue
    seen.add(question.id)
    pool.push(question)
  }
  const selected: Question[] = []
  const remaining: Question[] = []
  for (const { key, mockWeight } of eligibleDomains) {
    const pool = shuffle(pools.get(key)!, rng)
    selected.push(...pool.slice(0, mockWeight))
    remaining.push(...pool.slice(mockWeight))
  }
  selected.push(...shuffle(remaining, rng).slice(0, Math.max(0, MOCK_TOTAL - selected.length)))
  const order = new Map(DOMAINS.map(({ key }, index) => [key, index]))
  // Randomize each group, including questions added to fill shortages.
  return shuffle(selected, rng).sort((a, b) => order.get(a.domain)! - order.get(b.domain)!)
}

export function scoreMock(
  questions: Question[], answers: Record<string, number>, durationSec: number, now: number,
): MockResult {
  const byChapter: MockResult['byChapter'] = {}
  let correct = 0
  for (const question of questions) {
    const right = Object.hasOwn(answers, question.id) && answers[question.id] === question.answer
    const domain = byChapter[question.domain] ?? { total: 0, correct: 0 }
    byChapter[question.domain] = { total: domain.total + 1, correct: domain.correct + Number(right) }
    correct += Number(right)
  }
  return { at: now, total: questions.length, correct, durationSec, byChapter }
}
