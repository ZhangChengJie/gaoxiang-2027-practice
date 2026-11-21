import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { allQuestions } from '../data/content'
import { specialTests } from '../data/specialTests'
import { useProgress } from '../hooks/useProgress'
import type { Question } from '../lib/types'
import Quiz from '../components/Quiz'
import BackButton from '../components/BackButton'

const CHECKPOINT_SAMPLE_SIZE = 50
const CHECKPOINT_TARGET = 0.85

function sampleQuestions(pool: Question[], count: number): Question[] {
  const arr = [...pool]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, Math.min(count, arr.length))
}

export default function TestSession() {
  const { type } = useParams<{ type: string }>()
  const { update, progress } = useProgress()

  const test = specialTests.find((t) => t.key === type)
  const isCheckpoint = Boolean(test?.key.startsWith('checkpoint-'))

  // 进入时定好题目：作答会改变错题本，不能让题单在练习中途变化
  const [fullQuestions] = useState(() => (test ? test.filter(allQuestions, progress) : []))
  const [sampleMode, setSampleMode] = useState(isCheckpoint)
  const [sampledQuestions, setSampledQuestions] = useState(() =>
    isCheckpoint ? sampleQuestions(fullQuestions, CHECKPOINT_SAMPLE_SIZE) : [],
  )
  const [sampleRun, setSampleRun] = useState(0)

  if (!test) {
    return (
      <div className="page">
        <BackButton to="/specials" />
        <div className="empty-state">未找到该专项训练</div>
      </div>
    )
  }

  const questions = isCheckpoint && sampleMode ? sampledQuestions : fullQuestions

  const resample = () => {
    setSampledQuestions(sampleQuestions(fullQuestions, CHECKPOINT_SAMPLE_SIZE))
    setSampleRun((r) => r + 1)
  }

  return (
    <div className="page test-session-page">
      <BackButton to="/specials" />
      <div className="test-hero">
        <span className="test-icon">{test.icon}</span>
        <h1>{test.title}</h1>
        <p>
          {test.description} · 当前 {questions.length} 题
          {isCheckpoint ? `（题池共 ${fullQuestions.length} 题）` : ''}
        </p>
      </div>

      {isCheckpoint && fullQuestions.length > CHECKPOINT_SAMPLE_SIZE && (
        <div className="mode-switch" role="group" aria-label="验收模式">
          <button
            type="button"
            className={`chip ${sampleMode ? 'active' : ''}`}
            aria-pressed={sampleMode}
            onClick={() => setSampleMode(true)}
          >
            验收抽测（随机 {CHECKPOINT_SAMPLE_SIZE} 题 · ≥85%）
          </button>
          <button
            type="button"
            className={`chip ${!sampleMode ? 'active' : ''}`}
            aria-pressed={!sampleMode}
            onClick={() => setSampleMode(false)}
          >
            全量查漏（{fullQuestions.length} 题）
          </button>
          {sampleMode && (
            <button type="button" className="chip" onClick={resample}>
              换一组
            </button>
          )}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="empty-state">暂无匹配的题目</div>
      ) : (
        <Quiz
          key={isCheckpoint && sampleMode ? `${test.key}-sample-${sampleRun}` : `${test.key}-full`}
          sessionKey={isCheckpoint && sampleMode ? undefined : `special:${test.key}`}
          questions={questions}
          onAnswer={update}
          targetAccuracy={isCheckpoint && sampleMode ? CHECKPOINT_TARGET : undefined}
          allowFilterUnanswered={!(isCheckpoint && sampleMode)}
        />
      )}
    </div>
  )
}
