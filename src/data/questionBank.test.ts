import { describe, expect, it } from 'vitest'
import { chapters } from './content'
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

describe('question bank', () => {
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
})
