import type { MockResult, Question } from './types'

export const MOCK_TOTAL = 75
export const MOCK_DURATION_SEC = 150 * 60
export const MOCK_WEIGHTS: Record<string, number> = {
  '01-信息技术与信息化': 6,
  '02-治理工程与软件': 5,
  '03-项目管理主干上半': 7,
  '04-项目管理主干下半': 6,
  '05-绩效域高级管理法规': 6,
  '06-ITTO高频链路': 3,
  '07-全计算专题': 4,
  '08-案例分析': 3,
  '12-项目管理概论与立项管理': 3,
  '13-高级管理与辅助知识域': 3,
  '14-新一代信息技术详解': 5,
  '15-风险采购干系人管理': 6,
  '16-2026真题相似知识点': 3,
  '17-考试走向高频必刷': 4,
  '18-法律法规标准规范职业道德': 3,
  '19-项目管理科学基础运筹学': 3,
  '20-英文术语': 5,
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function buildMockExam(
  chapters: { key: string; questions: Question[] }[], rng: () => number = Math.random,
): Question[] {
  const pools = new Map<string, Question[]>()
  const seen = new Set<string>()
  for (const chapter of chapters) {
    if (!Object.hasOwn(MOCK_WEIGHTS, chapter.key)) continue
    const pool = pools.get(chapter.key) ?? []
    for (const question of chapter.questions) {
      if (!Object.hasOwn(MOCK_WEIGHTS, question.chapter) || seen.has(question.id)) continue
      seen.add(question.id)
      pool.push(question)
    }
    pools.set(chapter.key, pool)
  }
  const selected: Question[] = []
  const remaining: Question[] = []
  for (const key of Object.keys(MOCK_WEIGHTS).sort()) {
    const pool = shuffle(pools.get(key) ?? [], rng)
    selected.push(...pool.slice(0, MOCK_WEIGHTS[key]))
    remaining.push(...pool.slice(MOCK_WEIGHTS[key]))
  }
  selected.push(...shuffle(remaining, rng).slice(0, MOCK_TOTAL - selected.length))
  // Shuffle within groups as well, including questions added to fill shortages.
  return shuffle(selected, rng).sort((a, b) => {
    if (a.chapter === b.chapter) return 0
    if (a.chapter === '20-英文术语') return 1
    if (b.chapter === '20-英文术语') return -1
    return a.chapter < b.chapter ? -1 : 1
  })
}

export function scoreMock(
  questions: Question[], answers: Record<string, number>, durationSec: number, now: number,
): MockResult {
  const byChapter: MockResult['byChapter'] = {}
  let correct = 0
  for (const question of questions) {
    const right = Object.hasOwn(answers, question.id) && answers[question.id] === question.answer
    const chapter = byChapter[question.chapter] ?? { total: 0, correct: 0 }
    byChapter[question.chapter] = { total: chapter.total + 1, correct: chapter.correct + Number(right) }
    correct += Number(right)
  }
  return { at: now, total: questions.length, correct, durationSec, byChapter }
}
