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
  filter: (questions: Question[]) => Question[]
}

export type WrongRecord = {
  id: string
  wrongCount: number
  lastWrongTime: number
}

export type Progress = {
  answered: Record<string, boolean>
  wrong: Record<string, WrongRecord>
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
