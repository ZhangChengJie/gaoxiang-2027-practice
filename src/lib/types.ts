export type Question = {
  id: string
  chapter: string
  text: string
  options: string[]
  answer: number
  explanation: string
}

export type Chapter = {
  key: string
  title: string
  questions: Question[]
}

export type EssayContent = {
  chapter: string
  label: string
  title: string
  scope: string
  points: string[]
  practice: string
  keywords: string[]
}

export type SpecialTest = {
  key: string
  title: string
  description: string
  icon: string
  filter: (questions: Question[], progress: Progress) => Question[]
}

export type ErrorCause = 'unknown' | 'hesitant' | 'careless' | 'slow'

export type QuestionStat = {
  attempts: number
  correct: number
  lastAnswerTime: number
  lastCorrect: boolean
}

export type WrongRecord = {
  id: string
  wrongCount: number
  lastWrongTime: number
  cause?: ErrorCause
  reviewStage: number
  nextReviewAt: number
}

export type DailyStat = { answered: number; correct: number }

export type MockResult = {
  at: number
  total: number
  correct: number
  durationSec: number
  byChapter: Record<string, { total: number; correct: number }>
}

export type Progress = {
  version: 2
  answered: Record<string, boolean>
  stats: Record<string, QuestionStat>
  wrong: Record<string, WrongRecord>
  daily: Record<string, DailyStat>
  mockHistory: MockResult[]
}

export type CaseCategory = {
  id: string
  title: string
  icon: string
}

export type CaseSection = {
  title: string
  content: string[]
}

export type CaseContent = {
  id: string
  categoryId: string
  title: string
  description: string
  sections: CaseSection[]
}
