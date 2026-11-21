import { describe, expect, it } from 'vitest'
import { applyAnswer, emptyProgress } from './progress'
import { emptyPractice, recordCaseAttempt } from './practiceStore'
import { mergeSyncPayload, type SyncPayload } from './syncMerge'

describe('syncMerge (双设备无损双向合并):', () => {
  it('工作手机与生活手机分别刷不同题后合并，双端记录全部保留', () => {
    const t1 = 1_700_000_000_000
    const t2 = t1 + 60_000

    let pWork = applyAnswer(emptyProgress(), 'q1', true, t1)
    pWork = applyAnswer(pWork, 'q2', false, t1)

    let pLife = applyAnswer(emptyProgress(), 'q3', true, t2)
    pLife = applyAnswer(pLife, 'q4', false, t2)

    const work: SyncPayload = {
      version: 1,
      progress: pWork,
      practice: recordCaseAttempt(emptyPractice(), 'cp-01', { at: t1, answers: {}, hits: ['a'], score: 18, total: 25 }),
      caseRead: ['cp-01'],
      essayRead: ['ai-llm-delivery'],
    }
    const life: SyncPayload = {
      version: 1,
      progress: pLife,
      practice: recordCaseAttempt(emptyPractice(), 'cp-02', { at: t2, answers: {}, hits: ['b'], score: 20, total: 25 }),
      caseRead: ['cp-02'],
      essayRead: ['pd-delivery'],
    }

    const merged = mergeSyncPayload(work, life)
    expect(Object.keys(merged.progress.answered).sort()).toEqual(['q1', 'q2', 'q3', 'q4'])
    expect(Object.keys(merged.progress.wrong).sort()).toEqual(['q2', 'q4'])
    expect(Object.keys(merged.practice.cases).sort()).toEqual(['cp-01', 'cp-02'])
    expect(merged.caseRead?.sort()).toEqual(['cp-01', 'cp-02'])
    expect(merged.essayRead?.sort()).toEqual(['ai-llm-delivery', 'pd-delivery'])
  })

  it('同一题在两台手机上重复作答时，保留尝试次数更高的记录并保留错因', () => {
    const t1 = 1_700_000_000_000
    const t2 = t1 + 10_000
    const p1 = applyAnswer(emptyProgress(), 'q1', false, t1)
    p1.wrong.q1.cause = 'careless'
    let p2 = applyAnswer(emptyProgress(), 'q1', false, t1)
    p2 = applyAnswer(p2, 'q1', true, t2)

    const merged = mergeSyncPayload(
      { version: 1, progress: p1, practice: emptyPractice() },
      { version: 1, progress: p2, practice: emptyPractice() },
    )
    expect(merged.progress.stats.q1.attempts).toBe(2)
    expect(merged.progress.stats.q1.correct).toBe(1)
    expect(merged.progress.wrong.q1?.cause).toBe('careless')
  })
})
