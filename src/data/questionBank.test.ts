import { describe, expect, it } from 'vitest'
import { allQuestions, chapters, performanceQuestions, questionsByDomain } from './content'
import { DOMAINS, domainTitle, ESSAY_DOMAIN } from './domains'
import { getChapterMeta } from '../lib/chapterMeta'

const raws = import.meta.glob('../content/questions/*.md', {
  query: '?raw', eager: true, import: 'default',
}) as Record<string, string>

const sources = Object.entries(raws).map(([path, raw]) => ({
  path,
  key: path.split('/').pop()!.replace(/-\d+题\.md$/, ''),
  raw,
  parts: raw.split('\n## ').slice(1),
}))
const questions = chapters.flatMap((chapter) => chapter.questions)
const normalizeStem = (text: string) => text
  .replace(/^\d+\.\s*/, '')
  .replace(/[\s\p{P}]/gu, '')

// 使用题库已有词表；目标名称与标签不同的条目在此显式对应。
const TOPIC_MINIMUMS = [
  { target: '两化融合', topic: '两化融合', minimum: 10 },
  { target: '智能制造', topic: '智能制造', minimum: 10 },
  { target: '数字社会', topic: '数字社会', minimum: 10 },
  { target: '元宇宙', topic: '元宇宙', minimum: 10 },
  { target: '物联网', topic: '物联网', minimum: 10 },
  { target: '虚拟现实与增强现实', topic: '虚拟现实', minimum: 10 },
  { target: '应用集成', topic: '应用集成', minimum: 10 },
  { target: '架构设计', topic: '软件架构', minimum: 10 },
  { target: 'IT 治理', topic: '信息系统治理', minimum: 10 },
  { target: 'IT 审计', topic: '信息系统审计', minimum: 10 },
  { target: '沟通模型', topic: '沟通模型', minimum: 10 },
  { target: '决策分析', topic: '多标准决策分析', minimum: 10 },
  { target: '数据标准化', topic: '数据标准化', minimum: 10 },
  { target: '实施定性风险分析', topic: '定性风险分析', minimum: 10 },
  { target: '控制采购', topic: '控制采购', minimum: 10 },
  { target: '制订进度计划', topic: '制订进度计划', minimum: 15 },
  { target: '控制进度', topic: '控制进度', minimum: 15 },
  { target: '制订预算', topic: '制订预算', minimum: 15 },
  { target: '估算成本', topic: '估算成本', minimum: 15 },
  { target: '控制成本', topic: '控制成本', minimum: 15 },
  { target: '规划质量管理', topic: '规划质量管理', minimum: 15 },
  { target: '控制质量', topic: '控制质量', minimum: 15 },
  { target: '识别风险', topic: '识别风险', minimum: 15 },
  { target: '可行性研究', topic: '可行性研究', minimum: 15 },
  { target: '实施整体变更控制', topic: '整体变更控制', minimum: 15 },
  { target: '信息安全', topic: '信息安全管理', minimum: 15 },
  { target: '线性规划', topic: '线性规划', minimum: 15 },
] as const
const NETWORK_TOPICS = new Set(['关键路径', '浮动时间', '网络时间参数', '双代号网络'])

describe('question bank', () => {
  it('question bank: rising and recurring topics meet their required question counts', () => {
    for (const { target, topic, minimum } of TOPIC_MINIMUMS) {
      const count = questions.filter((question) => question.topic === topic).length
      expect(count, `${target} (${topic}): ${count}/${minimum}`).toBeGreaterThanOrEqual(minimum)
    }
  })

  it('question bank: network topics contain at least 30 schedule questions', () => {
    const networkQuestions = questions.filter((question) => (
      question.domain === 'schedule' && NETWORK_TOPICS.has(question.topic)
    ))
    expect(networkQuestions.length).toBeGreaterThanOrEqual(30)
  })

  it('question bank: governance communication and stakeholder domains each contain at least 25 questions', () => {
    for (const key of ['is-governance', 'communication', 'stakeholder']) {
      const count = questions.filter((question) => question.domain === key).length
      expect(count, `${domainTitle(key)}: ${count}/25`).toBeGreaterThanOrEqual(25)
    }
  })

  it('question bank: every question has exactly four distinct nonempty options', () => {
    for (const source of sources) {
      const chapter = chapters.find((item) => item.key === source.key)!
      source.parts.forEach((part, i) => {
        const context = `${source.key}-${i + 1}`
        const matches = [...part.matchAll(/^([ABCD])\.\s+(.+)$/gm)]
        expect(matches.map((match) => match[1]), context).toEqual(['A', 'B', 'C', 'D'])
        const rawStem = part.slice(0, part.search(/^A\.\s+/m)).trim().replace(/^\d+\.\s*/, '')
        expect(chapter.questions[i].text, `${context}: all conditions must be visible`).toBe(rawStem)
        const options = matches.map((match) => match[2].trim())
        expect(options.every(Boolean), context).toBe(true)
        expect(new Set(options).size, context).toBe(4)
        expect(chapter.questions[i].options.map((option) => option.trim()), context).toEqual(options)
      })
    }
  })

  it('question bank: every raw question explicitly declares one valid answer', () => {
    for (const source of sources) {
      const chapter = chapters.find((item) => item.key === source.key)!
      source.parts.forEach((part, i) => {
        const context = `${source.key}-${i + 1}`
        const answers = [...part.matchAll(/^\*\*答案：([ABCD])\*\*\s*$/gm)]
        expect(answers, context).toHaveLength(1)
        expect(chapter.questions[i].answer, context).toBe('ABCD'.indexOf(answers[0][1]))
      })
    }
  })

  it('question bank: every raw question has a single-line explanation of at least 30 characters', () => {
    for (const source of sources) {
      const chapter = chapters.find((item) => item.key === source.key)!
      source.parts.forEach((part, i) => {
        const context = `${source.key}-${i + 1}`
        const explanations = [...part.matchAll(/^\*\*解析：\*\*[^\S\r\n]*(.*)$/gm)]
        expect(explanations, context).toHaveLength(1)
        expect(Array.from(explanations[0][1].trim()).length, context).toBeGreaterThanOrEqual(30)
        expect(chapter.questions[i].explanation, context).toBe(explanations[0][1].trim())
      })
    }
  })

  it('question bank: each answer occupies 10–40 percent of every chapter with at least 10 questions', () => {
    for (const chapter of chapters) {
      const total = chapter.questions.length
      if (total < 10) continue
      for (let answer = 0; answer < 4; answer++) {
        const count = chapter.questions.filter((question) => question.answer === answer).length
        const context = `${chapter.key}: ${'ABCD'[answer]} = ${count}/${total}`
        expect(count * 10, context).toBeGreaterThanOrEqual(total)
        expect(count * 10, context).toBeLessThanOrEqual(total * 4)
        if (/^(12|13|14|15)-/.test(chapter.key)) {
          expect(count * 10, context).toBeGreaterThanOrEqual(total * 2)
          expect(count * 10, context).toBeLessThanOrEqual(total * 3)
        }
      }
    }
  })

  it('question bank: normalized stems are unique throughout the raw bank', () => {
    const seen = new Map<string, string>()
    for (const question of questions) {
      const stem = normalizeStem(question.text)
      expect(stem, question.id).not.toBe('')
      expect(seen.get(stem), `${question.id} duplicates ${seen.get(stem)}`).toBeUndefined()
      seen.set(stem, question.id)
    }
  })

  it('question bank: stems are independent of preceding questions', () => {
    for (const question of questions) {
      expect(question.text.trim(), question.id).not.toMatch(/^(承上题|接上题|同上|续上题|上题|接前题|承前题)/)
    }
  })

  it('question bank: filename and title counts match the actual parsed questions', () => {
    expect(chapters.length).toBe(sources.length)
    expect(chapters.length).toBeGreaterThan(0)
    for (const source of sources) {
      const chapter = chapters.find((item) => item.key === source.key)!
      const filenameCount = source.path.match(/-(\d+)题\.md$/)
      const titleCount = source.raw.split('\n')[0].match(/^# .*[：:]\s*(\d+)\s*道选择题/)
      expect(filenameCount, source.path).not.toBeNull()
      expect(titleCount, source.path).not.toBeNull()
      expect(chapter.questions.length, source.key).toBeGreaterThan(0)
      expect(source.raw.match(/^## /gm)?.length, source.key).toBe(source.parts.length)
      expect(chapter.questions.length, source.key).toBe(source.parts.length)
      expect(Number(filenameCount![1]), source.path).toBe(chapter.questions.length)
      expect(Number(titleCount![1]), source.path).toBe(chapter.questions.length)
      source.parts.forEach((part, i) => {
        expect(Number(part.match(/^(\d+)\./)?.[1]), `${source.key}-${i + 1}`).toBe(i + 1)
      })
    }
  })

  it('question bank: question ids and chapter keys are unique and follow chapter order', () => {
    expect(new Set(chapters.map((chapter) => chapter.key)).size).toBe(chapters.length)
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    for (const chapter of chapters) {
      chapter.questions.forEach((question, i) => {
        expect(question.id).toBe(`${chapter.key}-${i + 1}`)
        expect(question.chapter).toBe(chapter.key)
      })
    }
  })

  it('question bank: every chapter is registered in both titleMap and chapterMeta', () => {
    const fallback = getChapterMeta('__unregistered_question_bank_chapter__')
    for (const chapter of chapters) {
      expect(chapter.title, chapter.key).not.toBe(chapter.key)
      expect(chapter.title.trim(), chapter.key).not.toBe('')
      expect(getChapterMeta(chapter.key), chapter.key).not.toBe(fallback)
    }
  })

  it('question bank: every raw question declares one valid domain title and a topic of 2–12 characters after the explanation', () => {
    for (const source of sources) {
      const chapter = chapters.find((item) => item.key === source.key)!
      source.parts.forEach((part, i) => {
        const context = `${source.key}-${i + 1}`
        const tags = [...part.matchAll(/^\*\*考点：\*\*[^\S\r\n]*([^/\r\n]+)\s*\/\s*([^\r\n]+)$/gm)]
        expect(tags, context).toHaveLength(1)
        expect(part.match(/\*\*考点：\*\*/g), context).toHaveLength(1)
        expect(part, context).toMatch(/\*\*解析：\*\*[^\r\n]*\n\n\*\*考点：\*\*/)
        const title = tags[0][1].trim()
        const topic = tags[0][2].trim()
        const domain = DOMAINS.find((item) => item.title === title)
        expect(domain, context).toBeDefined()
        expect(Array.from(topic).length, context).toBeGreaterThanOrEqual(2)
        expect(Array.from(topic).length, context).toBeLessThanOrEqual(12)
        expect(chapter.questions[i], context).toMatchObject({ domain: domain!.key, topic })
      })
    }
  })

  it('question bank: positive-weight domains have at least twice their mock quota in eligible questions', () => {
    for (const { key, mockWeight } of DOMAINS.filter((domain) => domain.mockWeight > 0)) {
      const eligible = questionsByDomain[key].filter((q) => !/^(09|09a)(-|$)/.test(q.chapter))
      expect(eligible.length, key).toBeGreaterThanOrEqual(mockWeight * 2)
    }
  })

  it('question bank: domain index preserves all questions and source order, with correct labels for generated, essay and English chapters', () => {
    expect(Object.keys(questionsByDomain)).toEqual(DOMAINS.map((domain) => domain.key))
    const grouped = Object.values(questionsByDomain).flat()
    expect(grouped).toHaveLength(allQuestions.length)
    expect(new Set(grouped.map((q) => q.id)).size).toBe(allQuestions.length)
    for (const { key, title } of DOMAINS) {
      expect(questionsByDomain[key]).toEqual(allQuestions.filter((q) => q.domain === key))
      expect(domainTitle(key)).toBe(title)
    }
    expect(domainTitle('unknown')).toBe('unknown')
    expect(performanceQuestions).toHaveLength(40)
    expect(performanceQuestions.every((q) => q.domain === 'performance' && q.topic === '绩效域辨析')).toBe(true)
    expect(questions.filter((q) => /^(09|09a)-/.test(q.chapter)).every((q) => q.domain === ESSAY_DOMAIN)).toBe(true)
    expect(questions.filter((q) => q.chapter === '20-英文术语').every((q) => q.domain === 'english')).toBe(true)
  })
})
