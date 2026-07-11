import { useState, useRef, useEffect } from 'react'
import { chapters } from '../data/content'
import { essayContents } from '../data/essayContent'

export default function Essay() {
  const [activeChapter, setActiveChapter] = useState(chapters[0]?.key ?? '')
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentEssay = essayContents.find((e) => e.chapter === activeChapter)
  const currentChapter = chapters.find((c) => c.key === activeChapter)

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-key="${activeChapter}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeChapter])

  if (!currentEssay || !currentChapter) {
    return (
      <div className="page essay-page">
        <div className="page-header">
          <h1>论文范围</h1>
          <p>选择章节查看对应论文写作知识点</p>
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
        <h1>论文写作知识点</h1>
        <p>每个章节涵盖完整的论文写作要点</p>
      </div>

      <div className="essay-chips-wrapper" ref={scrollRef}>
        <div className="essay-chips-scroll">
          {chapters.map((c) => (
            <button
              key={c.key}
              data-key={c.key}
              className={`chip ${activeChapter === c.key ? 'active' : ''}`}
              onClick={() => setActiveChapter(c.key)}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div className="essay-section-card essay-section-scope">
        <div className="essay-section-header">
          <span className="essay-section-icon">📋</span>
          <div>
            <h3 className="essay-section-title">论文主题</h3>
            <p className="essay-section-subtitle">{currentEssay.title}</p>
          </div>
        </div>
        <div className="essay-section-body">
          <p className="essay-scope-text">{currentEssay.scope}</p>
        </div>
      </div>

      <div className="essay-section-card essay-section-points">
        <div className="essay-section-header">
          <span className="essay-section-icon">🎯</span>
          <div>
            <h3 className="essay-section-title">关键知识点</h3>
            <p className="essay-section-subtitle">{currentEssay.points.length} 个论文写作要点</p>
          </div>
        </div>
        <div className="essay-section-body">
          <ul className="essay-points-list">
            {currentEssay.points.map((p, i) => (
              <li key={i}>
                <span className="essay-point-num">{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="essay-section-card essay-section-practice">
        <div className="essay-section-header">
          <span className="essay-section-icon">✍️</span>
          <div>
            <h3 className="essay-section-title">练笔动作</h3>
            <p className="essay-section-subtitle">动手写才能真正掌握</p>
          </div>
        </div>
        <div className="essay-section-body">
          <p className="essay-practice-text">{currentEssay.practice}</p>
        </div>
      </div>

      <div className="essay-section-card essay-section-keywords">
        <div className="essay-section-header">
          <span className="essay-section-icon">🔑</span>
          <div>
            <h3 className="essay-section-title">核心关键词</h3>
            <p className="essay-section-subtitle">写作中可以嵌入的重要术语</p>
          </div>
        </div>
        <div className="essay-section-body">
          <div className="essay-keywords-cloud">
            {currentEssay.keywords.map((kw) => (
              <span key={kw} className="keyword-tag">{kw}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
