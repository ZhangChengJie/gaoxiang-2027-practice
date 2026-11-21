import { useMemo, useState } from 'react'
import BackButton from '../components/BackButton'
import DiagramCards from '../components/DiagramCards'
import {
  CORE_FORMULAS,
  ITTO_49,
  KNOWLEDGE_AREAS,
  MUST_KNOW_NUMBERS,
  PROCESS_GROUPS,
  type ProcessGroup,
} from '../data/cheatSheet'

type Tab = 'itto' | 'formula' | 'numbers' | 'diagrams'

export default function CheatSheet() {
  const [tab, setTab] = useState<Tab>('itto')
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<ProcessGroup | 'all'>('all')
  const [area, setArea] = useState<string>('all')

  const q = query.trim().toLowerCase()

  const filteredItto = useMemo(
    () =>
      ITTO_49.filter((p) => {
        if (group !== 'all' && p.group !== group) return false
        if (area !== 'all' && p.area !== area) return false
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q)
          || p.area.toLowerCase().includes(q)
          || p.inputs.toLowerCase().includes(q)
          || p.tools.toLowerCase().includes(q)
          || p.outputs.toLowerCase().includes(q)
          || (p.tip?.toLowerCase().includes(q) ?? false)
        )
      }),
    [group, area, q],
  )

  const formulaCategories = ['挣值 EVM', '进度与 PERT', '合同激励', '财务与运筹'] as const
  const filteredFormulas = useMemo(
    () =>
      CORE_FORMULAS.filter(
        (f) =>
          !q
          || f.name.toLowerCase().includes(q)
          || f.formula.toLowerCase().includes(q)
          || f.note.toLowerCase().includes(q),
      ),
    [q],
  )

  const filteredNumbers = useMemo(
    () =>
      MUST_KNOW_NUMBERS.filter(
        (n) =>
          !q
          || n.topic.toLowerCase().includes(q)
          || n.rule.toLowerCase().includes(q)
          || n.trap.toLowerCase().includes(q),
      ),
    [q],
  )

  return (
    <div className="page cheatsheet-page">
      <BackButton to="/" />
      <div className="chapter-hero">
        <h1>速查口袋书</h1>
        <p>49 过程 ITTO · 25 核心公式 · 必背数字与陷阱 · 6 张标准图卡</p>
      </div>

      <div className="chapter-tabs" role="tablist" aria-label="速查分类">
        <button type="button" role="tab" aria-selected={tab === 'itto'} className={`chip ${tab === 'itto' ? 'active' : ''}`} onClick={() => setTab('itto')}>
          ITTO 49过程
        </button>
        <button type="button" role="tab" aria-selected={tab === 'formula'} className={`chip ${tab === 'formula' ? 'active' : ''}`} onClick={() => setTab('formula')}>
          核心公式（25）
        </button>
        <button type="button" role="tab" aria-selected={tab === 'numbers'} className={`chip ${tab === 'numbers' ? 'active' : ''}`} onClick={() => setTab('numbers')}>
          数字与陷阱
        </button>
        <button type="button" role="tab" aria-selected={tab === 'diagrams'} className={`chip ${tab === 'diagrams' ? 'active' : ''}`} onClick={() => setTab('diagrams')}>
          标准图卡（6）
        </button>
      </div>

      {tab !== 'diagrams' && (
        <div className="directory-search-bar">
          <input
            type="search"
            className="directory-search-input"
            placeholder={tab === 'itto' ? '搜索过程名、输入、工具或输出…' : '搜索关键词…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索速查内容"
          />
          {query && (
            <button type="button" className="chip" onClick={() => setQuery('')}>
              清空
            </button>
          )}
        </div>
      )}

      {tab === 'itto' && (
        <>
          <div className="chapter-tabs" aria-label="按过程组筛选">
            <button type="button" className={`chip quiz-tool-chip ${group === 'all' ? 'active' : ''}`} onClick={() => setGroup('all')}>
              全过程组
            </button>
            {PROCESS_GROUPS.map((g) => (
              <button key={g} type="button" className={`chip quiz-tool-chip ${group === g ? 'active' : ''}`} onClick={() => setGroup(g)}>
                {g}
              </button>
            ))}
          </div>
          <div className="cheatsheet-area-select">
            <select
              aria-label="按知识域筛选"
              className="directory-search-input"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="all">全部十大知识域（共 {ITTO_49.length} 过程）</option>
              {KNOWLEDGE_AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <p className="cheatsheet-count">匹配 {filteredItto.length} / {ITTO_49.length} 个过程</p>

          <div className="itto-list">
            {filteredItto.map((p) => (
              <article key={p.id} className="itto-card">
                <div className="itto-head">
                  <strong>{p.name}</strong>
                  <span className="itto-badges">
                    <span className="keyword-tag itto-tag">{p.group}</span>
                    <span className="itto-area">{p.area.replace(/^项目/, '')}</span>
                  </span>
                </div>
                <div className="itto-row"><span className="itto-label">输入</span><span>{p.inputs}</span></div>
                <div className="itto-row"><span className="itto-label">工具</span><span>{p.tools}</span></div>
                <div className="itto-row"><span className="itto-label">输出</span><span>{p.outputs}</span></div>
                {p.tip && <div className="itto-tip">💡 {p.tip}</div>}
              </article>
            ))}
            {filteredItto.length === 0 && <div className="empty-state">没有匹配的 ITTO 过程</div>}
          </div>
        </>
      )}

      {tab === 'formula' && (
        <div className="formula-groups">
          {formulaCategories.map((cat) => {
            const list = filteredFormulas.filter((f) => f.category === cat)
            if (list.length === 0) return null
            return (
              <section key={cat} className="home-section">
                <h2 className="section-title">{cat}</h2>
                <div className="formula-list">
                  {list.map((f) => (
                    <article key={f.name} className="formula-card">
                      <div className="formula-name">{f.name}</div>
                      <div className="formula-expr">{f.formula}</div>
                      <div className="formula-note">{f.note}</div>
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
          {filteredFormulas.length === 0 && <div className="empty-state">没有匹配的公式</div>}
        </div>
      )}

      {tab === 'numbers' && (
        <div className="itto-list">
          {filteredNumbers.map((item) => (
            <article key={item.topic} className="itto-card">
              <div className="itto-head">
                <strong>{item.topic}</strong>
              </div>
              <div className="itto-row"><span className="itto-label">标准</span><span>{item.rule}</span></div>
              <div className="itto-row"><span className="itto-label trap">陷阱</span><span>{item.trap}</span></div>
            </article>
          ))}
          {filteredNumbers.length === 0 && <div className="empty-state">没有匹配的条目</div>}
        </div>
      )}

      {tab === 'diagrams' && <DiagramCards />}
    </div>
  )
}
