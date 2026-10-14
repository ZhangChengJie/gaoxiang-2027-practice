import type { Question } from '../lib/types'
import { formatDuration } from '../lib/format'
import StatsCard from './StatsCard'

export default function SessionSummary({
  questions,
  answers,
  elapsedSec,
  onRestart,
  onBack,
}: {
  questions: Question[]
  answers: Record<number, number>
  elapsedSec: number
  onRestart: () => void
  onBack: () => void
}) {
  const answered = Object.keys(answers).map(Number)
  const correct = answered.filter((i) => answers[i] === questions[i].answer).length
  const missed = answered.filter((i) => answers[i] !== questions[i].answer)
  const accuracy = answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0
  const verdict = accuracy >= 70 ? '达到阶段二目标（≥70%）' : accuracy >= 60 ? '达到阶段一目标（≥60%）' : '未达 60%，错题请标好错因后复测'

  return (
    <div className="session-summary">
      <div className="summary-hero">
        <div className="summary-score">{accuracy}%</div>
        <div className="summary-verdict">{verdict}</div>
      </div>

      <div className="wrong-stats">
        <StatsCard label="作答" value={`${answered.length}/${questions.length}`} />
        <StatsCard label="答对" value={correct} />
        <StatsCard label="用时" value={formatDuration(elapsedSec)} sub={answered.length > 0 ? `均 ${Math.round(elapsedSec / answered.length)} 秒/题` : undefined} />
      </div>

      {missed.length > 0 && (
        <section className="summary-missed" aria-labelledby="summary-missed-title">
          <h2 className="section-title" id="summary-missed-title">本轮错题（已进入错题本）</h2>
          <ol className="summary-missed-list">
            {missed.map((i) => (
              <li key={questions[i].id}>
                <div className="summary-missed-text">{questions[i].text}</div>
                <div className="summary-missed-answer">
                  你选 {'ABCD'[answers[i]]} · 正确 {'ABCD'[questions[i].answer]}：{questions[i].options[questions[i].answer]}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="wrong-actions">
        <button className="action-btn" onClick={onBack}>
          返回题目
        </button>
        <button className="action-btn primary" onClick={onRestart}>
          再来一轮
        </button>
      </div>
    </div>
  )
}
