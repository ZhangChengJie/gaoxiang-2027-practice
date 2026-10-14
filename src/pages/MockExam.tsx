import { useEffect, useMemo, useState } from 'react'
import { allQuestions, chapters } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { buildMockExam, scoreMock, MOCK_DURATION_SEC, MOCK_TOTAL } from '../lib/mock'
import { getChapterMeta } from '../lib/chapterMeta'
import type { MockResult, Question } from '../lib/types'
import BackButton from '../components/BackButton'
import QuestionCard from '../components/QuestionCard'
import { formatDuration } from '../lib/format'

const SESSION_KEY = 'gaoxiang-2027-mock-session'
const PASS_LINE = 45

type MockSession = { ids: string[]; answers: Record<string, number>; startedAt: number; submitted?: MockResult }

function loadSession(): MockSession | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
    if (raw && Array.isArray(raw.ids) && typeof raw.startedAt === 'number') return { answers: {}, ...raw }
  } catch {
    // 读不到就当没有进行中的考试
  }
  return null
}

function saveSession(s: MockSession | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // 存不下时考试仍可在本页继续
  }
}

const byId = new Map(allQuestions.map((q) => [q.id, q]))

export default function MockExam() {
  const { progress, update, recordMockResult } = useProgress()
  const [session, setSession] = useState<MockSession | null>(loadSession)
  const [index, setIndex] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [showSheet, setShowSheet] = useState(false)

  const questions = useMemo(
    () => (session ? session.ids.map((id) => byId.get(id)).filter((q): q is Question => q !== undefined) : []),
    [session],
  )

  const persist = (s: MockSession | null) => {
    setSession(s)
    saveSession(s)
  }

  const start = () => {
    const qs = buildMockExam(chapters)
    setIndex(0)
    persist({ ids: qs.map((q) => q.id), answers: {}, startedAt: Date.now() })
  }

  const submit = (s: MockSession) => {
    const durationSec = Math.min(MOCK_DURATION_SEC, Math.round((Date.now() - s.startedAt) / 1000))
    const result = scoreMock(questions, s.answers, durationSec, Date.now())
    for (const q of questions) {
      const a = s.answers[q.id]
      if (a !== undefined) update(q, a === q.answer)
    }
    recordMockResult(result)
    setIndex(0)
    persist({ ...s, submitted: result })
  }

  const inExam = session !== null && !session.submitted
  const remaining = session ? Math.max(0, MOCK_DURATION_SEC - Math.floor((now - session.startedAt) / 1000)) : MOCK_DURATION_SEC

  useEffect(() => {
    if (!inExam) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [inExam])

  useEffect(() => {
    if (inExam && remaining === 0 && session) submit(session)
    // 只在倒计时归零时自动交卷
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inExam, remaining])

  if (!session) {
    const history = [...progress.mockHistory].reverse().slice(0, 10)
    return (
      <div className="page mock-page">
        <BackButton to="/specials" />
        <div className="test-hero">
          <span className="test-icon">📝</span>
          <h1>机考模拟</h1>
          <p>
            按 2021—2026 真题知识域分布抽 {MOCK_TOTAL} 题，限时 150 分钟，交卷后统一出分；英文题放在最后。
          </p>
        </div>
        <div className="wrong-actions">
          <button className="action-btn primary" onClick={start}>
            开始模考
          </button>
        </div>
        {history.length > 0 && (
          <section className="home-section" aria-labelledby="mock-history-title">
            <h2 className="section-title" id="mock-history-title">最近成绩（合格线 {PASS_LINE}）</h2>
            <ul className="mock-history">
              {history.map((r) => (
                <li key={r.at}>
                  <span>{new Date(r.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className={r.correct >= PASS_LINE ? 'mock-pass' : 'mock-fail'}>
                    {r.correct}/{r.total}
                  </span>
                  <span>{formatDuration(r.durationSec)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )
  }

  if (session.submitted) {
    const r = session.submitted
    const q = questions[index]
    const rows = Object.entries(r.byChapter).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    return (
      <div className="page mock-page">
        <BackButton to="/specials" />
        <div className="session-summary">
          <div className="summary-hero">
            <div className="summary-score">
              {r.correct}<small>/{r.total}</small>
            </div>
            <div className="summary-verdict">
              {r.correct >= PASS_LINE ? `已过合格线 ${PASS_LINE}` : `距合格线还差 ${PASS_LINE - r.correct} 题`} · 用时 {formatDuration(r.durationSec)}
            </div>
          </div>
          <section className="home-section" aria-labelledby="mock-chapter-title">
            <h2 className="section-title" id="mock-chapter-title">分章得分（从弱到强）</h2>
            <ul className="mock-history">
              {rows.map(([key, v]) => (
                <li key={key}>
                  <span>{getChapterMeta(key).short}</span>
                  <span className={v.correct / v.total >= 0.6 ? 'mock-pass' : 'mock-fail'}>
                    {v.correct}/{v.total}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <div className="wrong-actions">
            <button className="action-btn" onClick={() => persist(null)}>
              结束
            </button>
            <button className="action-btn primary" onClick={start}>
              再考一套
            </button>
          </div>
        </div>
        {q && (
          <div className="quiz-container">
            <h2 className="section-title">逐题回看</h2>
            <div className="quiz-header">
              <span className="quiz-progress">第 {index + 1} 题 / 共 {questions.length} 题</span>
              <span className="quiz-chapter">{session.answers[q.id] === undefined ? '未作答' : q.chapter}</span>
            </div>
            <QuestionCard question={q} selected={session.answers[q.id] ?? null} onSelect={() => {}} showResult />
            <div className="quiz-nav-buttons">
              <button className="quiz-nav-btn" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
                ← 上一题
              </button>
              <button className="quiz-nav-btn primary" onClick={() => setIndex((i) => i + 1)} disabled={index === questions.length - 1}>
                下一题 →
              </button>
            </div>
            <AnswerSheet questions={questions} answers={session.answers} index={index} onJump={setIndex} graded />
          </div>
        )}
      </div>
    )
  }

  const q = questions[index]
  const answeredCount = Object.keys(session.answers).length
  const choose = (i: number) => {
    if (!q) return
    persist({ ...session, answers: { ...session.answers, [q.id]: i } })
  }

  return (
    <div className="page mock-page">
      <div className="mock-bar">
        <span className={`mock-timer ${remaining < 600 ? 'urgent' : ''}`} role="timer" aria-label="剩余时间">
          ⏱ {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
        </span>
        <button className="quiz-nav-btn" onClick={() => setShowSheet((v) => !v)}>
          答题卡 {answeredCount}/{questions.length}
        </button>
        <button
          className="quiz-nav-btn primary"
          onClick={() => {
            const left = questions.length - answeredCount
            if (window.confirm(left > 0 ? `还有 ${left} 题未作答，确定交卷？` : '确定交卷？')) submit(session)
          }}
        >
          交卷
        </button>
      </div>

      {showSheet && (
        <AnswerSheet
          questions={questions}
          answers={session.answers}
          index={index}
          onJump={(i) => {
            setIndex(i)
            setShowSheet(false)
          }}
        />
      )}

      {q && (
        <div className="quiz-container">
          <div className="quiz-header">
            <span className="quiz-progress">第 {index + 1} 题 / 共 {questions.length} 题</span>
          </div>
          <QuestionCard question={q} selected={session.answers[q.id] ?? null} onSelect={choose} showResult={false} />
          <div className="quiz-nav-buttons">
            <button className="quiz-nav-btn" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
              ← 上一题
            </button>
            <button className="quiz-nav-btn primary" onClick={() => setIndex((i) => i + 1)} disabled={index === questions.length - 1}>
              下一题 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AnswerSheet({
  questions,
  answers,
  index,
  onJump,
  graded = false,
}: {
  questions: Question[]
  answers: Record<string, number>
  index: number
  onJump: (i: number) => void
  graded?: boolean
}) {
  return (
    <div className="answer-sheet" aria-label="答题卡">
      {questions.map((q, i) => {
        const a = answers[q.id]
        const state = a === undefined ? '' : graded ? (a === q.answer ? 'right' : 'miss') : 'filled'
        return (
          <button
            key={q.id}
            type="button"
            className={`answer-sheet-cell ${state} ${i === index ? 'current' : ''}`}
            aria-label={`第 ${i + 1} 题${a === undefined ? '，未作答' : ''}`}
            onClick={() => onJump(i)}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
