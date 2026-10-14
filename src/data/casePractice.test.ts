import { describe, expect, it } from 'vitest'
import { casePractices } from './casePractice'
import { essayOutlines, OUTLINE_MINUTES } from './essayOutlines'
import { essayContents } from './essayContent'

const domains = new Set([
  'integration', 'scope', 'schedule', 'cost', 'quality', 'resource', 'communication',
  'risk', 'procurement', 'stakeholder', 'config-change', 'performance',
])
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
function reference(caseId: string, index: number): string {
  return casePractices.find((p) => p.id === caseId)!.questions[index].reference
}

describe('casePractice:', () => {
  it('20 套稳定唯一标识，题型配额 6/8/3/3', () => {
    expect(casePractices).toHaveLength(20)
    expect(new Set(casePractices.map((p) => p.id)).size).toBe(20)
    expect(casePractices.map((p) => p.id)).toEqual(Array.from({ length: 20 }, (_, i) => `cp-${String(i + 1).padStart(2, '0')}`))
    const counts = Object.fromEntries(['calc', 'fault', 'theory', 'mixed'].map((kind) =>
      [kind, casePractices.filter((p) => p.kind === kind).length]))
    expect(counts).toEqual({ calc: 6, fault: 8, theory: 3, mixed: 3 })
  })

  for (const practice of casePractices) {
    it(`${practice.id}：总分、采分点、材料与知识域符合交接约束`, () => {
      expect(practice.title.trim().length).toBeGreaterThan(0)
      expect(practice.questions.length).toBeGreaterThanOrEqual(3)
      expect(practice.questions.length).toBeLessThanOrEqual(4)
      expect(sum(practice.questions.map((q) => q.score))).toBe(25)
      expect(practice.minutes).toBeGreaterThanOrEqual(40)
      expect(practice.minutes).toBeLessThanOrEqual(50)
      expect(practice.domains.length).toBeGreaterThan(0)
      expect(practice.domains.every((key) => domains.has(key))).toBe(true)
      expect(new Set(practice.domains).size).toBe(practice.domains.length)
      expect(practice.background.length).toBeGreaterThan(0)
      expect(practice.background.every((text) => text.trim().length > 0)).toBe(true)
      expect(sum(practice.background.map((text) => text.length))).toBeGreaterThan(100)
      expect(new Set(practice.questions.map((q) => q.id)).size).toBe(practice.questions.length)
      const points = practice.questions.flatMap((q) => q.scoringPoints)
      expect(new Set(points.map((point) => point.id)).size).toBe(points.length)
      for (const q of practice.questions) {
        expect(q.id.startsWith(`${practice.id}-`)).toBe(true)
        expect(q.prompt.trim()).not.toBe('')
        expect(q.scoringPoints.length).toBeGreaterThan(0)
        expect(sum(q.scoringPoints.map((point) => point.score))).toBe(q.score)
        expect(q.reference.split('\n').length).toBe(q.scoringPoints.length)
        for (const point of q.scoringPoints) {
          expect(point.id.trim()).not.toBe('')
          expect(point.text.trim()).not.toBe('')
          expect(Number.isInteger(point.score) && point.score > 0).toBe(true)
          expect(q.reference).toContain(point.text)
        }
        if (practice.kind === 'fault') {
          expect(q.scoringPoints.length % 2).toBe(0)
          q.scoringPoints.forEach((point, i) => {
            expect(point.score).toBeLessThanOrEqual(2)
            expect(point.text.startsWith(i % 2 === 0 ? '问题：' : '措施：')).toBe(true)
          })
        }
      }
    })
  }

  it('EVM 预测数值按不同假设复算，不混用已舍入指数', () => {
    const [pv, ev, ac, bac] = [120, 100, 125, 250]
    expect(reference('cp-01', 0).replaceAll('−', '-')).toContain(`${(ev - ac).toFixed(2)} 万元`)
    expect(reference('cp-01', 0)).toContain(`${(ev / pv).toFixed(3)}`)
    expect(reference('cp-01', 1)).toContain(`${(bac / (ev / ac)).toFixed(2)} 万元`)
    expect(reference('cp-01', 1)).toContain(`${((bac - ev) / (bac - ac)).toFixed(3)}`)
    expect(reference('cp-01', 2)).toContain(`${(ac + (bac - ev) / ((ev / ac) * (ev / pv))).toFixed(2)} 万元`)
  })

  it('网络汇合处取最大最早时间，B 的自由浮动为零', () => {
    const efA = 4, efB = 3
    const esD = Math.max(efA, efB), efD = esD + 4, efC = efA + 5
    const esE = Math.max(efC, efD), finish = Math.max(esE + 6, efB + 2)
    expect(reference('cp-02', 0)).toContain(`${finish} 天`)
    expect(reference('cp-02', 1)).toContain(`D=${esD}/${efD}/${esE - 4}/${esE}`)
    const ffB = Math.min(esD, efB) - efB
    expect(ffB).toBe(0)
    expect(reference('cp-02', 2)).toContain('min(4,3)−3=0 天')
  })

  it('整天枚举验证最低赶工成本和两种最优方案', () => {
    const plans: { a: number; b: number; c: number; cost: number }[] = []
    for (let a = 0; a <= 2; a++) for (let b = 0; b <= 3; b++) for (let c = 0; c <= 2; c++) {
      if (Math.max(8 - a, 10 - b) + 4 - c <= 11) plans.push({ a, b, c, cost: 2 * a + b + 3 * c })
    }
    const minimum = Math.min(...plans.map((p) => p.cost))
    expect(minimum).toBe(5)
    expect(plans.filter((p) => p.cost === minimum)).toEqual([
      { a: 0, b: 2, c: 1, cost: 5 }, { a: 1, b: 3, c: 0, cost: 5 },
    ])
    expect(reference('cp-03', 1)).toContain('最低增量成本为 5 万元')
  })

  it('PERT、EMV、渠道数及综合案例的计算一致', () => {
    const mean = (2 + 4 * 5 + 8) / 6 + (3 + 4 * 6 + 15) / 6
    const variance = ((8 - 2) / 6) ** 2 + ((15 - 3) / 6) ** 2
    expect(reference('cp-04', 1)).toContain(`${(mean + 1.645 * Math.sqrt(variance)).toFixed(2)} 天`)
    expect(reference('cp-05', 0)).toContain(`=${0.9 * 100 + 0.1 * 10 - 30} 万元`)
    expect(reference('cp-05', 2)).toContain(`期望净改善为 8−5=${0.2 * 40 - (0.05 * 40 + 3)} 万元`)
    const channels = (n: number) => n * (n - 1) / 2
    expect(reference('cp-06', 0)).toContain(`=${channels(12) - channels(8)} 条`)
    expect(reference('cp-06', 1)).toContain(`总数 15+10+2+1=${channels(6) + channels(5) + 3} 条`)
    expect(reference('cp-18', 0)).toContain(`=${400 / (160 / 200)} 万元`)
    expect(reference('cp-19', 0)).toContain(`最早完工 ${4 + 3 + 2} 天`)
    expect(reference('cp-20', 1)).toContain(`${92 / 100 * 100}%`)
  })

  it('18 条提纲与既有论文章节一一对应，每条检查项唯一且 6—10 条', () => {
    expect(OUTLINE_MINUTES).toBe(15)
    expect(essayOutlines).toHaveLength(18)
    expect(new Set(essayOutlines.map((e) => e.essayId)).size).toBe(18)
    expect(essayOutlines.map((e) => e.essayId).sort()).toEqual(essayContents.map((e) => e.chapter).sort())
    for (const essay of essayOutlines) {
      expect(essay.checklist.length).toBeGreaterThanOrEqual(6)
      expect(essay.checklist.length).toBeLessThanOrEqual(10)
      expect(new Set(essay.checklist.map((item) => item.id)).size).toBe(essay.checklist.length)
      expect(essay.checklist.every((item) => item.id.trim() && item.text.trim())).toBe(true)
      for (const number of [1, 2, 3]) {
        expect(essay.prompt.some((text) => text.startsWith(`（${number}）`))).toBe(true)
        const body = essay.referenceOutline.find((text) => text.startsWith(`主体（${number}）`))!
        expect(body).toBeTruthy()
        expect(body).toContain('我')
        expect(body).toMatch(/\d+/)
      }
      expect(essay.referenceOutline.some((text) => text.startsWith('摘要要点'))).toBe(true)
      expect(essay.referenceOutline.some((text) => text.startsWith('背景'))).toBe(true)
      expect(essay.referenceOutline.some((text) => text.startsWith('结尾'))).toBe(true)
    }
  })

  it('用户可见内容不含受限措辞或官方原题声明', () => {
    expect(JSON.stringify([casePractices, essayOutlines])).not.toMatch(/演示|示例数据|测试题|官方真题原题/)
  })
})
