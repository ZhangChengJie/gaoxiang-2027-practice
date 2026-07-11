import { useMemo, useState } from 'react'
import { chapters, allQuestions } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import Quiz from '../components/Quiz'
import StatsCard from '../components/StatsCard'

export default function WrongBook() {
  const { progress, update, clearAllWrong } = useProgress()
  const [mode, setMode] = useState<'list' | 'quiz'>('list')

  const wrongIds = new Set(Object.keys(progress.wrong))

  const questionsByChapter = useMemo(() => {
    const map: Record<string, { id: string; chapter: string; text: string; options: string[]; answer: number; explanation: string; wrongCount: number; lastWrongTime: number }[]> = {}
    for (const ch of chapters) {
      const wrong = ch.questions
        .filter((q) => wrongIds.has(q.id))
        .map((q) => ({
          ...q,
          wrongCount: progress.wrong[q.id]?.wrongCount ?? 0,
          lastWrongTime: progress.wrong[q.id]?.lastWrongTime ?? 0,
        }))
      if (wrong.length > 0) {
        map[ch.title] = wrong
      }
    }
    return map
  }, [chapters, progress.wrong])

  const allWrongQuestions = useMemo(() => allQuestions.filter((q) => wrongIds.has(q.id)), [wrongIds])

  const totalWrong = Object.keys(progress.wrong).length

  if (totalWrong === 0) {
    return (
      <div className="page wrong-page">
        <div className="page-header">
          <h1>错题本</h1>
          <p>暂无错题，继续加油！</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <p>答错的题目会自动出现在这里</p>
        </div>
      </div>
    )
  }

  if (mode === 'quiz') {
    return (
      <div className="page wrong-page">
        <div className="wrong-header">
          <button className="back-btn" onClick={() => setMode('list')}>
            ← 返回列表
          </button>
          <h1>错题练习</h1>
          <div />
        </div>
        <Quiz questions={allWrongQuestions} onAnswer={update} />
      </div>
    )
  }

  return (
    <div className="page wrong-page">
      <div className="page-header">
        <h1>错题本</h1>
        <p>共 {totalWrong} 道错题，点击章节进入练习</p>
      </div>

      <div className="wrong-stats">
        <StatsCard label="总错题" value={totalWrong} />
        <StatsCard label="涉及章节" value={Object.keys(questionsByChapter).length} />
        <StatsCard
          label="高频错题（≥3次）"
          value={Object.values(progress.wrong).filter((r: { wrongCount: number }) => r.wrongCount >= 3).length}
        />
      </div>

      <div className="wrong-actions">
        <button className="action-btn primary" onClick={() => setMode('quiz')}>
          练习全部错题
        </button>
        <button className="action-btn danger" onClick={clearAllWrong}>
          清空错题本
        </button>
      </div>

      <div className="chapter-list">
        {Object.entries(questionsByChapter).map(([title, questions]) => (
          <button
            key={title}
            className="chapter-card"
            onClick={() => setMode('quiz')}
          >
            <div className="chapter-info">
              <div className="chapter-title">{title}</div>
              <div className="chapter-meta">
                {questions.length} 道错题
                {questions.some((q) => q.wrongCount >= 3) && (
                  <span className="high-freq-badge">高频</span>
                )}
              </div>
            </div>
            <div className="wrong-count-badge">{questions.length}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
