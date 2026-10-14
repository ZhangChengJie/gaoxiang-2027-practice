import { useEffect, useMemo, useRef, useState } from 'react'
import type { CasePractice } from '../data/casePractice'
import { usePractice } from '../hooks/usePractice'
import { clearDraft, recordCaseAttempt, saveDraft, scoreCase } from '../lib/practiceStore'
import { formatDuration } from '../lib/format'

const MARKS = '__marks'
const KIND_LABEL: Record<CasePractice['kind'], string> = { calc: '计算类', fault: '找问题类', theory: '理论类', mixed: '综合类' }

// 把材料按句切开，便于"圈证据"
function splitSentences(paragraph: string) {
  return paragraph.match(/[^。；！？]+[。；！？]?/g) ?? [paragraph]
}

export default function CasePracticeRunner({ practice }: { practice: CasePractice }) {
  const { records, setRecords } = usePractice()
  const draft = records.drafts[practice.id] ?? {}
  const [phase, setPhase] = useState<'answer' | 'review' | 'saved'>('answer')
  const [hits, setHits] = useState<string[]>([])
  const startedAt = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase !== 'answer') return
    const t = setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(t)
  }, [phase])

  const marksRaw = draft[MARKS]
  const marks = useMemo(() => new Set<string>(marksRaw ? (JSON.parse(marksRaw) as string[]) : []), [marksRaw])
  const toggleMark = (k: string) => {
    const next = new Set(marks)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    setRecords(saveDraft(records, practice.id, MARKS, JSON.stringify([...next])))
  }
  const setAnswer = (qid: string, text: string) => setRecords(saveDraft(records, practice.id, qid, text))

  const result = scoreCase(practice, hits)
  const history = records.cases[practice.id] ?? []
  const overTime = elapsed > practice.minutes * 60

  const save = () => {
    const answers = Object.fromEntries(practice.questions.map((q) => [q.id, draft[q.id] ?? '']))
    let next = recordCaseAttempt(records, practice.id, { at: Date.now(), answers, hits, score: result.score, total: result.total })
    next = clearDraft(next, practice.id)
    setRecords(next)
    setPhase('saved')
  }

  const restart = () => {
    setHits([])
    startedAt.current = Date.now()
    setElapsed(0)
    setPhase('answer')
  }

  return (
    <div className="case-runner">
      <div className="case-runner-meta">
        <span className="keyword-tag">{KIND_LABEL[practice.kind]}</span>
        <span>建议 {practice.minutes} 分钟 · 满分 {practice.questions.reduce((s, q) => s + q.score, 0)}</span>
        {history.length > 0 && <span>最好 {Math.max(...history.map((h) => h.score))} 分</span>}
      </div>

      <section className="case-card case-material" aria-labelledby={`${practice.id}-material`}>
        <h2 className="case-section-title" id={`${practice.id}-material`}>
          <span className="case-section-dot" />
          案例材料 <small className="section-hint">点句子可标记证据</small>
        </h2>
        {practice.background.map((para, pi) => (
          <p key={pi} className="case-material-para">
            {splitSentences(para).map((s, si) => {
              const k = `${pi}-${si}`
              return (
                <span
                  key={k}
                  role="button"
                  tabIndex={0}
                  className={`case-sentence ${marks.has(k) ? 'marked' : ''}`}
                  aria-pressed={marks.has(k)}
                  onClick={() => phase === 'answer' && toggleMark(k)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && phase === 'answer') {
                      e.preventDefault()
                      toggleMark(k)
                    }
                  }}
                >
                  {s}
                </span>
              )
            })}
          </p>
        ))}
      </section>

      {practice.questions.map((q, qi) => (
        <section key={q.id} className="case-card case-question" aria-labelledby={`${q.id}-title`}>
          <h3 className="case-question-title" id={`${q.id}-title`}>
            【问题 {qi + 1}】（{q.score} 分）{q.prompt.replace(/[（(]\s*\d+\s*分\s*[）)]\s*$/, '')}
          </h3>
          {phase === 'answer' ? (
            <textarea
              className="case-answer"
              rows={5}
              placeholder="分条作答，每条一个要点"
              value={draft[q.id] ?? ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              aria-label={`问题 ${qi + 1} 作答`}
            />
          ) : (
            <>
              <div className="case-my-answer">
                <div className="case-sub-label">我的作答</div>
                <p>{(phase === 'saved' ? history[history.length - 1]?.answers[q.id] : draft[q.id]) || '（未作答）'}</p>
              </div>
              <div className="case-sub-label">
                采分点（勾选你答到的）· 得 {result.byQuestion[q.id]?.score ?? 0}/{q.score}
              </div>
              <ul className="case-points">
                {q.scoringPoints.map((sp) => (
                  <li key={sp.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={hits.includes(sp.id)}
                        disabled={phase === 'saved'}
                        onChange={(e) => setHits((h) => (e.target.checked ? [...h, sp.id] : h.filter((x) => x !== sp.id)))}
                      />
                      <span>{sp.text}</span>
                      <span className="case-point-score">{sp.score} 分</span>
                    </label>
                  </li>
                ))}
              </ul>
              <details className="case-reference">
                <summary>参考答案</summary>
                {q.reference.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </details>
            </>
          )}
        </section>
      ))}

      {phase === 'answer' && (
        <div className="case-runner-bar">
          <span className={overTime ? 'mock-fail' : ''}>⏱ {formatDuration(elapsed)}</span>
          <button className="action-btn primary" onClick={() => setPhase('review')}>
            交卷，对照采分点
          </button>
        </div>
      )}
      {phase === 'review' && (
        <div className="case-runner-bar">
          <span>
            自评 <strong>{result.score}</strong>/{result.total}
          </span>
          <button className="action-btn primary" onClick={save}>
            保存成绩
          </button>
        </div>
      )}
      {phase === 'saved' && (
        <div className="case-runner-bar">
          <span>
            已保存：{result.score}/{result.total}（{result.score >= 15 ? '达到 60% 及格线' : '未到 15 分，复习参考答案后重做'}）
          </span>
          <button className="action-btn" onClick={restart}>
            再做一次
          </button>
        </div>
      )}
    </div>
  )
}
