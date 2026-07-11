import { useState } from 'react'
import { chapters } from '../data/content'
import { essayContents } from '../data/essayContent'

export default function Essay() {
  const [activeChapter, setActiveChapter] = useState(chapters[0]?.key ?? '')

  const currentEssay = essayContents.find((e) => e.chapter === activeChapter)
  const currentChapter = chapters.find((c) => c.key === activeChapter)

  if (!currentEssay || !currentChapter) {
    return (
      <div className="page essay-page">
        <div className="page-header">
          <h1>论文范围</h1>
          <p>请选择章节查看对应论文范围</p>
        </div>
        <div className="essay-chapter-list">
          {chapters.map((c) => (
            <button key={c.key} className="chapter-card" onClick={() => setActiveChapter(c.key)}>
              <div className="chapter-title">{c.title}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page essay-page">
      <div className="page-header">
        <h1>论文范围</h1>
        <p>选择章节查看对应论文主题与采分点</p>
      </div>

      <div className="essay-chapter-select">
        {chapters.map((c) => (
          <button
            key={c.key}
            className={`chip ${activeChapter === c.key ? 'active' : ''}`}
            onClick={() => setActiveChapter(c.key)}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="essay-card">
        <h2 className="essay-title">{currentEssay.title}</h2>

        <section className="essay-section">
          <h3>📌 论文范围</h3>
          <p>{currentEssay.scope}</p>
        </section>

        <section className="essay-section">
          <h3>🎯 采分点</h3>
          <ul className="essay-points">
            {currentEssay.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="essay-section">
          <h3>✍️ 练笔动作</h3>
          <p>{currentEssay.practice}</p>
        </section>

        <section className="essay-section">
          <h3>🔑 关键词</h3>
          <div className="essay-keywords">
            {currentEssay.keywords.map((kw) => (
              <span key={kw} className="keyword-tag">{kw}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
