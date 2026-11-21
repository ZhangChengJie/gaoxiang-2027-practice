import { useEffect, useMemo, useState, useCallback } from 'react'
import { allQuestions } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { buildMockExam, scoreMock, MOCK_DURATION_SEC, MOCK_TOTAL } from '../lib/mock'
import { getChapterMeta } from '../lib/chapterMeta'
import { DOMAINS, domainTitle } from '../data/domains'
import type { MockResult, Question } from '../lib/types'
import BackButton from '../components/BackButton'
import QuestionCard from '../components/QuestionCard'
import { formatDuration } from '../lib/format'

// 新成绩按知识域汇总；旧成绩按章节汇总，两种键都能显示
const groupLabel = (key: string) => (DOMAINS.some((d) => d.key === key) ? domainTitle(key) : getChapterMeta(key).short)

const SESSION_KEY = 'gaoxiang-2027-mock-session'
const PASS_LINE = 45

type MockSession = {
  ids: string[]
  answers: Record<string, number>
  flagged?: Record<string, boolean>
  startedAt: number
  submitted?: MockResult
}

type ReviewFilter = 'all' | 'wrong' | 'flagged'

function loadSession(): MockSession | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null')
    if (raw && Array.isArray(raw.ids) && typeof raw.startedAt === 'number') {
      return { answers: {}, flagged: {}, ...raw }
    }
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
  const { progress, updateBatch } = useProgress()
  const [session, setSession] = useState<MockSession | null>(loadSession)
  const [index, setIndex] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [showSheet, setShowSheet] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all')

  const questions = useMemo(
    () => (session ? session.ids.map((id) => byId.get(id)).filter((q): q is Question => q !== undefined) : []),
    [session],
  )

  const persist = useCallback((s: MockSession | null) => {
    setSession(s)
    saveSession(s)
  }, [])

  const start = () => {
    const qs = buildMockExam(allQuestions)
    setIndex(0)
    setReviewFilter('all')
    persist({ ids: qs.map((q) => q.id), answers: {}, flagged: {}, startedAt: Date.now() })
  }

  const submit = useCallback((s: MockSession) => {
    const durationSec = Math.min(MOCK_DURATION_SEC, Math.round((Date.now() - s.startedAt) / 1000))
    const result = scoreMock(questions, s.answers, durationSec, Date.now())
    const entries = questions.flatMap((q) => {
      const a = s.answers[q.id]
      return a === undefined ? [] : [{ q, right: a === q.answer }]
    })
    updateBatch(entries, result)
    setIndex(0)
    setReviewFilter('all')
    persist({ ...s, submitted: result })
  }, [questions, updateBatch, persist])

  const inExam = session !== null && !session.submitted
  const remaining = session ? Math.max(0, MOCK_DURATION_SEC - Math.floor((now - session.startedAt) / 1000)) : MOCK_DURATION_SEC

  useEffect(() => {
    if (!inExam) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [inExam])

  useEffect(() => {
    if (inExam && remaining === 0 && session) submit(session)
  }, [inExam, remaining, session, submit])

  const choose = useCallback((i: number) => {
    if (!session || session.submitted) return
    const cur = questions[index]
    if (!cur) return
    persist({ ...session, answers: { ...session.answers, [cur.id]: i } })
  }, [session, questions, index, persist])

  const toggleFlag = useCallback(() => {
    if (!session || session.submitted) return
    const cur = questions[index]
    if (!cur) return
    const prevFlags = session.flagged ?? {}
    const nextFlags = { ...prevFlags }
    if (nextFlags[cur.id]) delete nextFlags[cur.id]
    else nextFlags[cur.id] = true
    persist({ ...session, flagged: nextFlags })
  }, [session, questions, index, persist])

  // 模考键盘快捷键：A-D / 1-4 选答案，← / → 切题，F 标疑
  useEffect(() => {
    if (!inExam) return
    const cur = questions[index]
    if (!cur) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const key = e.key.toLowerCase()
      const optIdx = ['a', 'b', 'c', 'd'].indexOf(key) !== -1
        ? ['a', 'b', 'c', 'd'].indexOf(key)
        : ['1', '2', '3', '4'].indexOf(key)
      if (optIdx !== -1 && optIdx < cur.options.length) {
        e.preventDefault()
        choose(optIdx)
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault()
        setIndex(index - 1)
      } else if (e.key === 'ArrowRight' && index < questions.length - 1) {
        e.preventDefault()
        setIndex(index + 1)
      } else if (key === 'f') {
        e.preventDefault()
        toggleFlag()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inExam, questions, index, choose, toggleFlag])

  if (!session) {
    const history = [...progress.mockHistory].reverse().slice(0, 10)
    return (
      <div className="page mock-page">
        <BackButton to="/specials" />
        <div className="test-hero">
          <span className="test-icon">📝</span>
          <h1>机考模拟</h1>
          <p>
            按 2021—2026 真题知识域分布抽 {MOCK_TOTAL} 题，限时 150 分钟，交卷后统一出分；英文题放在最后，支持标疑回收。
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

  const flaggedMap = session.flagged ?? {}

  if (session.submitted) {
    const r = session.submitted
    const rows = Object.entries(r.byChapter).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    const wrongCount = questions.filter((item) => session.answers[item.id] !== item.answer).length
    const flaggedCount = questions.filter((item) => flaggedMap[item.id]).length
    const reviewList = questions.filter((item) => {
      if (reviewFilter === 'wrong') return session.answers[item.id] !== item.answer
      if (reviewFilter === 'flagged') return Boolean(flaggedMap[item.id])
      return true
    })
    const safeReviewIdx = Math.min(index, Math.max(0, reviewList.length - 1))
    const q = reviewList[safeReviewIdx]

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
            <h2 className="section-title" id="mock-chapter-title">分知识域得分（从弱到强）</h2>
            <ul className="mock-history">
              {rows.map(([key, v]) => (
                <li key={key}>
                  <span>{groupLabel(key)}</span>
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
        <div className="quiz-container">
          <h2 className="section-title">逐题回看</h2>
          <div className="mode-switch" role="group" aria-label="筛选回看题目">
            <button
              type="button"
              className={`chip ${reviewFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setReviewFilter('all'); setIndex(0) }}
            >
              全部 {questions.length}
            </button>
            <button
              type="button"
              className={`chip ${reviewFilter === 'wrong' ? 'active' : ''}`}
              onClick={() => { setReviewFilter('wrong'); setIndex(0) }}
            >
              错题/未答 {wrongCount}
            </button>
            {flaggedCount > 0 && (
              <button
                type="button"
                className={`chip ${reviewFilter === 'flagged' ? 'active' : ''}`}
                onClick={() => { setReviewFilter('flagged'); setIndex(0) }}
              >
                标疑 {flaggedCount}
              </button>
            )}
          </div>
          {q ? (
            <>
              <div className="quiz-header">
                <span className="quiz-progress">第 {safeReviewIdx + 1} 题 / 共 {reviewList.length} 题</span>
                <span className="quiz-chapter">
                  {session.answers[q.id] === undefined ? '未作答 · ' : ''}
                  {q.topic || domainTitle(q.domain)}
                </span>
              </div>
              <QuestionCard question={q} selected={session.answers[q.id] ?? null} onSelect={() => {}} showResult />
              <div className="quiz-nav-buttons">
                <button className="quiz-nav-btn" onClick={() => setIndex(Math.max(0, safeReviewIdx - 1))} disabled={safeReviewIdx === 0}>
                  ← 上一题
                </button>
                <button className="quiz-nav-btn primary" onClick={() => setIndex(Math.min(reviewList.length - 1, safeReviewIdx + 1))} disabled={safeReviewIdx === reviewList.length - 1}>
                  下一题 →
                </button>
              </div>
              <AnswerSheet
                questions={reviewList}
                answers={session.answers}
                flagged={flaggedMap}
                index={safeReviewIdx}
                onJump={setIndex}
                graded
              />
            </>
          ) : (
            <div className="empty-state">当前筛选下没有题目 🎉</div>
          )}
        </div>
      </div>
    )
  }

  const q = questions[index]
  const answeredCount = Object.keys(session.answers).length
  const flaggedCount = Object.keys(flaggedMap).length
  const isFlagged = q ? Boolean(flaggedMap[q.id]) : false

  return (
    <div className="page mock-page">
      <div className="mock-bar">
        <span className={`mock-timer ${remaining < 600 ? 'urgent' : ''}`} role="timer" aria-label="剩余时间">
          ⏱ {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
        </span>
        <button className="quiz-nav-btn" onClick={() => setShowSheet((v) => !v)}>
          答题卡 {answeredCount}/{questions.length}{flaggedCount > 0 ? ` · 🚩${flaggedCount}` : ''}
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
          flagged={flaggedMap}
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
            <button
              type="button"
              className={`chip flag-btn ${isFlagged ? 'flagged' : ''}`}
              aria-pressed={isFlagged}
              onClick={toggleFlag}
            >
              {isFlagged ? '🚩 已标疑' : '🏳️ 标疑'}
            </button>
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
  flagged,
  index,
  onJump,
  graded = false,
}: {
  questions: Question[]
  answers: Record<string, number>
  flagged?: Record<string, boolean>
  index: number
  onJump: (i: number) => void
  graded?: boolean
}) {
  return (
    <div className="answer-sheet" aria-label="答题卡">
      {questions.map((q, i) => {
        const a = answers[q.id]
        const state = a === undefined ? '' : graded ? (a === q.answer ? 'right' : 'miss') : 'filled'
        const isFlagged = Boolean(flagged?.[q.id])
        return (
          <button
            key={q.id}
            type="button"
            className={`answer-sheet-cell ${state} ${isFlagged ? 'flagged' : ''} ${i === index ? 'current' : ''}`}
            aria-label={`第 ${i + 1} 题${a === undefined ? '，未作答' : ''}${isFlagged ? '，已标疑' : ''}`}
            onClick={() => onJump(i)}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
