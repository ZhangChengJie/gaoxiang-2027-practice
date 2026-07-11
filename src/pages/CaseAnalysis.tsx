import { useState } from 'react'
import { caseCategories, caseContents } from '../data/caseAnalysis'

export default function CaseAnalysis() {
  const [activeCategory, setActiveCategory] = useState(caseCategories[0]?.id ?? '')

  const filtered = caseContents.filter((c) => c.categoryId === activeCategory)

  return (
    <div className="page case-page">
      <div className="page-header">
        <h1>案例分析</h1>
        <p>题型分类 · 答题技巧 · 高频考点 · 答题模板</p>
      </div>

      <div className="case-category-tabs">
        {caseCategories.map((cat) => (
          <button
            key={cat.id}
            className={`case-category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="case-category-icon">{cat.icon}</span>
            <span className="case-category-label">{cat.title}</span>
          </button>
        ))}
      </div>

      <div className="case-content">
        {filtered.length === 0 ? (
          <div className="case-empty">
            <p>暂无内容</p>
          </div>
        ) : (
          filtered.map((content) => (
            <div key={content.id} className="case-card">
              <div className="case-card-header">
                <h3 className="case-card-title">{content.title}</h3>
                <p className="case-card-desc">{content.description}</p>
              </div>

              <div className="case-card-body">
                {content.sections.map((section, si) => (
                  <div key={si} className="case-section">
                    <h4 className="case-section-title">
                      <span className="case-section-dot" />
                      {section.title}
                    </h4>
                    <ul className="case-list">
                      {section.content.map((item, ii) => {
                        if (item === '') {
                          return <li key={ii} className="case-list-spacer" />
                        }
                        return (
                          <li key={ii} className="case-list-item">
                            {item}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
