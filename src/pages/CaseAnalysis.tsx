import { caseCategories, caseContents } from '../data/caseAnalysis'
import { casePractices } from '../data/casePractice'
import TopicDirectory, { type TopicGroup } from '../components/TopicDirectory'
import CasePracticeRunner from '../components/CasePracticeRunner'
import { usePractice } from '../hooks/usePractice'
import { bestCaseScore } from '../lib/practiceStore'

const knowledgeGroups: TopicGroup[] = caseCategories.map((cat) => ({
  key: cat.id,
  title: cat.title,
  icon: cat.icon,
  items: caseContents
    .filter((c) => c.categoryId === cat.id)
    .map((c) => ({ id: c.id, title: c.title, subtitle: c.description })),
}))

function CaseDetail({ id }: { id: string }) {
  const practice = casePractices.find((c) => c.id === id)
  if (practice) return <CasePracticeRunner key={practice.id} practice={practice} />
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
  const { records } = usePractice()
  const practiceGroup: TopicGroup = {
    key: 'practice',
    title: '实战练习',
    icon: '🏋️',
    hint: '每套 25 分',
    items: casePractices.map((c) => {
      const best = bestCaseScore(records, c.id)
      return {
        id: c.id,
        title: c.title,
        subtitle: `${c.questions.length} 问 · 建议 ${c.minutes} 分钟${best === null ? '' : ` · 最好 ${best}/25`}`,
      }
    }),
  }
  const groups = [practiceGroup, ...knowledgeGroups]
  return (
    <TopicDirectory
      title="案例分析"
      description="实战练习 + 题型 · 技巧 · 考点 · 模板"
      groups={groups}
      storageKey="gaoxiang-2027-case-read"
      renderDetail={(id) => <CaseDetail id={id} />}
    />
  )
}
