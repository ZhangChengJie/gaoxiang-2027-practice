import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { chapters, allQuestions } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import { getChapterMeta } from '../lib/chapterMeta'
import { accuracyOf, localDateKey, todayStat, weakestDomains } from '../lib/progress'
import { getStudyPlanStatus, PLAN_TOTAL_WEEKS } from '../lib/studyPlan2705'
import { getSyncCode } from '../lib/syncClient'
import ProgressRing from '../components/ProgressRing'
import { ThemeToggle } from '../components/ThemeToggle'
import SyncSettingsSheet from '../components/SyncSettingsSheet'

function accuracyClass(acc: number | null) {
  if (acc === null) return ''
  return acc >= 0.7 ? 'acc-good' : acc >= 0.6 ? 'acc-ok' : 'acc-low'
}

type ChapterTab = 'all' | 'it' | 'pm' | 'ext' | 'sprint'

const CHAPTER_TABS: { key: ChapterTab; label: string; match: (k: string) => boolean }[] = [
  { key: 'all', label: '全部', match: () => true },
  { key: 'it', label: 'IT 篇', match: (k) => /^(01|02|14)-/.test(k) },
  { key: 'pm', label: 'PM 核心', match: (k) => /^(03|04|06|07|12|15)-/.test(k) },
  { key: 'ext', label: '扩展法规', match: (k) => /^(05|13|18|19|20)-/.test(k) },
  { key: 'sprint', label: '案例/冲刺', match: (k) => /^(08|09|09a|10|11|16|17)-/.test(k) },
]

const COLLAPSED_CHAPTER_COUNT = 6
const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const allChapterQuestions = chapters.flatMap((c) => c.questions)

export default function Home() {
  const navigate = useNavigate()
  const { progress, chapterProgress, totalStats } = useProgress()
  const [chapterTab, setChapterTab] = useState<ChapterTab>('all')
  const [showAllChapters, setShowAllChapters] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [hasSyncCode, setHasSyncCode] = useState(() => Boolean(getSyncCode()))

  const now = Date.now()
  const overall = chapterProgress(allChapterQuestions)
  const today = todayStat(progress, now)
  const plan = getStudyPlanStatus(now)
  const weak = weakestDomains(progress, allQuestions)
  const todayAcc = today.answered > 0 ? Math.round((today.correct / today.answered) * 100) : null

  const { days7, streak } = useMemo(() => {
    const items = Array.from({ length: 7 }, (_, idx) => {
      const ts = now - (6 - idx) * DAY_MS
      const key = localDateKey(ts)
      const stat = progress.daily[key] ?? { answered: 0, correct: 0 }
      const d = new Date(ts)
      return { key, weekday: idx === 6 ? '今' : WEEKDAYS[d.getDay()], answered: stat.answered }
    })
    let s = 0
    for (let i = 0; i < 60; i++) {
      const key = localDateKey(now - i * DAY_MS)
      const count = progress.daily[key]?.answered ?? 0
      if (count > 0) s++
      else if (i > 0) break
    }
    return { days7: items, streak: s }
  }, [progress.daily, now])

  const activeTabDef = CHAPTER_TABS.find((t) => t.key === chapterTab) ?? CHAPTER_TABS[0]
  const filteredChapters = chapters.filter((c) => activeTabDef.match(c.key))
  const canCollapse = chapterTab === 'all' && filteredChapters.length > COLLAPSED_CHAPTER_COUNT
  const visibleChapters = canCollapse && !showAllChapters
    ? filteredChapters.slice(0, COLLAPSED_CHAPTER_COUNT)
    : filteredChapters

  return (
    <div className="page home-page">
      <header className="home-header">
        <div className="home-greeting">
          <h1>高项二轮练习</h1>
          <p>2027 信息系统项目管理师 · 第 {plan.week}/{PLAN_TOTAL_WEEKS} 周</p>
        </div>
        <div className="home-header-actions">
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setSyncOpen(true)}
            aria-label={hasSyncCode ? '同步与数据设置（已开启自动同步）' : '同步与数据设置（未绑定同步口令）'}
            title={hasSyncCode ? '已开启自动同步' : '设置同步口令与备份'}
          >
            <span className="header-icon-svg" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a5 5 0 0 1-.8-9.93A6 6 0 0 1 19.8 11a4 4 0 0 1-2.3 8z" />
              </svg>
            </span>
            <span className={`sync-dot ${hasSyncCode ? 'on' : 'off'}`} aria-hidden="true" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <section className="home-overview-card" aria-label="学习概览">
        <div className="home-overview">
          <div className="home-overview-progress" role="img" aria-label={`章节总进度 ${overall.percent}%，已答 ${overall.done} / ${overall.total} 题`}>
            <ProgressRing percent={overall.percent} size={44} />
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
            <span className="stat-number">{streak}</span>
            <span className="stat-label">连学天数</span>
          </div>
        </div>
        <div className="streak-strip" aria-label="近 7 天学习打卡">
          {days7.map((d) => {
            const level = d.answered >= 30 ? 'high' : d.answered >= 10 ? 'mid' : d.answered > 0 ? 'low' : 'none'
            return (
              <div key={d.key} className="streak-day" title={`${d.key}：已答 ${d.answered} 题`}>
                <span className={`streak-dot level-${level}`} />
                <span className="streak-label">{d.weekday}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="focus-card" aria-labelledby="today-title">
        <div className="focus-today">
          <div className="focus-today-info">
            <h2 id="today-title">今日任务</h2>
            <p>
              到期错题 {totalStats.dueCount} 题 · 今日已答 {today.answered} 题
              {todayAcc !== null && ` · 正确率 ${todayAcc}%`}
            </p>
          </div>
          <button type="button" className="action-btn primary focus-start-btn" onClick={() => navigate('/today')}>
            开始
          </button>
        </div>

        <div className="focus-plan">
          <div className="focus-plan-row">
            <div className="focus-plan-meta">
              <span className="focus-plan-stage">{plan.stage.label}</span>
              <span className="focus-plan-days">
                {plan.isFinished
                  ? '基础期已收官'
                  : plan.daysToCheckpoint === 0
                    ? '今日节点验收'
                    : `距验收(${plan.stage.endDate.slice(5)}) ${plan.daysToCheckpoint} 天`}
              </span>
            </div>
            <button
              type="button"
              className="focus-plan-link"
              onClick={() => navigate(`/test/${plan.stage.checkpointKey}`)}
            >
              去验收 ›
            </button>
          </div>
          <div className="plan-progress-bar" aria-hidden="true">
            <span style={{ width: `${plan.percent}%` }} />
          </div>
        </div>
      </section>

      <div className="quick-entries">
        <button type="button" className="mock-entry" onClick={() => navigate('/mock')}>
          <span className="quick-entry-icon tone-blue" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2.5" />
              <path d="M8 8h8M8 12h8M8 16h5" />
            </svg>
          </span>
          <span className="mock-entry-text">
            <strong>机考模拟</strong>
            <span>75 题 · 150 分钟</span>
          </span>
          <span className="quick-entry-arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" className="mock-entry" onClick={() => navigate('/cheatsheet')}>
          <span className="quick-entry-icon tone-green" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <span className="mock-entry-text">
            <strong>速查口袋书</strong>
            <span>ITTO · 公式 · 图卡</span>
          </span>
          <span className="quick-entry-arrow" aria-hidden="true">›</span>
        </button>
      </div>

      {weak.length > 0 && (
        <section className="weak-card" aria-labelledby="weak-title">
          <h2 id="weak-title">薄弱知识域</h2>
          <div className="weak-list">
            {weak.map((w) => (
              <button key={w.domain} type="button" className="chip" onClick={() => navigate(`/domain/${w.domain}`)}>
                {w.title} {Math.round((w.accuracy ?? 0) * 100)}%
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="chapter-grid-title">
        <div className="section-head-row">
          <h2 className="section-title" id="chapter-grid-title">章节学习</h2>
          <span className="section-hint">&lt;60% 红 · 60–70% 橙 · ≥70% 绿</span>
        </div>
        <div className="chapter-tabs" role="tablist" aria-label="按阶段筛选章节">
          {CHAPTER_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={chapterTab === t.key}
              className={`chip ${chapterTab === t.key ? 'active' : ''}`}
              onClick={() => setChapterTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="chapter-grid">
          {visibleChapters.map((c) => {
            const prog = chapterProgress(c.questions)
            const meta = getChapterMeta(c.key)
            const acc = accuracyOf(progress, c.questions.map((q) => q.id)).accuracy
            const code = c.key.split('-')[0]
            return (
              <button
                key={c.key}
                type="button"
                className="chapter-grid-item"
                style={{ '--chapter-accent': meta.accent } as CSSProperties}
                aria-label={c.title}
                onClick={() => navigate(`/chapter/${c.key}`)}
              >
                <div className="chapter-tile-top">
                  <span className="chapter-code-badge" aria-hidden="true">{code}</span>
                  <span className="chapter-grid-label">{meta.short}</span>
                </div>
                <div className="chapter-tile-bottom">
                  <span className="chapter-grid-progress" aria-hidden="true">
                    <span style={{ width: `${prog.percent}%` }} />
                  </span>
                  <span className="chapter-grid-count">
                    {prog.done}/{prog.total}
                    {acc !== null && <span className={`chapter-grid-acc ${accuracyClass(acc)}`}> · {Math.round(acc * 100)}%</span>}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {canCollapse && (
          <button
            type="button"
            className="chapter-expand-btn"
            onClick={() => setShowAllChapters((v) => !v)}
          >
            {showAllChapters ? '收起部分章节' : `展开全部 ${filteredChapters.length} 章`}
          </button>
        )}
      </section>

      <SyncSettingsSheet
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        onCodeChange={(code) => setHasSyncCode(Boolean(code))}
      />
    </div>
  )
}
