import { useMemo, useState } from 'react'
import { chapters, allQuestions } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { ERROR_CAUSE_LABELS, REVIEW_INTERVALS_DAYS, isDue } from '../lib/progress'
import type { ErrorCause, Question } from '../lib/types'
import Quiz from '../components/Quiz'
import StatsCard from '../components/StatsCard'

type Filter = 'all' | 'due' | 'none' | ErrorCause
const CAUSES = Object.keys(ERROR_CAUSE_LABELS) as ErrorCause[]

export default function WrongBook() {
  const { progress, update, clearAllWrong } = useProgress()
  const [filter, setFilter] = useState<Filter>('all')
  // 练习时冻结题单：答对推进复习阶段会改变错题本，不能让题目中途消失
  const [session, setSession] = useState<{ title: string; questions: Question[] } | null>(null)
  const [now] = useState(Date.now)

  const wrong = progress.wrong
  const matches = useMemo(() => {
    return (id: string) => {
      const r = wrong[id]
      if (!r) return false
      if (filter === 'all') return true
      if (filter === 'due') return isDue(r, now)
      if (filter === 'none') return !r.cause
      return r.cause === filter
    }
  }, [wrong, filter, now])

  const filtered = useMemo(() => allQuestions.filter((q) => matches(q.id)), [matches])
  const byChapter = useMemo(
    () =>
      chapters
        .map((ch) => ({ key: ch.key, title: ch.title, questions: ch.questions.filter((q) => matches(q.id)) }))
        .filter((c) => c.questions.length > 0),
    [matches],
  )

  const records = Object.values(wrong)
  const totalWrong = records.length
  const dueCount = records.filter((r) => isDue(r, now)).length

  if (session) {
    return (
      <div className="page wrong-page">
        <div className="wrong-header">
          <button className="back-btn" onClick={() => setSession(null)}>
            ← 返回列表
          </button>
          <h1>{session.title}</h1>
          <div />
        </div>
        <Quiz questions={session.questions} onAnswer={update} />
      </div>
    )
  }

  if (totalWrong === 0) {
    return (
      <div className="page wrong-page">
        <div className="page-header">
          <h1>错题本</h1>
          <p>暂无错题，继续加油！</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <p>答错的题目会自动出现在这里</p>
        </div>
      </div>
    )
  }

  const count = (f: Filter) =>
    f === 'all' ? totalWrong : f === 'due' ? dueCount : records.filter((r) => (f === 'none' ? !r.cause : r.cause === f)).length
  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'due', label: '今日到期' },
    ...CAUSES.map((c) => ({ key: c as Filter, label: ERROR_CAUSE_LABELS[c] })),
    { key: 'none', label: '未标错因' },
  ]

  return (
    <div className="page wrong-page">
      <div className="page-header">
        <h1>错题本</h1>
        <p>
          答对后隔 {REVIEW_INTERVALS_DAYS.join(' / ')} 天再复习，到期连续答对 {REVIEW_INTERVALS_DAYS.length + 1} 次才移出
        </p>
      </div>

      <div className="wrong-stats">
        <StatsCard label="总错题" value={totalWrong} />
        <StatsCard label="今日到期" value={dueCount} />
        <StatsCard label="高频错题（≥3次）" value={records.filter((r) => r.wrongCount >= 3).length} />
      </div>

      <div className="wrong-filters" role="group" aria-label="筛选错题">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`chip ${filter === f.key ? 'active' : ''}`}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label} {count(f.key)}
          </button>
        ))}
      </div>

      <div className="wrong-actions">
        <button
          className="action-btn primary"
          disabled={filtered.length === 0}
          onClick={() => setSession({ title: '错题练习', questions: filtered })}
        >
          练习当前筛选（{filtered.length}）
        </button>
        <button
          className="action-btn danger"
          onClick={() => {
            if (window.confirm(`确定清空全部 ${totalWrong} 道错题？此操作不能撤销。`)) clearAllWrong()
          }}
        >
          清空错题本
        </button>
      </div>

      <div className="chapter-list">
        {byChapter.length === 0 && <div className="empty-state">当前筛选下没有错题</div>}
        {byChapter.map((c) => {
          const due = c.questions.filter((q) => isDue(wrong[q.id], now)).length
          return (
            <button
              key={c.key}
              className="chapter-card"
              onClick={() => setSession({ title: c.title, questions: c.questions })}
            >
              <div className="chapter-info">
                <div className="chapter-title">{c.title}</div>
                <div className="chapter-meta">
                  {c.questions.length} 道错题{due > 0 && ` · ${due} 道到期`}
                  {c.questions.some((q) => wrong[q.id].wrongCount >= 3) && <span className="high-freq-badge">高频</span>}
                </div>
              </div>
              <div className="wrong-count-badge">{c.questions.length}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
