import { useEffect, useRef, useState } from 'react'
import { OUTLINE_MINUTES, type EssayOutline } from '../data/essayOutlines'
import { usePractice } from '../hooks/usePractice'
import { clearDraft, latestOutline, recordOutlineAttempt, saveDraft } from '../lib/practiceStore'

const draftKey = (id: string) => `outline:${id}`

export default function OutlinePractice({ outline }: { outline: EssayOutline }) {
  const { records, setRecords } = usePractice()
  const key = draftKey(outline.essayId)
  const text = records.drafts[key]?.text ?? ''
  const [phase, setPhase] = useState<'idle' | 'writing' | 'review' | 'saved'>(text ? 'writing' : 'idle')
  const [checked, setChecked] = useState<string[]>([])
  const deadline = useRef(0)
  const [left, setLeft] = useState(OUTLINE_MINUTES * 60)
  const last = latestOutline(records, outline.essayId)

  useEffect(() => {
    if (phase !== 'writing') return
    if (!deadline.current) deadline.current = Date.now() + OUTLINE_MINUTES * 60 * 1000
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((deadline.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) setPhase('review')
    }, 1000)
    return () => clearInterval(t)
  }, [phase])

  const start = () => {
    deadline.current = Date.now() + OUTLINE_MINUTES * 60 * 1000
    setLeft(OUTLINE_MINUTES * 60)
    setChecked([])
    setPhase('writing')
  }

  const save = () => {
    let next = recordOutlineAttempt(records, outline.essayId, { at: Date.now(), text, checked, total: outline.checklist.length })
    next = clearDraft(next, key)
    setRecords(next)
    setPhase('saved')
  }

  return (
    <section className="essay-section-card outline-practice" aria-labelledby={`outline-${outline.essayId}`}>
      <div className="essay-section-header">
        <span className="essay-section-icon">⏱️</span>
        <div>
          <h3 className="essay-section-title" id={`outline-${outline.essayId}`}>
            提纲练习（{OUTLINE_MINUTES} 分钟）
          </h3>
          <p className="essay-section-subtitle">
            {last ? `上次自评 ${last.checked.length}/${last.total}` : '限时列提纲，再对照参考提纲和检查清单自评'}
          </p>
        </div>
      </div>
      <div className="essay-section-body">
        <div className="outline-prompt">
          {outline.prompt.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {phase === 'idle' || phase === 'saved' ? (
          <div className="wrong-actions">
            <button className="action-btn primary" onClick={start}>
              {phase === 'saved' ? '再练一次' : '开始计时写提纲'}
            </button>
          </div>
        ) : null}

        {phase === 'writing' && (
          <>
            <div className={`outline-timer ${left < 120 ? 'mock-fail' : ''}`} role="timer">
              剩余 {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
            </div>
            <textarea
              className="case-answer"
              rows={10}
              placeholder={'摘要：……\n一、项目背景：……\n二、……（动作 + 量化结果）\n三、……\n结尾：不足与改进'}
              value={text}
              onChange={(e) => setRecords(saveDraft(records, key, 'text', e.target.value))}
              aria-label="提纲"
            />
            <div className="wrong-actions">
              <button className="action-btn primary" onClick={() => setPhase('review')} disabled={!text.trim()}>
                写完了，对照参考
              </button>
            </div>
          </>
        )}

        {phase === 'review' && (
          <>
            <div className="case-sub-label">参考提纲</div>
            <ol className="outline-reference">
              {outline.referenceOutline.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
            <div className="case-sub-label">
              自评清单 · {checked.length}/{outline.checklist.length}
            </div>
            <ul className="case-points">
              {outline.checklist.map((c) => (
                <li key={c.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked.includes(c.id)}
                      onChange={(e) => setChecked((h) => (e.target.checked ? [...h, c.id] : h.filter((x) => x !== c.id)))}
                    />
                    <span>{c.text}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="wrong-actions">
              <button className="action-btn primary" onClick={save}>
                保存自评
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
