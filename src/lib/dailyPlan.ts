import { DOMAINS } from '../data/domains'
import { accuracyOf, dueWrongIds } from './progress'
import type { Progress, Question } from './types'

export const DAILY_REVIEW_COUNT = 15
export const DAILY_NEW_COUNT = 30

export function buildDailyPlan(
  allQuestions: Question[], p: Progress, now: number, rng: () => number = Math.random,
): { review: Question[]; fresh: Question[] } {
  const byId = new Map(allQuestions.map((q) => [q.id, q]))
  const review = dueWrongIds(p, now).flatMap((id) => {
    const question = byId.get(id)
    return question ? [question] : []
  }).slice(0, DAILY_REVIEW_COUNT)
  const selected = new Set(review.map((q) => q.id))
  const eligibleDomains = new Set(DOMAINS.filter((domain) => domain.mockWeight > 0).map((domain) => domain.key))
  const eligible = [...byId.values()].filter((q) => eligibleDomains.has(q.domain))
  const domains = new Map<string, Question[]>()
  for (const question of eligible) {
    const domain = domains.get(question.domain) ?? []
    domain.push(question)
    domains.set(question.domain, domain)
  }
  const groups = [...domains.values()].map((questions) => ({
    accuracy: accuracyOf(p, questions.map((q) => q.id)).accuracy ?? 0.5,
    // Randomness only resolves equal domain accuracies; question numbers stay ordered.
    tieBreak: rng(),
    questions: questions.filter((q) => !p.answered[q.id] && !selected.has(q.id))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    cursor: 0,
  })).sort((a, b) => a.accuracy - b.accuracy || a.tieBreak - b.tieBreak)
  const fresh: Question[] = []
  function add(question: Question): void {
    if (fresh.length < DAILY_NEW_COUNT && !selected.has(question.id)) {
      fresh.push(question)
      selected.add(question.id)
    }
  }
  while (fresh.length < DAILY_NEW_COUNT) {
    let added = false
    for (const group of groups) {
      if (group.cursor < group.questions.length) {
        add(group.questions[group.cursor++])
        added = true
      }
      if (fresh.length === DAILY_NEW_COUNT) break
    }
    if (!added) break
  }
  // First reuse recent mistakes outside the wrong book, then the lowest lifetime accuracies.
  for (const question of eligible) {
    if (p.answered[question.id] && p.stats[question.id]?.lastCorrect === false && !p.wrong[question.id]) {
      add(question)
    }
  }
  const fallback = eligible.filter((q) => p.answered[q.id] && !selected.has(q.id))
    .sort((a, b) => (accuracyOf(p, [a.id]).accuracy ?? 0.5) - (accuracyOf(p, [b.id]).accuracy ?? 0.5))
  for (const question of fallback) add(question)
  return { review, fresh }
}
