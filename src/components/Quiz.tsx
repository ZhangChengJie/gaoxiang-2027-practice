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

  const handleSelect = useCallback(
    (i: number) => {
      if (showResult || !q) return
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

  if (!q || questions.length === 0) {
    return <div className="empty-state">暂无题目</div>
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="quiz-progress">
          第 {index + 1} 题 / 共 {questions.length} 题
        </span>
        <span className="quiz-chapter">{q.chapter}</span>
      </div>

      <div
        className="quiz-progress-bar"
        role="progressbar"
        aria-label="题目位置"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={index + 1}
        aria-valuetext={`第 ${index + 1} 题，共 ${questions.length} 题`}
      >
        <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
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

      {questions.length <= 20 && (
        <div className="quiz-dots" aria-label="跳转题目">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`quiz-dot ${i === index ? 'active' : ''} ${i < index ? 'done' : ''}`}
              aria-label={`跳转到第 ${i + 1} 题`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => {
                setIndex(i)
                setSelected(null)
                setShowResult(false)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
