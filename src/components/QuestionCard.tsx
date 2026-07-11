import type { Question } from '../lib/types'

export default function QuestionCard({
  question,
  selected,
  onSelect,
  showResult,
}: {
  question: Question
  selected: number | null
  onSelect: (index: number) => void
  showResult: boolean
}) {
  const getOptionClass = (i: number) => {
    if (!showResult && selected === i) return 'option selected'
    if (showResult && i === question.answer) return 'option correct'
    if (showResult && selected === i && i !== question.answer) return 'option wrong'
    if (selected === i) return 'option selected'
    return 'option'
  }

  return (
    <div className="question-card">
      <div className="question-text">{question.text}</div>
      <div className="question-options">
        {question.options.map((opt, i) => (
          <button
            key={opt}
            className={getOptionClass(i)}
            onClick={() => !showResult && onSelect(i)}
            disabled={showResult}
          >
            <span className="option-label">{'ABCD'[i]}</span>
            <span className="option-text">{opt}</span>
          </button>
        ))}
      </div>
      {showResult && (
        <div className={`explanation ${selected === question.answer ? 'explanation-correct' : 'explanation-wrong'}`}>
          <div className="explanation-header">
            {selected === question.answer ? '✅ 回答正确' : `❌ 正确答案：${'ABCD'[question.answer]}`}
          </div>
          <div className="explanation-body">{question.explanation}</div>
        </div>
      )}
    </div>
  )
}
