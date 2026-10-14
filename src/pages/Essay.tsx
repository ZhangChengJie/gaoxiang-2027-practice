import { useState, useRef, useEffect } from 'react'
import { essayContents } from '../data/essayContent'

export default function Essay() {
  const [activeChapter, setActiveChapter] = useState(essayContents[0]?.chapter ?? '')
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentEssay = essayContents.find((e) => e.chapter === activeChapter) ?? essayContents[0]

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-key="${activeChapter}"]`) as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeChapter])

  if (!currentEssay) {
    return (
      <div className="page essay-page">
        <div className="page-header">
          <h1>论文写作知识点</h1>
          <p>按真实命题主题（绩效域 + 十大管理领域）组织</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page essay-page">
      <div className="page-header">
        <h1>论文写作知识点</h1>
        <p>按真实命题主题：写作总论 · 8 大绩效域 · 十大管理领域</p>
      </div>

      <div className="essay-chips-wrapper" ref={scrollRef}>
        <div className="essay-chips-scroll">
          {essayContents.map((e) => (
            <button
              key={e.chapter}
              data-key={e.chapter}
              className={`chip ${activeChapter === e.chapter ? 'active' : ''}`}
              onClick={() => setActiveChapter(e.chapter)}
            >
              {e.label}
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
