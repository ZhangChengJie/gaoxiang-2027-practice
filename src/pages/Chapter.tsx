import { useParams } from 'react-router-dom'
import { chapters } from '../data/content'
import { useProgress } from '../hooks/useProgress'
import Quiz from '../components/Quiz'
import BackButton from '../components/BackButton'

export default function Chapter() {
  const { key } = useParams<{ key: string }>()
  const { update } = useProgress()

  const chapter = chapters.find((c) => c.key === key)
  if (!chapter) {
    return (
      <div className="page">
        <BackButton to="/" />
        <div className="empty-state">章节不存在</div>
      </div>
    )
  }

  return (
    <div className="page chapter-page">
      <BackButton to="/" />
      <div className="chapter-hero">
        <h1>{chapter.title}</h1>
        <p>{chapter.questions.length} 道题目 · 答错自动进入错题本</p>
      </div>
      <Quiz questions={chapter.questions} onAnswer={update} />
    </div>
  )
}
