import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

export type TopicItem = { id: string; title: string; subtitle: string }
export type TopicGroup = { key: string; title: string; icon: string; hint?: string; items: TopicItem[] }

// 已读标记只是本机便利功能，存取失败时当作未读
function useReadTopics(storageKey: string) {
  const [read, setRead] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(storageKey) ?? '[]') as string[])
    } catch {
      return new Set()
    }
  })
  const markRead = useCallback(
    (id: string) => {
      setRead((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev).add(id)
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]))
        } catch {
          // 忽略
        }
        return next
      })
    },
    [storageKey],
  )
  return { read, markRead }
}

/** 目录 → 详情两级浏览：目录按分组列出全部篇目，详情页带上一篇 / 下一篇。当前篇目放在 ?topic= 里，手机返回键可回到目录。 */
export default function TopicDirectory({
  title,
  description,
  groups,
  storageKey,
  renderDetail,
}: {
  title: string
  description: string
  groups: TopicGroup[]
  storageKey: string
  renderDetail: (id: string) => ReactNode
}) {
  const [params, setParams] = useSearchParams()
  const { read, markRead } = useReadTopics(storageKey)
  const flat = groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g })))
  const currentId = params.get('topic')
  const index = flat.findIndex((t) => t.id === currentId)
  const current = index >= 0 ? flat[index] : null

  useEffect(() => {
    if (current) markRead(current.id)
    window.scrollTo({ top: 0 })
  }, [current?.id, markRead]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (id: string) => setParams({ topic: id })

  if (current) {
    const prev = flat[index - 1]
    const next = flat[index + 1]
    const posInGroup = current.group.items.findIndex((t) => t.id === current.id) + 1
    return (
      <div className="page topic-page">
        <button className="back-btn" onClick={() => setParams({})}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          目录
        </button>
        <div className="topic-detail-head">
          <span className="topic-eyebrow">
            {current.group.icon} {current.group.title} · {posInGroup}/{current.group.items.length}
          </span>
          <h1>{current.title}</h1>
        </div>

        {renderDetail(current.id)}

        <nav className="topic-pager" aria-label="翻篇">
          {prev ? (
            <button type="button" className="topic-pager-btn" onClick={() => open(prev.id)}>
              <span className="topic-pager-dir">← 上一篇</span>
              <span className="topic-pager-title">{prev.title}</span>
            </button>
          ) : (
            <span />
          )}
          {next ? (
            <button type="button" className="topic-pager-btn next" onClick={() => open(next.id)}>
              <span className="topic-pager-dir">下一篇 →</span>
              <span className="topic-pager-title">{next.title}</span>
            </button>
          ) : (
            <span />
          )}
        </nav>
      </div>
    )
  }

  const readCount = flat.filter((t) => read.has(t.id)).length

  return (
    <div className="page topic-page">
      <div className="page-header">
        <h1>{title}</h1>
        <p>
          {description} · 已读 {readCount}/{flat.length}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.key} className="topic-group" aria-labelledby={`topic-group-${g.key}`}>
          <h2 className="topic-group-title" id={`topic-group-${g.key}`}>
            <span aria-hidden="true">{g.icon}</span> {g.title}
            <small>
              {g.items.filter((t) => read.has(t.id)).length}/{g.items.length}
              {g.hint && ` · ${g.hint}`}
            </small>
          </h2>
          <ul className="topic-list">
            {g.items.map((t, i) => (
              <li key={t.id}>
                <button type="button" className="topic-row" onClick={() => open(t.id)}>
                  <span className={`topic-num ${read.has(t.id) ? 'read' : ''}`} aria-hidden="true">
                    {read.has(t.id) ? '✓' : i + 1}
                  </span>
                  <span className="topic-text">
                    <span className="topic-title">
                      {t.title}
                      {read.has(t.id) && <span className="sr-only">（已读）</span>}
                    </span>
                    <span className="topic-subtitle">{t.subtitle}</span>
                  </span>
                  <span className="topic-chevron" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
