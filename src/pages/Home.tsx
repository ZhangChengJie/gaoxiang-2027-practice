import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { chapters } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { getChapterMeta } from '../lib/chapterMeta'
import ProgressRing from '../components/ProgressRing'
import { ThemeToggle } from '../components/ThemeToggle'

const allChapterQuestions = chapters.flatMap((c) => c.questions)

export default function Home() {
  const navigate = useNavigate()
  const { chapterProgress, totalStats } = useProgress()
  const overall = chapterProgress(allChapterQuestions)

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

      <section className="home-section" aria-labelledby="chapter-grid-title">
        <h2 className="section-title" id="chapter-grid-title">章节学习</h2>
        <div className="chapter-grid">
          {chapters.map((c) => {
            const prog = chapterProgress(c.questions)
            const meta = getChapterMeta(c.key)
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
                <span className="chapter-grid-count">{prog.done}/{prog.total}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
