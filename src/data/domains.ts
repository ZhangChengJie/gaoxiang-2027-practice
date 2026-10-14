export type Domain = { key: string; title: string; mockWeight: number }

export const DOMAINS: Domain[] = [
  { key: 'informatization', title: '信息化发展', mockWeight: 6 },
  { key: 'it-tech', title: '信息技术发展', mockWeight: 3 },
  { key: 'is-governance', title: '信息系统治理', mockWeight: 2 },
  { key: 'is-management', title: '信息系统管理', mockWeight: 3 },
  { key: 'is-engineering', title: '信息系统工程', mockWeight: 5 },
  { key: 'pm-basics', title: '项目管理概论', mockWeight: 1 },
  { key: 'initiation', title: '项目立项管理', mockWeight: 2 },
  { key: 'integration', title: '项目整合管理', mockWeight: 5 },
  { key: 'scope', title: '项目范围管理', mockWeight: 5 },
  { key: 'schedule', title: '项目进度管理', mockWeight: 4 },
  { key: 'cost', title: '项目成本管理', mockWeight: 6 },
  { key: 'quality', title: '项目质量管理', mockWeight: 3 },
  { key: 'resource', title: '项目资源管理', mockWeight: 2 },
  { key: 'communication', title: '项目沟通管理', mockWeight: 3 },
  { key: 'risk', title: '项目风险管理', mockWeight: 7 },
  { key: 'procurement', title: '项目采购管理', mockWeight: 2 },
  { key: 'stakeholder', title: '项目干系人管理', mockWeight: 1 },
  { key: 'performance', title: '项目绩效域与原则', mockWeight: 7 },
  { key: 'config-change', title: '配置与变更管理', mockWeight: 1 },
  { key: 'advanced', title: '高级项目管理与组织治理', mockWeight: 0 },
  { key: 'law-standard', title: '法律法规与标准规范', mockWeight: 1 },
  { key: 'operations-research', title: '管理科学基础（运筹学）', mockWeight: 1 },
  { key: 'english', title: '专业英语', mockWeight: 5 },
  { key: 'method', title: '论文与案例方法', mockWeight: 0 },
]

export const ESSAY_DOMAIN = 'method'

export function domainTitle(key: string): string {
  return DOMAINS.find((domain) => domain.key === key)?.title ?? key
}
