import { useState, useCallback, useMemo } from 'react'
import { loadProgress, saveProgress } from '../lib/storage'
import type { Question, Progress } from '../lib/types'

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  const update = useCallback((q: Question, right: boolean) => {
    setProgress((prev) => {
      const answered = { ...prev.answered, [q.id]: true }
      const wrong = { ...prev.wrong }

      if (right) {
        // 答对：从错题本移除
        delete wrong[q.id]
      } else {
        // 答错：记录/更新错题
        const existing = wrong[q.id]
        wrong[q.id] = {
          id: q.id,
          wrongCount: existing ? existing.wrongCount + 1 : 1,
          lastWrongTime: Date.now(),
        }
      }

      const next: Progress = { answered, wrong }
      saveProgress(next)
      return next
    })
  }, [])

  const wrongQuestions = useCallback((allQuestions: Question[]) => {
    return allQuestions.filter((q) => progress.wrong[q.id])
  }, [progress.wrong])

  const clearWrong = useCallback((questionId: string) => {
    setProgress((prev) => {
      const wrong = { ...prev.wrong }
      delete wrong[questionId]
      const next: Progress = { ...prev, wrong }
      saveProgress(next)
      return next
    })
  }, [])

  const clearAllWrong = useCallback(() => {
    setProgress((prev) => {
      const next: Progress = { ...prev, wrong: {} }
      saveProgress(next)
      return next
    })
  }, [])

  const chapterProgress = useCallback(
    (chapterQuestions: Question[]) => {
      const total = chapterQuestions.length
      const done = chapterQuestions.filter((q) => progress.answered[q.id]).length
      return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 }
    },
    [progress.answered],
  )

  const totalStats = useMemo(() => {
    const answeredCount = Object.keys(progress.answered).length
    const wrongCount = Object.keys(progress.wrong).length
    return { answeredCount, wrongCount }
  }, [progress])

  return { progress, update, wrongQuestions, clearWrong, clearAllWrong, chapterProgress, totalStats }
}
