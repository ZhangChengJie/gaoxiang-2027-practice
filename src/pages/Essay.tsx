import { essayContents } from '../data/essayContent'
import { essayOutlines } from '../data/essayOutlines'
import { SAMPLE_ESSAYS, type SampleEssay } from '../data/essayModels'
import TopicDirectory, { type TopicGroup } from '../components/TopicDirectory'
import OutlinePractice from '../components/OutlinePractice'
import ProjectFactBank from '../components/ProjectFactBank'

const toItem = (e: (typeof essayContents)[number]) => ({ id: e.chapter, title: e.label, subtitle: e.title })

const groups: TopicGroup[] = [
  {
    key: 'toolkit',
    title: '项目事实库 & 高分范文',
    icon: '⭐',
    hint: '可编辑背景 + 4 篇精读拆解',
    items: [
      {
        id: 'fact-bank',
        title: '我的项目背景事实库',
        subtitle: '内置 AI 大模型 & 政务平台 2 套万能模板，支持自定义保存',
      },
      ...SAMPLE_ESSAYS.map((s) => ({
        id: s.id,
        title: `【范文】${s.title.replace(/^论/, '')}`,
        subtitle: `${s.category} · ${s.wordCount} · ${s.projectUsed.slice(0, 22)}…`,
      })),
    ],
  },
  { key: 'intro', title: '写作总论', icon: '✍️', items: essayContents.filter((e) => e.chapter === 'intro').map(toItem) },
  {
    key: 'domains',
    title: '8 大绩效域',
    icon: '📊',
    hint: '近年命题重心',
    items: essayContents.filter((e) => e.chapter.startsWith('pd-')).map(toItem),
  },
  {
    key: 'ai',
    title: 'AI 与大模型项目专题',
    icon: '🤖',
    hint: '2026–2027 热门实战背景',
    items: essayContents.filter((e) => e.chapter.startsWith('ai-')).map(toItem),
  },
  {
    key: 'areas',
    title: '十大管理领域',
    icon: '🧩',
    items: essayContents.filter((e) => e.chapter.startsWith('ka-')).map(toItem),
  },
  {
    key: 'ext',
    title: '扩展高频与复合专题',
    icon: '🏛️',
    hint: '配置/项目集/立项/多供应商',
    items: essayContents.filter((e) => e.chapter.startsWith('ext-')).map(toItem),
  },
]

function SampleEssayView({ sample }: { sample: SampleEssay }) {
  return (
    <div className="sample-essay">
      <div className="essay-section-card essay-section-scope">
        <div className="essay-section-header">
          <span className="essay-section-icon">🏆</span>
          <div>
            <h3 className="essay-section-title">{sample.title}</h3>
            <p className="essay-section-subtitle">
              {sample.category} · {sample.wordCount} · 背景：{sample.projectUsed}
            </p>
          </div>
        </div>
        <div className="essay-section-body">
          <ul className="essay-points-list">
            {sample.highlights.map((h, i) => (
              <li key={i}>
                <span className="essay-point-num">{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {sample.sections.map((sec, idx) => (
        <article key={idx} className="essay-section-card sample-section-card">
          <div className="sample-section-tag">{sec.tag}</div>
          <h3 className="sample-section-heading">{sec.heading}</h3>
          {sec.paragraphs.map((para, pi) => (
            <p key={pi} className="sample-para">{para}</p>
          ))}
          <div className="sample-score-tip">🎯 {sec.scoreTip}</div>
        </article>
      ))}
    </div>
  )
}

function EssayDetail({ id }: { id: string }) {
  if (id === 'fact-bank') return <ProjectFactBank />
  const sample = SAMPLE_ESSAYS.find((s) => s.id === id)
  if (sample) return <SampleEssayView sample={sample} />

  const essay = essayContents.find((e) => e.chapter === id)
  if (!essay) return null
  const outline = essayOutlines.find((o) => o.essayId === id)
  return (
    <>
      <div className="essay-section-card essay-section-scope">
        <div className="essay-section-header">
          <span className="essay-section-icon">📋</span>
          <div>
            <h3 className="essay-section-title">论文主题</h3>
            <p className="essay-section-subtitle">{essay.title}</p>
          </div>
        </div>
        <div className="essay-section-body">
          <p className="essay-scope-text">{essay.scope}</p>
        </div>
      </div>

      <div className="essay-section-card essay-section-points">
        <div className="essay-section-header">
          <span className="essay-section-icon">🎯</span>
          <div>
            <h3 className="essay-section-title">关键知识点</h3>
            <p className="essay-section-subtitle">{essay.points.length} 个论文写作要点</p>
          </div>
        </div>
        <div className="essay-section-body">
          <ul className="essay-points-list">
            {essay.points.map((p, i) => (
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
          <p className="essay-practice-text">{essay.practice}</p>
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
            {essay.keywords.map((kw) => (
              <span key={kw} className="keyword-tag">{kw}</span>
            ))}
          </div>
        </div>
      </div>
      {outline && <OutlinePractice key={outline.essayId} outline={outline} />}
    </>
  )
}

export default function Essay() {
  return (
    <TopicDirectory
      title="论文备考与范文"
      description="项目事实库 · 高分范文拆解 · 31 篇命题提纲"
      groups={groups}
      storageKey="gaoxiang-2027-essay-read"
      renderDetail={(id) => <EssayDetail id={id} />}
    />
  )
}
