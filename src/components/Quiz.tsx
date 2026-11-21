import { useState, useCallback, useRef, useEffect, useMemo, type TouchEvent } from 'react'
import type { ErrorCause, Question } from '../lib/types'
import { ERROR_CAUSE_LABELS } from '../lib/progress'
import { useProgress } from '../hooks/useProgress'
import QuestionCard from './QuestionCard'
import SessionSummary from './SessionSummary'

const CAUSES = Object.keys(ERROR_CAUSE_LABELS) as ErrorCause[]
const CURSOR_STORAGE_KEY = 'gaoxiang-2027-quiz-cursor-v1'
const SHUFFLE_PREF_KEY = 'gaoxiang-2027-shuffle-options'
const FONT_PREF_KEY = 'gaoxiang-2027-font-large'

function readCursor(sessionKey?: string): number {
  if (!sessionKey) return 0
  try {
    const raw = JSON.parse(localStorage.getItem(CURSOR_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    const n = raw[sessionKey]
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function writeCursor(sessionKey: string | undefined, idx: number): void {
  if (!sessionKey) return
  try {
    const raw = JSON.parse(localStorage.getItem(CURSOR_STORAGE_KEY) ?? '{}') as Record<string, number>
    raw[sessionKey] = idx
    localStorage.setItem(CURSOR_STORAGE_KEY, JSON.stringify(raw))
  } catch {
    // 忽略存储不可用
  }
}

function readBoolPref(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeBoolPref(key: string, val: boolean): void {
  try {
    localStorage.setItem(key, val ? '1' : '0')
  } catch {
    // 忽略
  }
}

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function shuffleQuestionOptions(q: Question, seed: number): Question {
  const n = q.options.length
  if (n <= 1) return q
  const order = Array.from({ length: n }, (_, i) => i)
  let s = hashSeed(`${q.id}:${seed}`)
  for (let i = n - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return {
    ...q,
    options: order.map((idx) => q.options[idx]),
    answer: order.indexOf(q.answer),
  }
}

export default function Quiz({
  questions,
  onAnswer,
  sessionKey,
  targetAccuracy,
  allowFilterUnanswered = true,
}: {
  questions: Question[]
  onAnswer: (q: Question, right: boolean) => void
  sessionKey?: string
  targetAccuracy?: number
  allowFilterUnanswered?: boolean
}) {
  const { progress, setCause } = useProgress()
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
  const [unansweredSnapshot, setUnansweredSnapshot] = useState<Question[] | null>(null)
  const [shuffleOptions, setShuffleOptions] = useState(() => readBoolPref(SHUFFLE_PREF_KEY))
  const [largeFont, setLargeFont] = useState(() => readBoolPref(FONT_PREF_KEY))
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now() & 0xffff)
  const [showSheet, setShowSheet] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const baseQuestions = onlyUnanswered && unansweredSnapshot ? unansweredSnapshot : questions
  const displayQuestions = useMemo(
    () => (shuffleOptions ? baseQuestions.map((item) => shuffleQuestionOptions(item, shuffleSeed)) : baseQuestions),
    [baseQuestions, shuffleOptions, shuffleSeed],
  )

  const [index, setIndex] = useState(() => {
    const saved = readCursor(sessionKey)
    return saved < questions.length ? saved : 0
  })
  // 本轮作答：题目下标 → 所选选项；回看时保留结果，不重复计数
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [finished, setFinished] = useState(false)
  const startedAt = useRef(Date.now())
  const [elapsedSec, setElapsedSec] = useState(0)

  const safeIndex = Math.min(index, Math.max(0, displayQuestions.length - 1))
  const q = displayQuestions[safeIndex]
  const selected = answers[safeIndex] ?? null
  const showResult = selected !== null
  const answeredCount = Object.keys(answers).length
  const totalUnanswered = useMemo(
    () => questions.filter((item) => !progress.answered[item.id]).length,
    [questions, progress.answered],
  )

  useEffect(() => {
    if (!onlyUnanswered && sessionKey) {
      writeCursor(sessionKey, safeIndex)
    }
  }, [safeIndex, onlyUnanswered, sessionKey])

  const handleSelect = useCallback(
    (i: number) => {
      if (!q || answers[safeIndex] !== undefined) return
      setAnswers((prev) => ({ ...prev, [safeIndex]: i }))
      onAnswer(q, i === q.answer)
    },
    [q, safeIndex, answers, onAnswer],
  )

  const finish = useCallback(() => {
    setElapsedSec(Math.round((Date.now() - startedAt.current) / 1000))
    setFinished(true)
  }, [])

  const restart = () => {
    setAnswers({})
    setIndex(0)
    setFinished(false)
    setShowSheet(false)
    setShuffleSeed((s) => (s + 1) & 0xffff)
    startedAt.current = Date.now()
    if (onlyUnanswered) {
      setUnansweredSnapshot(questions.filter((item) => !progress.answered[item.id]))
    }
  }

  const toggleOnlyUnanswered = () => {
    if (!onlyUnanswered) {
      setUnansweredSnapshot(questions.filter((item) => !progress.answered[item.id]))
      setOnlyUnanswered(true)
      setIndex(0)
      setAnswers({})
      setShowSheet(false)
      startedAt.current = Date.now()
    } else {
      setOnlyUnanswered(false)
      setUnansweredSnapshot(null)
      const saved = readCursor(sessionKey)
      setIndex(saved < questions.length ? saved : 0)
      setAnswers({})
      setShowSheet(false)
    }
  }

  const toggleShuffleOptions = () => {
    const next = !shuffleOptions
    setShuffleOptions(next)
    setAnswers({})
    writeBoolPref(SHUFFLE_PREF_KEY, next)
  }

  const toggleLargeFont = () => {
    const next = !largeFont
    setLargeFont(next)
    writeBoolPref(FONT_PREF_KEY, next)
  }

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current || e.changedTouches.length !== 1) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    if (dx < 0 && safeIndex < displayQuestions.length - 1) setIndex(safeIndex + 1)
    else if (dx > 0 && safeIndex > 0) setIndex(safeIndex - 1)
  }

  // 键盘快捷键：A-D / 1-4 选答案，← / → 切题，Enter 下一题
  useEffect(() => {
    if (finished || !q) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const key = e.key.toLowerCase()
      const optIdx = ['a', 'b', 'c', 'd'].indexOf(key) !== -1
        ? ['a', 'b', 'c', 'd'].indexOf(key)
        : ['1', '2', '3', '4'].indexOf(key)
      if (optIdx !== -1 && optIdx < q.options.length && !showResult) {
        e.preventDefault()
        handleSelect(optIdx)
      } else if (e.key === 'ArrowLeft' && safeIndex > 0) {
        e.preventDefault()
        setIndex(safeIndex - 1)
      } else if ((e.key === 'ArrowRight' || (e.key === 'Enter' && showResult)) && safeIndex < displayQuestions.length - 1) {
        e.preventDefault()
        setIndex(safeIndex + 1)
      } else if (e.key === 'Escape' && showSheet) {
        setShowSheet(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finished, q, showResult, safeIndex, displayQuestions.length, showSheet, handleSelect])

  if (questions.length === 0) {
    return <div className="empty-state">暂无题目</div>
  }

  if (onlyUnanswered && displayQuestions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎉</div>
        <p>本组 {questions.length} 道题目已全部刷过！</p>
        <button type="button" className="action-btn primary" onClick={toggleOnlyUnanswered}>
          切换回全部题目复刷
        </button>
      </div>
    )
  }

  if (!q) {
    return <div className="empty-state">暂无题目</div>
  }

  if (finished) {
    return (
      <SessionSummary
        questions={displayQuestions}
        answers={answers}
        elapsedSec={elapsedSec}
        targetAccuracy={targetAccuracy}
        onRestart={restart}
        onBack={() => setFinished(false)}
      />
    )
  }

  const isLast = safeIndex === displayQuestions.length - 1
  const wrongRecord = progress.wrong[q.id]

  return (
    <div
      className={`quiz-container quiz-with-sticky ${largeFont ? 'quiz-large-font' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {questions.length > 1 && (
        <div className="quiz-toolbar" role="toolbar" aria-label="刷题设置">
          {allowFilterUnanswered && (
            <button
              type="button"
              className={`chip quiz-tool-chip ${onlyUnanswered ? 'active' : ''}`}
              aria-pressed={onlyUnanswered}
              onClick={toggleOnlyUnanswered}
            >
              只刷未做（{totalUnanswered}）
            </button>
          )}
          <button
            type="button"
            className={`chip quiz-tool-chip ${shuffleOptions ? 'active' : ''}`}
            aria-pressed={shuffleOptions}
            onClick={toggleShuffleOptions}
          >
            选项乱序
          </button>
          <button
            type="button"
            className={`chip quiz-tool-chip ${largeFont ? 'active' : ''}`}
            aria-pressed={largeFont}
            onClick={toggleLargeFont}
          >
            {largeFont ? 'A- 标准字' : 'A+ 大字'}
          </button>
        </div>
      )}

      <div className="quiz-header">
        <span className="quiz-progress">
          第 {safeIndex + 1} 题 / 共 {displayQuestions.length} 题
        </span>
        <span className="quiz-chapter">{q.topic || q.chapter}</span>
      </div>

      <div
        className="quiz-progress-bar"
        role="progressbar"
        aria-label="题目位置"
        aria-valuemin={0}
        aria-valuemax={displayQuestions.length}
        aria-valuenow={safeIndex + 1}
        aria-valuetext={`第 ${safeIndex + 1} 题，共 ${displayQuestions.length} 题`}
      >
        <span style={{ width: `${((safeIndex + 1) / displayQuestions.length) * 100}%` }} />
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

      {!isLast && answeredCount > 0 && (
        <button type="button" className="quiz-finish-link" onClick={finish}>
          结束本轮，查看小结（已答 {answeredCount} 题）
        </button>
      )}

      <div className="quiz-sticky-bar" role="region" aria-label="题目导航">
        <button
          type="button"
          className="quiz-nav-btn"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={safeIndex === 0}
        >
          ← 上一题
        </button>
        <button
          type="button"
          className="quiz-sheet-trigger"
          onClick={() => setShowSheet(true)}
          aria-label={`打开题号列表，当前第 ${safeIndex + 1} 题，共 ${displayQuestions.length} 题`}
        >
          {safeIndex + 1}/{displayQuestions.length}
        </button>
        {isLast ? (
          <button type="button" className="quiz-nav-btn primary" onClick={finish} disabled={answeredCount === 0}>
            查看小结
          </button>
        ) : (
          <button
            type="button"
            className="quiz-nav-btn primary"
            onClick={() => setIndex((i) => Math.min(displayQuestions.length - 1, i + 1))}
          >
            {showResult ? '下一题 →' : '跳过 →'}
          </button>
        )}
      </div>

      {showSheet && (
        <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="题号跳转" onClick={() => setShowSheet(false)}>
          <div className="sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <strong>题号列表（{safeIndex + 1}/{displayQuestions.length}）</strong>
              <button type="button" className="sheet-close" onClick={() => setShowSheet(false)} aria-label="关闭">
                ✕
              </button>
            </div>
            <div className="answer-sheet sheet-body">
              {displayQuestions.map((item, i) => {
                const a = answers[i]
                const state = a !== undefined
                  ? (a === item.answer ? 'right' : 'miss')
                  : (progress.answered[item.id] ? 'filled' : '')
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`answer-sheet-cell ${state} ${i === safeIndex ? 'current' : ''}`}
                    aria-label={`跳转到第 ${i + 1} 题`}
                    onClick={() => {
                      setIndex(i)
                      setShowSheet(false)
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
