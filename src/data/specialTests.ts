import type { Question, SpecialTest } from '../lib/types'

export const specialTests: SpecialTest[] = [
  {
    key: 'performance',
    title: '绩效域专项',
    description: '八大绩效域核心概念 40 题',
    icon: '📊',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === 'performance'),
  },
  {
    key: 'calculation',
    title: '计算题专项',
    description: 'EVM / PERT / 关键路径 / 财务分析',
    icon: '🧮',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '07-全计算专题'),
  },
  {
    key: 'law',
    title: '法律法规专项',
    description: '数据安全法 / 个保法 / 信息安全法',
    icon: '⚖️',
    filter: (questions: Question[]) =>
      questions.filter(
        (q) =>
          q.chapter === '05-绩效域高级管理法规' &&
          (q.text.includes('法规') || q.text.includes('法') || q.text.includes('合规') || q.text.includes('安全')),
      ),
  },
  {
    key: 'itto',
    title: 'ITTO 高频链路',
    description: '输入-工具-技术-输出高频考点',
    icon: '🔗',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '06-ITTO高频链路'),
  },
  {
    key: 'case',
    title: '案例分析',
    description: '综合场景分析与解决方案',
    icon: '📋',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '08-案例分析'),
  },
  {
    key: 'memory',
    title: '记忆与复盘',
    description: '高频考点循环记忆',
    icon: '🧠',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '10-记忆与复盘'),
  },
  {
    key: 'errors',
    title: '易错考点',
    description: '从错题本提取高频错误题目',
    icon: '⚠️',
    filter: (_questions: Question[]) => {
      // 动态加载错题数据
      try {
        const saved = JSON.parse(localStorage.getItem('gaoxiang-2027-progress-v1') ?? '{}')
        const wrong = saved.wrong ?? {}
        const wrongIds = Object.keys(wrong)
          .filter((id) => wrong[id].wrongCount >= 2)
          .sort((a, b) => wrong[b].wrongCount - wrong[a].wrongCount)
        return wrongIds
          .map((id) => _questions.find((q) => q.id === id))
          .filter((q): q is Question => q !== undefined)
          .slice(0, 30)
      } catch {
        return []
      }
    },
  },
  {
    key: 'mock',
    title: '综合模考',
    description: '随机 75 题综合模拟考试',
    icon: '📝',
    filter: (questions: Question[]) => {
      const shuffled = [...questions].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, Math.min(75, shuffled.length))
    },
  },
  {
    key: 'sprint',
    title: '六周冲刺',
    description: '考前冲刺高频题目',
    icon: '🚀',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '11-六周冲刺'),
  },
]
