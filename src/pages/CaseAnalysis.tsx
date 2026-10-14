import { caseCategories, caseContents } from '../data/caseAnalysis'
import TopicDirectory, { type TopicGroup } from '../components/TopicDirectory'

const groups: TopicGroup[] = caseCategories.map((cat) => ({
  key: cat.id,
  title: cat.title,
  icon: cat.icon,
  items: caseContents
    .filter((c) => c.categoryId === cat.id)
    .map((c) => ({ id: c.id, title: c.title, subtitle: c.description })),
}))

function CaseDetail({ id }: { id: string }) {
  const content = caseContents.find((c) => c.id === id)
  if (!content) return null
  return (
    <div className="case-card">
      <div className="case-card-header">
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
              {section.content.map((item, ii) =>
                item === '' ? (
                  <li key={ii} className="case-list-spacer" />
                ) : (
                  <li key={ii} className="case-list-item">
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CaseAnalysis() {
  return (
    <TopicDirectory
      title="案例分析"
      description="题型分类 · 答题技巧 · 高频考点 · 答题模板"
      groups={groups}
      storageKey="gaoxiang-2027-case-read"
      renderDetail={(id) => <CaseDetail id={id} />}
    />
  )
}
