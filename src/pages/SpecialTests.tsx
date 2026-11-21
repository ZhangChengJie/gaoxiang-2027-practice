import { useNavigate } from 'react-router-dom'
import { specialTests } from '../data/specialTests'

const CORE_KEYS = new Set([
  'mock', 'errors', 'calculation', 'itto', 'performance',
  'law', 'operations-research', 'exam-2026', 'exam-trend',
])

export default function SpecialTests() {
  const navigate = useNavigate()
  const checkpoints = specialTests.filter((t) => t.key.startsWith('checkpoint-'))
  const coreTests = specialTests.filter((t) => CORE_KEYS.has(t.key))
  const extraTests = specialTests.filter((t) => !t.key.startsWith('checkpoint-') && !CORE_KEYS.has(t.key))

  const go = (key: string) => navigate(key === 'mock' ? '/mock' : `/test/${key}`)

  return (
    <div className="page specials-page">
      <div className="page-header">
        <h1>专项训练</h1>
        <p>2705 考期验收节点 + 核心高频专项突破</p>
      </div>

      <section className="home-section" aria-labelledby="specials-checkpoint-title">
        <h2 className="section-title" id="specials-checkpoint-title">
          2705 考期验收节点 <small className="section-hint">默认抽 50 题验收 · 目标 ≥85%</small>
        </h2>
        <div className="specials-grid">
          {checkpoints.map((test) => (
            <button key={test.key} className="special-card special-card-checkpoint" onClick={() => go(test.key)}>
              <span className="special-icon">{test.icon}</span>
              <div className="special-info">
                <div className="special-title">{test.title}</div>
                <div className="special-desc">{test.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="specials-core-title">
        <h2 className="section-title" id="specials-core-title">核心高频专项</h2>
        <div className="specials-grid">
          <button className="special-card" onClick={() => navigate('/domain')}>
            <span className="special-icon">🗂️</span>
            <div className="special-info">
              <div className="special-title">按知识域练习</div>
              <div className="special-desc">24 个真题知识域 · 显示各域正确率</div>
            </div>
          </button>
          <button className="special-card" onClick={() => navigate('/cheatsheet')}>
            <span className="special-icon">📖</span>
            <div className="special-info">
              <div className="special-title">速查口袋书</div>
              <div className="special-desc">49 过程 ITTO · 25 公式 · 6 张标准图卡</div>
            </div>
          </button>
          {coreTests.map((test) => (
            <button key={test.key} className="special-card" onClick={() => go(test.key)}>
              <span className="special-icon">{test.icon}</span>
              <div className="special-info">
                <div className="special-title">{test.title}</div>
                <div className="special-desc">{test.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="specials-extra-title">
        <h2 className="section-title" id="specials-extra-title">章节与冲刺专项</h2>
        <div className="specials-grid">
          {extraTests.map((test) => (
            <button key={test.key} className="special-card" onClick={() => go(test.key)}>
              <span className="special-icon">{test.icon}</span>
              <div className="special-info">
                <div className="special-title">{test.title}</div>
                <div className="special-desc">{test.description}</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
