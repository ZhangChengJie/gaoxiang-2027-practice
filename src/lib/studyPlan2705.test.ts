import { describe, expect, it } from 'vitest'
import { getStudyPlanStatus, STUDY_STAGES_2705 } from './studyPlan2705'
import { applyAnswersBatch, emptyProgress } from './progress'

describe('studyPlan2705:', () => {
  it('2026-11-21 处于第 1 周第 5 天，对应节点①（11.29），剩余 8 天', () => {
    const s = getStudyPlanStatus(new Date(2026, 10, 21, 10, 0).getTime())
    expect(s.week).toBe(1)
    expect(s.dayIndex).toBe(5)
    expect(s.stage.checkpointKey).toBe('checkpoint-1')
    expect(s.daysToCheckpoint).toBe(8)
    expect(s.isFinished).toBe(false)
  })

  it('跨阶段自动切换节点②、③、④，结束后标记 isFinished', () => {
    expect(getStudyPlanStatus(new Date(2026, 11, 5).getTime()).stage.checkpointKey).toBe('checkpoint-2')
    expect(getStudyPlanStatus(new Date(2026, 11, 25).getTime()).stage.checkpointKey).toBe('checkpoint-3')
    expect(getStudyPlanStatus(new Date(2027, 0, 10).getTime()).stage.checkpointKey).toBe('checkpoint-4')
    const after = getStudyPlanStatus(new Date(2027, 0, 20).getTime())
    expect(after.isFinished).toBe(true)
    expect(after.week).toBe(9)
    expect(STUDY_STAGES_2705).toHaveLength(4)
  })

  it('applyAnswersBatch 一次性批量更新统计、错题与当日计数', () => {
    const now = Date.now()
    const next = applyAnswersBatch(
      emptyProgress(),
      [
        { questionId: 'q1', right: true },
        { questionId: 'q2', right: false },
        { questionId: 'q3', right: true },
      ],
      now,
    )
    expect(Object.keys(next.answered)).toEqual(['q1', 'q2', 'q3'])
    expect(Object.keys(next.wrong)).toEqual(['q2'])
    expect(next.stats.q1.correct).toBe(1)
    expect(next.stats.q2.correct).toBe(0)
  })
})
