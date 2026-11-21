import { useMemo, useState } from 'react'
import { allQuestions } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { buildDailyPlan } from '../lib/dailyPlan'
import { getStudyPlanStatus } from '../lib/studyPlan2705'
import Quiz from '../components/Quiz'
import BackButton from '../components/BackButton'

export default function Today() {
  const { progress, update } = useProgress()
  const [stageOnly, setStageOnly] = useState(false)
  const status = useMemo(() => getStudyPlanStatus(Date.now()), [])
  const stageDomains = useMemo(() => new Set(status.stage.domains), [status])

  // 切换模式时生成该模式的冻结题单，作答过程中不再变化
  const [plans] = useState(() => {
    const now = Date.now()
    return {
      all: buildDailyPlan(allQuestions, progress, now),
      stage: buildDailyPlan(allQuestions, progress, now, Math.random, stageDomains),
    }
  })

  const plan = stageOnly ? plans.stage : plans.all
  const questions = [...plan.review, ...plan.fresh]

  return (
    <div className="page chapter-page">
      <BackButton to="/" />
      <div className="chapter-hero">
        <h1>今日任务</h1>
        <p>
          先复习到期错题 {plan.review.length} 题，再做新题 {plan.fresh.length} 题
          {stageOnly ? `（仅限当前阶段：${status.stage.label}）` : '（全库优先正确率低的知识域）'}
        </p>
      </div>
      <div className="mode-switch" role="group" aria-label="出题范围">
        <button
          type="button"
          className={`chip ${!stageOnly ? 'active' : ''}`}
          aria-pressed={!stageOnly}
          onClick={() => setStageOnly(false)}
        >
          全库薄弱优先
        </button>
        <button
          type="button"
          className={`chip ${stageOnly ? 'active' : ''}`}
          aria-pressed={stageOnly}
          onClick={() => setStageOnly(true)}
        >
          当前周范围（{status.stage.label.split(' · ')[0]}）
        </button>
      </div>
      <Quiz
        key={stageOnly ? 'today-stage' : 'today-all'}
        questions={questions}
        onAnswer={update}
        allowFilterUnanswered={false}
      />
    </div>
  )
}
