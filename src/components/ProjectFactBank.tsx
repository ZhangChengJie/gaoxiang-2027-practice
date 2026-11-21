import { useState } from 'react'
import { DEFAULT_PROJECT_PROFILES, type ProjectProfile } from '../data/essayModels'

const STORAGE_KEY = 'gaoxiang-2027-project-facts-v1'

function loadProfiles(): ProjectProfile[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (Array.isArray(raw) && raw.length > 0) return raw as ProjectProfile[]
  } catch {
    // 忽略异常回退内置模板
  }
  return DEFAULT_PROJECT_PROFILES
}

function saveProfiles(list: ProjectProfile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 忽略
  }
}

const FIELDS: { key: keyof Omit<ProjectProfile, 'id'>; label: string; rows?: number }[] = [
  { key: 'name', label: '项目名称' },
  { key: 'role', label: '本人角色与职责' },
  { key: 'period', label: '建设周期' },
  { key: 'budget', label: '投资预算构成' },
  { key: 'teamSize', label: '团队规模与分工' },
  { key: 'scale', label: '覆盖范围与业务规模', rows: 2 },
  { key: 'painPoints', label: '立项痛点与业务目标', rows: 2 },
  { key: 'architecture', label: '核心技术架构与产物', rows: 2 },
  { key: 'keyMetrics', label: '锁定量化指标（前后对比）', rows: 3 },
  { key: 'lessons', label: '真实踩坑与改进措施', rows: 2 },
]

export default function ProjectFactBank() {
  const [profiles, setProfiles] = useState<ProjectProfile[]>(loadProfiles)
  const [activeId, setActiveId] = useState<string>(() => loadProfiles()[0]?.id ?? DEFAULT_PROJECT_PROFILES[0].id)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const current = profiles.find((p) => p.id === activeId) ?? profiles[0]

  const updateField = (key: keyof Omit<ProjectProfile, 'id'>, value: string) => {
    const next = profiles.map((p) => (p.id === current.id ? { ...p, [key]: value } : p))
    setProfiles(next)
    saveProfiles(next)
  }

  const addCustom = () => {
    const id = `proj-custom-${Date.now()}`
    const created: ProjectProfile = {
      id,
      name: '我的自定义真实项目（点击编辑）',
      role: '项目经理',
      period: '2025 年 X 月 — 2026 年 X 月（共 12 个月）',
      budget: 'XXX 万元',
      teamSize: 'XX 人',
      scale: '',
      painPoints: '',
      architecture: '',
      keyMetrics: '',
      lessons: '',
    }
    const next = [...profiles, created]
    setProfiles(next)
    saveProfiles(next)
    setActiveId(id)
    setEditing(true)
  }

  const resetDefaults = () => {
    if (!window.confirm('恢复内置的 2 套参考模板（AI 大模型平台 & 政务综合平台）？自定义修改将被覆盖。')) return
    setProfiles(DEFAULT_PROJECT_PROFILES)
    saveProfiles(DEFAULT_PROJECT_PROFILES)
    setActiveId(DEFAULT_PROJECT_PROFILES[0].id)
    setEditing(false)
  }

  const copySummary = async () => {
    const text = FIELDS.map((f) => `【${f.label}】${current[f.key]}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // 剪贴板不可用忽略
    }
  }

  return (
    <div className="fact-bank">
      <div className="chapter-tabs" role="tablist" aria-label="选择项目档案">
        {profiles.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === current.id}
            className={`chip ${p.id === current.id ? 'active' : ''}`}
            onClick={() => {
              setActiveId(p.id)
              setEditing(false)
            }}
          >
            项目 {idx + 1}：{p.name.slice(0, 10)}
            {p.name.length > 10 ? '…' : ''}
          </button>
        ))}
        <button type="button" className="chip" onClick={addCustom}>
          + 新增项目
        </button>
      </div>

      <div className="essay-section-card essay-section-scope">
        <div className="fact-actions">
          <button type="button" className="chip active" onClick={() => setEditing((v) => !v)}>
            {editing ? '✓ 完成编辑' : '✎ 编辑为我的真实项目'}
          </button>
          <button type="button" className="chip" onClick={() => void copySummary()}>
            {copied ? '✓ 已复制背景卡' : '📋 复制全文'}
          </button>
          <button type="button" className="chip" onClick={resetDefaults}>
            恢复模板
          </button>
        </div>

        <div className="fact-fields">
          {FIELDS.map((f) => (
            <div key={f.key} className="fact-field">
              <label className="fact-label">{f.label}</label>
              {editing ? (
                f.rows ? (
                  <textarea
                    className="case-answer"
                    rows={f.rows}
                    value={current[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="directory-search-input fact-input"
                    value={current[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                  />
                )
              ) : (
                <p className="fact-value">{current[f.key] || '（待补充）'}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
