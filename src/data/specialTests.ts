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
    title: '法律法规·职业道德',
    description: '合同招投标 / 知识产权 / 数据安全 / 标准化 / 职业道德',
    icon: '⚖️',
    filter: (questions: Question[]) =>
      questions.filter((q) => q.chapter === '18-法律法规标准规范职业道德'),
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
  {
    key: 'pmfundamentals',
    title: '项目管理概论',
    description: '项目基础·立项·组织·生命周期',
    icon: '📘',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '12-项目管理概论与立项管理'),
  },
  {
    key: 'advanced',
    title: '高级管理与法规',
    description: 'OPM·配置变更·法律法规·英语',
    icon: '🏛️',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '13-高级管理与辅助知识域'),
  },
  {
    key: 'newtech',
    title: '新一代信息技术',
    description: '云计算·大数据·AI·区块链·5G·安全',
    icon: '💻',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '14-新一代信息技术详解'),
  },
  {
    key: 'risk-proc-stake',
    title: '风险·采购·干系人',
    description: '风险管理·合同类型·干系人管理',
    icon: '🔐',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '15-风险采购干系人管理'),
  },
  {
    key: 'exam-2026',
    title: '2026 真题相似专项',
    description: '基于 2026 上半年真题考查方向的原创改编题',
    icon: '🆕',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '16-2026真题相似知识点'),
  },
  {
    key: 'exam-trend',
    title: '考试走向·高频必刷',
    description: '按 2021-2026 九个考期逐题统计的高频+新增考点',
    icon: '🎯',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '17-考试走向高频必刷'),
  },
  {
    key: 'operations-research',
    title: '科学基础·运筹学',
    description: '线性规划 / 网络计划 / 决策分析 / EOQ / 预测',
    icon: '📐',
    filter: (questions: Question[]) => questions.filter((q) => q.chapter === '19-项目管理科学基础运筹学'),
  },
]
