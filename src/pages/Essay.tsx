import { essayContents } from '../data/essayContent'
import TopicDirectory, { type TopicGroup } from '../components/TopicDirectory'

const toItem = (e: (typeof essayContents)[number]) => ({ id: e.chapter, title: e.label, subtitle: e.title })

const groups: TopicGroup[] = [
  { key: 'intro', title: '写作总论', icon: '✍️', items: essayContents.filter((e) => e.chapter === 'intro').map(toItem) },
  {
    key: 'domains',
    title: '8 大绩效域',
    icon: '📊',
    hint: '近年命题重心',
    items: essayContents.filter((e) => e.chapter.startsWith('pd-')).map(toItem),
  },
  {
    key: 'areas',
    title: '十大管理领域',
    icon: '🧩',
    items: essayContents.filter((e) => e.chapter !== 'intro' && !e.chapter.startsWith('pd-')).map(toItem),
  },
]

function EssayDetail({ id }: { id: string }) {
  const essay = essayContents.find((e) => e.chapter === id)
  if (!essay) return null
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
    </>
  )
}

export default function Essay() {
  return (
    <TopicDirectory
      title="论文写作知识点"
      description="按真实命题主题组织"
      groups={groups}
      storageKey="gaoxiang-2027-essay-read"
      renderDetail={(id) => <EssayDetail id={id} />}
    />
  )
}
