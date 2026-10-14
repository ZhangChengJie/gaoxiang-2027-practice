import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { allQuestions, questionsByDomain } from '../data/content'
import { DOMAINS, ESSAY_DOMAIN, domainTitle } from '../data/domains'
import { useProgress } from '../hooks/useProgress'
import { domainAccuracy } from '../lib/progress'
import Quiz from '../components/Quiz'
import BackButton from '../components/BackButton'

function accClass(acc: number | null) {
  if (acc === null) return ''
  return acc >= 0.7 ? 'mock-pass' : acc >= 0.6 ? 'acc-ok-text' : 'mock-fail'
}

export default function DomainPractice() {
  const { key } = useParams<{ key: string }>()
  return key ? <DomainQuiz key={key} domain={key} /> : <DomainList />
}

function DomainList() {
  const navigate = useNavigate()
  const { progress } = useProgress()
  const rows = domainAccuracy(progress, allQuestions).filter((r) => r.total > 0 && r.domain !== ESSAY_DOMAIN)
  const weightOf = new Map(DOMAINS.map((d) => [d.key, d.mockWeight]))

  return (
    <div className="page topic-page">
      <BackButton to="/specials" />
      <div className="page-header">
        <h1>按知识域练习</h1>
        <p>按真题知识域分类；右侧为正确率，括号内为模考题量</p>
      </div>
      <ul className="topic-list">
        {rows.map((r) => (
          <li key={r.domain}>
            <button type="button" className="topic-row" onClick={() => navigate(`/domain/${r.domain}`)}>
              <span className="topic-text">
                <span className="topic-title">{r.title}</span>
                <span className="topic-subtitle">
                  {r.total} 题 · 已做 {r.attempted}
                  {weightOf.get(r.domain) ? `（模考约 ${weightOf.get(r.domain)} 题）` : ''}
                </span>
              </span>
              <span className={`domain-acc ${accClass(r.accuracy)}`}>
                {r.accuracy === null ? '—' : `${Math.round(r.accuracy * 100)}%`}
              </span>
              <span className="topic-chevron" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DomainQuiz({ domain }: { domain: string }) {
  const { progress, update } = useProgress()
  // 未做过的题排前，其次最近答错的，进入时定好题单
  const [questions] = useState(() => {
    const qs = questionsByDomain[domain] ?? []
    const rank = (id: string) => (!progress.answered[id] ? 0 : progress.stats[id]?.lastCorrect === false ? 1 : 2)
    return [...qs].sort((a, b) => rank(a.id) - rank(b.id))
  })

  return (
    <div className="page chapter-page">
      <BackButton to="/domain" />
      <div className="chapter-hero">
        <h1>{domainTitle(domain)}</h1>
        <p>{questions.length} 道题 · 未做过的排在前面</p>
      </div>
      {questions.length === 0 ? <div className="empty-state">暂无题目</div> : <Quiz questions={questions} onAnswer={update} />}
    </div>
  )
}
