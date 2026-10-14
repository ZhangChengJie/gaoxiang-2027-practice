import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { allQuestions } from '../data/content'
import { specialTests } from '../data/specialTests'
import { useProgress } from '../hooks/useProgress'
import Quiz from '../components/Quiz'
import BackButton from '../components/BackButton'

export default function TestSession() {
  const { type } = useParams<{ type: string }>()
  const { update, progress } = useProgress()

  const test = specialTests.find((t) => t.key === type)
  // 进入时定好题目：作答会改变错题本，不能让题单在练习中途变化
  const [questions] = useState(() => (test ? test.filter(allQuestions, progress) : []))

  if (!test) {
    return (
      <div className="page">
        <BackButton to="/specials" />
        <div className="empty-state">未找到该专项训练</div>
      </div>
    )
  }

  return (
    <div className="page test-session-page">
      <BackButton to="/specials" />
      <div className="test-hero">
        <span className="test-icon">{test.icon}</span>
        <h1>{test.title}</h1>
        <p>{test.description} · 共 {questions.length} 题</p>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">暂无匹配的题目</div>
      ) : (
        <Quiz questions={questions} onAnswer={update} />
      )}
    </div>
  )
}
