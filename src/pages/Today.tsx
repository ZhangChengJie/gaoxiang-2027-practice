import { useState } from 'react'
import { allQuestions } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { buildDailyPlan } from '../lib/dailyPlan'
import Quiz from '../components/Quiz'
import BackButton from '../components/BackButton'

export default function Today() {
  const { progress, update } = useProgress()
  // 进入页面时定好本轮题目，作答过程中不再变化
  const [plan] = useState(() => buildDailyPlan(allQuestions, progress, Date.now()))
  const questions = [...plan.review, ...plan.fresh]

  return (
    <div className="page chapter-page">
      <BackButton to="/" />
      <div className="chapter-hero">
        <h1>今日任务</h1>
        <p>
          先复习到期错题 {plan.review.length} 题，再做新题 {plan.fresh.length} 题（优先正确率低的章节）
        </p>
      </div>
      <Quiz questions={questions} onAnswer={update} />
    </div>
  )
}
