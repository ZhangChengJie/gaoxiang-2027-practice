type ChapterMeta = { emoji: string; short: string; accent: string }

const chapterMeta: Record<string, ChapterMeta> = {
  '01-信息技术与信息化': { emoji: '📘', short: '信息化', accent: '#10aeff' },
  '02-治理工程与软件': { emoji: '🏛️', short: '治理工程', accent: '#6a5acd' },
  '03-项目管理主干上半': { emoji: '🧩', short: '整合·范围·进度', accent: '#07c160' },
  '04-项目管理主干下半': { emoji: '💰', short: '成本·质量·资源', accent: '#ff9500' },
  '05-绩效域高级管理法规': { emoji: '📊', short: '绩效域', accent: '#e0457b' },
  '06-ITTO高频链路': { emoji: '🔗', short: 'ITTO 链路', accent: '#00bcd4' },
  '07-全计算专题': { emoji: '🧮', short: '全计算', accent: '#ff5722' },
  '08-案例分析': { emoji: '📋', short: '案例分析', accent: '#8d6e63' },
  '09-高分论文方法': { emoji: '✍️', short: '论文方法', accent: '#3f51b5' },
  '09a-论文范文集': { emoji: '📄', short: '论文范文', accent: '#5c6bc0' },
  '10-记忆与复盘': { emoji: '🧠', short: '记忆复盘', accent: '#9c27b0' },
  '11-六周冲刺': { emoji: '🚀', short: '六周冲刺', accent: '#f44336' },
  '12-项目管理概论与立项管理': { emoji: '📗', short: '概论立项', accent: '#2196f3' },
  '13-高级管理与辅助知识域': { emoji: '🏢', short: '高级管理', accent: '#607d8b' },
  '14-新一代信息技术详解': { emoji: '💻', short: '新技术', accent: '#00acc1' },
  '15-风险采购干系人管理': { emoji: '🔐', short: '风险采购', accent: '#ef6c00' },
  '16-2026真题相似知识点': { emoji: '🆕', short: '真题相似', accent: '#43a047' },
  '17-考试走向高频必刷': { emoji: '🎯', short: '高频必刷', accent: '#e53935' },
  '18-法律法规标准规范职业道德': { emoji: '⚖️', short: '法规道德', accent: '#78909c' },
  '19-项目管理科学基础运筹学': { emoji: '📐', short: '运筹学', accent: '#5e35b1' },
}

const fallback: ChapterMeta = { emoji: '📄', short: '其他章节', accent: '#10aeff' }

export function getChapterMeta(key: string): ChapterMeta {
  return Object.hasOwn(chapterMeta, key) ? chapterMeta[key] : fallback
}
