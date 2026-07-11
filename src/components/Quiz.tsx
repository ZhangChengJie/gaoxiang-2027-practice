import { useState, useCallback } from 'react'
import type { Question } from '../lib/types'
import QuestionCard from './QuestionCard'

export default function Quiz({
  questions,
  onAnswer,
}: {
  questions: Question[]
  onAnswer: (q: Question, right: boolean) => void
}) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const q = questions[index]
  if (!q || questions.length === 0) {
    return <div className="empty-state">暂无题目</div>
  }

  const handleSelect = useCallback(
    (i: number) => {
      if (showResult) return
      setSelected(i)
      setShowResult(true)
      onAnswer(q, i === q.answer)
    },
    [showResult, q, onAnswer],
  )

  const handleNext = useCallback(() => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      setShowResult(false)
    }
  }, [index, questions.length])

  const handlePrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1)
      setSelected(null)
      setShowResult(false)
    }
  }, [index])

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-progress">
          {index + 1} / {questions.length}
        </span>
        <span className="quiz-chapter">{q.chapter}</span>
      </div>

      <QuestionCard question={q} selected={selected} onSelect={handleSelect} showResult={showResult} />

      {showResult && (
        <div className="quiz-nav-buttons">
          <button className="quiz-nav-btn" onClick={handlePrev} disabled={index === 0}>
            ← 上一题
          </button>
          {index < questions.length - 1 ? (
            <button className="quiz-nav-btn primary" onClick={handleNext}>
              下一题 →
            </button>
          ) : (
            <button className="quiz-nav-btn primary" onClick={() => {
              setIndex(0)
              setSelected(null)
              setShowResult(false)
            }}>
              重新开始
            </button>
          )}
        </div>
      )}

      <div className="quiz-dots">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`quiz-dot ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
            onClick={() => {
              setIndex(i)
              setSelected(null)
              setShowResult(false)
            }}
          />
        ))}
      </div>
    </div>
  )
}
