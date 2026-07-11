import { useNavigate } from 'react-router-dom'
import { chapters } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import ProgressRing from '../components/ProgressRing'

export default function Home() {
  const navigate = useNavigate()
  const { chapterProgress, totalStats } = useProgress()

  return (
    <div className="page home-page">
      <div className="home-header">
        <div className="home-greeting">
          <h1>高项二轮练习</h1>
          <p>2027 信息系统项目管理师</p>
        </div>
      </div>

      <div className="home-stats">
        <div className="stat-item">
          <span className="stat-number">{totalStats.answeredCount}</span>
          <span className="stat-label">已答题</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalStats.wrongCount}</span>
          <span className="stat-label">错题数</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{chapters.length}</span>
          <span className="stat-label">总章节</span>
        </div>
      </div>

      <section className="home-section">
        <h2 className="section-title">章节学习</h2>
        <div className="chapter-list">
          {chapters.map((c) => {
            const prog = chapterProgress(c.questions)
            return (
              <button key={c.key} className="chapter-card" onClick={() => navigate(`/chapter/${c.key}`)}>
                <ProgressRing percent={prog.percent} />
                <div className="chapter-info">
                  <div className="chapter-title">{c.title}</div>
                  <div className="chapter-meta">
                    {c.questions.length} 题 · 已完成 {prog.done}
                  </div>
                </div>
                <svg className="chapter-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
