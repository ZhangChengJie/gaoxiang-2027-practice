import { useNavigate } from 'react-router-dom'
import { specialTests } from '../data/specialTests'

export default function SpecialTests() {
  const navigate = useNavigate()

  return (
    <div className="page specials-page">
      <div className="page-header">
        <h1>专项训练</h1>
        <p>针对薄弱环节集中突破</p>
      </div>

      <div className="specials-grid">
        {specialTests.map((test) => (
          <button key={test.key} className="special-card" onClick={() => navigate(test.key === 'mock' ? '/mock' : `/test/${test.key}`)}>
            <span className="special-icon">{test.icon}</span>
            <div className="special-info">
              <div className="special-title">{test.title}</div>
              <div className="special-desc">{test.description}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
