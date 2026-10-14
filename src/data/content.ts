import type { Question } from '../lib/types'
import { DOMAINS } from './domains'

export type Essay = { chapter: string; title: string; scope: string; points: string[] }

const raws = import.meta.glob('../content/questions/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const domainKeysByTitle = new Map(DOMAINS.map((domain) => [domain.title, domain.key]))
const titleMap: Record<string, string> = {
  '01-信息技术与信息化': '信息化发展与新一代信息技术', '02-治理工程与软件': '信息系统治理·工程·安全',
  '03-项目管理主干上半': '整合·范围·进度管理', '04-项目管理主干下半': '成本·质量·资源管理',
  '05-绩效域高级管理法规': '绩效域·原则·价值交付', '06-ITTO高频链路': 'ITTO 高频链路',
  '07-全计算专题': '全计算专题', '08-案例分析': '案例分析专题', '09-高分论文方法': '高分论文方法',
  '09a-论文范文集': '论文范文集', '10-记忆与复盘': '记忆与复盘', '11-六周冲刺': '六周冲刺',
  '12-项目管理概论与立项管理': '项目管理概论与立项管理', '13-高级管理与辅助知识域': '高级管理与辅助知识域',
  '14-新一代信息技术详解': '新一代信息技术详解', '15-风险采购干系人管理': '风险·采购·干系人管理',
  '16-2026真题相似知识点': '2026 真题相似知识点', '17-考试走向高频必刷': '考试走向·高频必刷',
  '18-法律法规标准规范职业道德': '法律法规·标准·职业道德', '19-项目管理科学基础运筹学': '项目管理科学基础（运筹学）',
  '20-英文术语': '英文术语专项',
}
export const chapters = Object.entries(raws).map(([path, raw]) => {
  const key = path.split('/').pop()!.replace(/-\d+题\.md$/, '')
  const questions: Question[] = raw.split('\n## ').slice(1).map((part, i) => {
    const text = part.split('\n\n')[0].replace(/^\d+\.\s*/, '')
    const options = [...part.matchAll(/^([ABCD])\.\s+(.+)$/gm)].map((m) => m[2])
    const answerLetter = part.match(/\*\*答案：([ABCD])\*\*/)?.[1] ?? 'A'
    const explanation = part.match(/\*\*解析：\*\*\s*(.+)/)?.[1] ?? ''
    const focus = part.match(/^\*\*考点：\*\*[^\S\r\n]*([^/\r\n]+)\s*\/\s*([^\r\n]+)$/m)
    const domain = domainKeysByTitle.get(focus?.[1].trim() ?? '')
    const topic = focus?.[2].trim() ?? ''
    if (!domain || Array.from(topic).length < 2 || Array.from(topic).length > 12) {
      throw new Error(`${key}-${i + 1}: 考点标签缺失或无效`)
    }
    return { id: `${key}-${i + 1}`, chapter: key, domain, topic, text, options, answer: 'ABCD'.indexOf(answerLetter), explanation }
  })
  return { key, title: titleMap[key] ?? key, questions }
})

const essayPoints = ['项目背景与目标', '核心过程/绩效域动作', '产物或量化结果', '一个真实不足与改进']
export const essays: Essay[] = chapters.map((c) => ({
  chapter: c.key, title: `论${c.title}在信息系统项目中的应用`,
  scope: `围绕“${c.title}”准备一篇可限时完成的论文：以真实项目为背景，选择 3–5 个最相关的管理动作展开。`,
  points: essayPoints,
}))

const perfFacts = [
  ['干系人绩效域', '持续识别干系人、分析诉求并引导参与'], ['团队绩效域', '通过共同目标、授权、反馈和心理安全建设团队'],
  ['开发方法和生命周期绩效域', '按不确定性选择预测型、敏捷或混合方法'], ['规划绩效域', '采用渐进明细和滚动规划'],
  ['项目工作绩效域', '清除障碍、优化流程并促进知识共享'], ['交付绩效域', '从输出延伸到成果、收益和运营过渡'],
  ['测量绩效域', '用可信指标、趋势和根因支持决策'], ['不确定性绩效域', '处理风险、模糊性、复杂性和波动性'],
]
export const performanceQuestions: Question[] = perfFacts.flatMap(([term, desc], i) => Array.from({ length: 5 }, (_, j) => {
  const choices = [term, ...perfFacts.filter(([x]) => x !== term).slice(j, j + 3).map(([x]) => x)]
  const answer = (i + j) % 4; const opts = [...choices]; [opts[0], opts[answer]] = [opts[answer], opts[0]]
  return { id: `pd-${i}-${j}`, chapter: 'performance', domain: 'performance', topic: '绩效域辨析', text: `下列哪项最符合“${desc}”的绩效域？`, options: opts, answer, explanation: `${term}的核心是：${desc}。` }
}))

export const allQuestions: Question[] = [...chapters.flatMap((c) => c.questions), ...performanceQuestions]

export const questionsByDomain: Record<string, Question[]> = Object.fromEntries(
  DOMAINS.map(({ key }) => [key, allQuestions.filter((question) => question.domain === key)]),
)
