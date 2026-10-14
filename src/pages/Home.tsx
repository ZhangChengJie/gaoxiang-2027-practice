import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { chapters } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { getChapterMeta } from '../lib/chapterMeta'
import { accuracyOf, todayStat, weakestDomains } from '../lib/progress'
import { allQuestions } from '../data/content'
import ProgressRing from '../components/ProgressRing'
import { ThemeToggle } from '../components/ThemeToggle'
import DataBackup from '../components/DataBackup'

function accuracyClass(acc: number | null) {
  if (acc === null) return ''
  return acc >= 0.7 ? 'acc-good' : acc >= 0.6 ? 'acc-ok' : 'acc-low'
}

const allChapterQuestions = chapters.flatMap((c) => c.questions)

export default function Home() {
  const navigate = useNavigate()
  const { progress, chapterProgress, totalStats } = useProgress()
  const overall = chapterProgress(allChapterQuestions)
  const today = todayStat(progress, Date.now())
  const weak = weakestDomains(progress, allQuestions)
  const todayAcc = today.answered > 0 ? Math.round((today.correct / today.answered) * 100) : null

  return (
    <div className="page home-page">
      <header className="home-header">
        <div className="home-greeting">
          <h1>高项二轮练习</h1>
          <p>2027 信息系统项目管理师</p>
        </div>
        <ThemeToggle />
      </header>

      <section className="home-overview" aria-label="学习概览">
        <div className="home-overview-progress" role="img" aria-label={`章节总进度 ${overall.percent}%，已答 ${overall.done} / ${overall.total} 题`}>
          <ProgressRing percent={overall.percent} size={48} />
          <span className="stat-label">总进度</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalStats.answeredCount}</span>
          <span className="stat-label">已答</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalStats.wrongCount}</span>
          <span className="stat-label">错题</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{chapters.length}</span>
          <span className="stat-label">章节数</span>
        </div>
      </section>

      <section className="today-card" aria-labelledby="today-title">
        <div className="today-info">
          <h2 id="today-title">今日任务</h2>
          <p>
            到期错题 {totalStats.dueCount} 题 → 新题 · 今日已答 {today.answered} 题
            {todayAcc !== null && `，正确率 ${todayAcc}%`}
          </p>
        </div>
        <button type="button" className="action-btn primary" onClick={() => navigate('/today')}>
          开始
        </button>
      </section>

      <button type="button" className="mock-entry" onClick={() => navigate('/mock')}>
        <span aria-hidden="true">📝</span>
        <span className="mock-entry-text">
          <strong>机考模拟</strong>
          <span>75 题 · 150 分钟 · 按真题分布抽题</span>
        </span>
        <span aria-hidden="true">›</span>
      </button>

      {weak.length > 0 && (
        <section className="weak-card" aria-labelledby="weak-title">
          <h2 id="weak-title">薄弱知识域</h2>
          <div className="weak-list">
            {weak.map((w) => (
              <button key={w.domain} type="button" className="chip" onClick={() => navigate(`/domain/${w.domain}`)}>
                {w.title} {Math.round((w.accuracy ?? 0) * 100)}%
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="chapter-grid-title">
        <h2 className="section-title" id="chapter-grid-title">章节学习 <small className="section-hint">正确率 {'<'}60% 红 · 60–70% 橙 · ≥70% 绿</small></h2>
        <div className="chapter-grid">
          {chapters.map((c) => {
            const prog = chapterProgress(c.questions)
            const meta = getChapterMeta(c.key)
            const acc = accuracyOf(progress, c.questions.map((q) => q.id)).accuracy
            return (
              <button
                key={c.key}
                type="button"
                className="chapter-grid-item"
                style={{ '--chapter-accent': meta.accent } as CSSProperties}
                aria-label={c.title}
                onClick={() => navigate(`/chapter/${c.key}`)}
              >
                <span className="chapter-grid-icon" aria-hidden="true">{meta.emoji}</span>
                <span className="chapter-grid-label">{meta.short}</span>
                <span className="chapter-grid-progress" aria-hidden="true">
                  <span style={{ width: `${prog.percent}%` }} />
                </span>
                <span className="chapter-grid-count">
                  {prog.done}/{prog.total}
                  {acc !== null && <span className={`chapter-grid-acc ${accuracyClass(acc)}`}> · {Math.round(acc * 100)}%</span>}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <DataBackup />

      <p className="app-version">版本 {__APP_VERSION__}</p>
    </div>
  )
}
