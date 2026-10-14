import { useState, useCallback, useRef } from 'react'
import type { ErrorCause, Question } from '../lib/types'
import { ERROR_CAUSE_LABELS } from '../lib/progress'
import { useProgress } from '../hooks/useProgress'
import QuestionCard from './QuestionCard'
import SessionSummary from './SessionSummary'

const CAUSES = Object.keys(ERROR_CAUSE_LABELS) as ErrorCause[]

export default function Quiz({
  questions,
  onAnswer,
}: {
  questions: Question[]
  onAnswer: (q: Question, right: boolean) => void
}) {
  const { progress, setCause } = useProgress()
  const [index, setIndex] = useState(0)
  // 本轮作答：题目下标 → 所选选项；回看时保留结果，不重复计数
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [finished, setFinished] = useState(false)
  const startedAt = useRef(Date.now())
  const [elapsedSec, setElapsedSec] = useState(0)

  const q = questions[index]
  const selected = answers[index] ?? null
  const showResult = selected !== null
  const answeredCount = Object.keys(answers).length

  const handleSelect = useCallback(
    (i: number) => {
      if (!q || answers[index] !== undefined) return
      setAnswers((prev) => ({ ...prev, [index]: i }))
      onAnswer(q, i === q.answer)
    },
    [q, index, answers, onAnswer],
  )

  const finish = () => {
    setElapsedSec(Math.round((Date.now() - startedAt.current) / 1000))
    setFinished(true)
  }

  const restart = () => {
    setAnswers({})
    setIndex(0)
    setFinished(false)
    startedAt.current = Date.now()
  }

  if (!q || questions.length === 0) {
    return <div className="empty-state">暂无题目</div>
  }

  if (finished) {
    return (
      <SessionSummary
        questions={questions}
        answers={answers}
        elapsedSec={elapsedSec}
        onRestart={restart}
        onBack={() => setFinished(false)}
      />
    )
  }

  const isLast = index === questions.length - 1
  const wrongRecord = progress.wrong[q.id]

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

      {showResult && selected !== q.answer && wrongRecord && (
        <div className="cause-picker" role="group" aria-label="标记错因">
          <span className="cause-picker-label">错因</span>
          {CAUSES.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${wrongRecord.cause === c ? 'active' : ''}`}
              aria-pressed={wrongRecord.cause === c}
              onClick={() => setCause(q.id, c)}
            >
              {ERROR_CAUSE_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      <div className="quiz-nav-buttons">
        <button
          className="quiz-nav-btn"
          onClick={() => setIndex((i) => i - 1)}
          disabled={index === 0}
        >
          ← 上一题
        </button>
        {isLast ? (
          <button className="quiz-nav-btn primary" onClick={finish} disabled={answeredCount === 0}>
            查看小结
          </button>
        ) : (
          <button className="quiz-nav-btn primary" onClick={() => setIndex((i) => i + 1)}>
            {showResult ? '下一题 →' : '跳过 →'}
          </button>
        )}
      </div>

      {!isLast && answeredCount > 0 && (
        <button type="button" className="quiz-finish-link" onClick={finish}>
          结束本轮，查看小结（已答 {answeredCount} 题）
        </button>
      )}

      {questions.length <= 30 && (
        <div className="quiz-dots" aria-label="跳转题目">
          {questions.map((item, i) => {
            const a = answers[i]
            const state = a === undefined ? '' : a === item.answer ? 'right' : 'miss'
            return (
              <button
                key={item.id}
                type="button"
                className={`quiz-dot ${i === index ? 'active' : ''} ${state}`}
                aria-label={`跳转到第 ${i + 1} 题`}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => setIndex(i)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
