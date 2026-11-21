/**
 * 2705 考期基础学习计划表 2.0（2026.11.17 – 2027.01.15，共 9 周 60 天）
 * 与工作区 `05-第二轮开始了/高项2705考期基础学习计划表2.0.xlsx-ls.xlsx` 对齐。
 */

export type StudyStage = {
  id: string
  checkpointKey: string
  label: string
  shortTitle: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD (验收节点日)
  targetAccuracy: number // e.g. 0.85
  domains: string[]
}

export const PLAN_START_DATE = '2026-11-17'
export const PLAN_END_DATE = '2027-01-15'
export const PLAN_TOTAL_WEEKS = 9
export const PLAN_TOTAL_DAYS = 60

export const STUDY_STAGES_2705: StudyStage[] = [
  {
    id: 'stage-1',
    checkpointKey: 'checkpoint-1',
    label: '节点① · IT 信息技术篇',
    shortTitle: 'IT 第1~5章（信息化/新技术/治理/管理/工程）',
    startDate: '2026-11-17',
    endDate: '2026-11-29',
    targetAccuracy: 0.85,
    domains: ['informatization', 'it-tech', 'is-governance', 'is-management', 'is-engineering'],
  },
  {
    id: 'stage-2',
    checkpointKey: 'checkpoint-2',
    label: '节点② · 项目管理上半',
    shortTitle: '概论/立项/整合/范围/进度/成本（6章）',
    startDate: '2026-11-30',
    endDate: '2026-12-16',
    targetAccuracy: 0.85,
    domains: ['pm-basics', 'initiation', 'integration', 'scope', 'schedule', 'cost'],
  },
  {
    id: 'stage-3',
    checkpointKey: 'checkpoint-3',
    label: '节点③ · 项目管理全章',
    shortTitle: '质量/资源/沟通/风险/采购/干系人（下半收官）',
    startDate: '2026-12-17',
    endDate: '2027-01-03',
    targetAccuracy: 0.85,
    domains: ['quality', 'resource', 'communication', 'risk', 'procurement', 'stakeholder'],
  },
  {
    id: 'stage-4',
    checkpointKey: 'checkpoint-4',
    label: '节点④ · 扩展篇收官',
    shortTitle: '绩效域/配置变更/法规/高级管理与运筹',
    startDate: '2027-01-04',
    endDate: '2027-01-15',
    targetAccuracy: 0.85,
    domains: ['performance', 'config-change', 'law-standard', 'advanced', 'operations-research'],
  },
]

const DAY_MS = 24 * 60 * 60 * 1000

function toLocalDayStart(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

function todayLocalStart(now: number): number {
  const d = new Date(now)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export type StudyPlanStatus = {
  week: number
  dayIndex: number
  percent: number
  stage: StudyStage
  daysToCheckpoint: number
  isFinished: boolean
}

export function getStudyPlanStatus(now: number = Date.now()): StudyPlanStatus {
  const today = todayLocalStart(now)
  const start = toLocalDayStart(PLAN_START_DATE)
  const end = toLocalDayStart(PLAN_END_DATE)
  const elapsedDays = Math.floor((today - start) / DAY_MS) + 1
  const dayIndex = Math.max(1, Math.min(PLAN_TOTAL_DAYS, elapsedDays))
  const week = Math.max(1, Math.min(PLAN_TOTAL_WEEKS, Math.ceil(dayIndex / 7)))
  const percent = Math.max(0, Math.min(100, Math.round((dayIndex / PLAN_TOTAL_DAYS) * 100)))
  const isFinished = today > end

  const stage =
    STUDY_STAGES_2705.find((s) => today <= toLocalDayStart(s.endDate))
    ?? STUDY_STAGES_2705[STUDY_STAGES_2705.length - 1]
  const daysToCheckpoint = Math.max(0, Math.round((toLocalDayStart(stage.endDate) - today) / DAY_MS))

  return { week, dayIndex, percent, stage, daysToCheckpoint, isFinished }
}
