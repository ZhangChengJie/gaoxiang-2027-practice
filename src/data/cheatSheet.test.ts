import { describe, expect, it } from 'vitest'
import { CORE_FORMULAS, ITTO_49, KNOWLEDGE_AREAS, MUST_KNOW_NUMBERS, PROCESS_GROUPS } from './cheatSheet'
import { DEFAULT_PROJECT_PROFILES, SAMPLE_ESSAYS } from './essayModels'

describe('cheatSheet & essayModels:', () => {
  it('ITTO 完整覆盖第 4 版 49 过程、5 大过程组与 10 大知识域', () => {
    expect(ITTO_49).toHaveLength(49)
    expect(new Set(ITTO_49.map((p) => p.id)).size).toBe(49)
    expect(new Set(ITTO_49.map((p) => p.name)).size).toBe(49)
    for (const g of PROCESS_GROUPS) {
      expect(ITTO_49.some((p) => p.group === g), g).toBe(true)
    }
    for (const area of KNOWLEDGE_AREAS) {
      expect(ITTO_49.some((p) => p.area === area), area).toBe(true)
    }
    // 校验五大过程组标准数量：启动 2、规划 24、执行 10、监控 12、收尾 1
    expect(ITTO_49.filter((p) => p.group === '启动')).toHaveLength(2)
    expect(ITTO_49.filter((p) => p.group === '规划')).toHaveLength(24)
    expect(ITTO_49.filter((p) => p.group === '执行')).toHaveLength(10)
    expect(ITTO_49.filter((p) => p.group === '监控')).toHaveLength(12)
    expect(ITTO_49.filter((p) => p.group === '收尾')).toHaveLength(1)
  })

  it('核心公式 25 条与必背数字/陷阱非空完整', () => {
    expect(CORE_FORMULAS).toHaveLength(25)
    expect(MUST_KNOW_NUMBERS.length).toBeGreaterThanOrEqual(12)
    expect(CORE_FORMULAS.every((f) => f.name && f.formula && f.note)).toBe(true)
  })

  it('项目事实库内置 2 套模板，高分范文 4 篇结构完整且含第一人称与数字', () => {
    expect(DEFAULT_PROJECT_PROFILES).toHaveLength(2)
    expect(SAMPLE_ESSAYS).toHaveLength(4)
    for (const essay of SAMPLE_ESSAYS) {
      expect(essay.sections.length).toBeGreaterThanOrEqual(4)
      const fullText = essay.sections.flatMap((s) => s.paragraphs).join('')
      expect(fullText).toContain('我')
      expect(fullText).toMatch(/\d+/)
    }
  })
})
