import assert from 'node:assert/strict'
import { build } from 'esbuild'

const entrySource = `
  export { calculateGanZhi, getFiveTigerMonthPillars, getFiveRatHourPillars } from './src/utils/ganZhi.ts'
  export { parseGuaLiText } from './src/utils/textParser.ts'
  export { categoryToFilterTag } from './src/utils/category.ts'
  export { normalizeGuaLi, extractBackupRecords, CURRENT_GUALI_SCHEMA_VERSION, GUALI_BACKUP_FORMAT } from './src/utils/guaLiData.ts'
  export { useGuaPan } from './src/composables/useGuaPan.ts'
  export { GUA64 } from './src/types/gua.ts'
  export { HEXAGRAM_TEXTS } from './src/data/guaCiData.ts'
`

const bundled = await build({
  stdin: {
    contents: entrySource,
    resolveDir: process.cwd(),
    sourcefile: 'domain-verification-entry.ts',
    loader: 'ts'
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  tsconfig: 'tsconfig.json',
  write: false,
  logLevel: 'silent'
})

const code = bundled.outputFiles[0].text
const domain = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const boundary = domain.calculateGanZhi(new Date(2026, 1, 10, 12, 0))
assert.equal(boundary.year, '丙午年', '立春后应切换为丙午年')
assert.equal(boundary.month, '庚寅月', '寅月应按节气精确换月')

const lateZi = domain.calculateGanZhi(new Date(2026, 7, 28, 23, 30), { lateZiDayBoundary: true })
const nextDay = domain.calculateGanZhi(new Date(2026, 7, 29, 0, 30))
assert.equal(lateZi.day, nextDay.day, '晚子时日柱应与下一日一致')

assert.deepEqual(
  domain.getFiveTigerMonthPillars('甲子'),
  ['丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉', '甲戌', '乙亥', '丙子', '丁丑'],
  '甲己年应以丙寅月起五虎遁'
)
assert.deepEqual(
  domain.getFiveRatHourPillars('辛未'),
  ['戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳', '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥'],
  '丙辛日应以戊子时起五鼠遁'
)

assert.equal(domain.categoryToFilterTag('工作/事业'), '事业')
assert.equal(domain.categoryToFilterTag('男问桃花/姻缘'), '感情')

const sourceTime = new Date(2026, 7, 28, 18, 25)
const { castGua, generateGuaText } = domain.useGuaPan()
const original = castGua(1, 2, 3, 0, 1, 2, sourceTime, '测试：保留冒号')
assert.ok(original)
original.category = '工作/事业'
original.gender = '女'
original.tags = ['事业']
original.duangua = '第一行笔记\n第二行笔记'

const copiedText = generateGuaText(original, { withHidden: true, withAllBian: true, withPosition: true })
const parsed = domain.parseGuaLiText(copiedText)
assert.ok(parsed, '复制文本应能重新导入')
assert.equal(parsed.reason, original.reason)
assert.equal(parsed.time.getHours(), 18)
assert.equal(parsed.time.getMinutes(), 25)
assert.equal(parsed.category, original.category)
assert.equal(parsed.gender, original.gender)
assert.equal(parsed.duangua, original.duangua)

const imported = castGua(...parsed._tempCode, parsed.time, parsed.reason)
assert.ok(imported)
assert.equal(imported.benGua.name, original.benGua.name)
assert.equal(imported.bianGua?.name, original.bianGua?.name)
assert.deepEqual(imported.dongYaoList, original.dongYaoList)

const legacy = JSON.parse(JSON.stringify(original))
delete legacy.moduleType
delete legacy.schemaVersion
legacy.tags = []
const normalized = domain.normalizeGuaLi(legacy)
assert.ok(normalized)
assert.equal(normalized.moduleType, 'liuyao')
assert.equal(normalized.schemaVersion, domain.CURRENT_GUALI_SCHEMA_VERSION)
assert.ok(normalized.time instanceof Date)
assert.ok(normalized.tags.includes('事业'))

const envelope = {
  format: domain.GUALI_BACKUP_FORMAT,
  version: domain.CURRENT_GUALI_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  records: [legacy]
}
assert.equal(domain.extractBackupRecords(envelope)?.length, 1)
assert.equal(domain.extractBackupRecords([legacy])?.length, 1, '应兼容旧版数组备份')

const guaCiNames = Object.keys(domain.HEXAGRAM_TEXTS)
const guaNames = domain.GUA64.map((item) => item.name)
assert.equal(guaCiNames.length, 64, '卦辞库应完整覆盖六十四卦')
assert.deepEqual(new Set(guaCiNames), new Set(guaNames), '卦辞库名称应与排盘卦名完全一致')

for (const name of guaNames) {
  const text = domain.HEXAGRAM_TEXTS[name]
  assert.ok(text.guaci.includes('彖传：'), `${name} 应包含彖传`)
  assert.ok(text.guaci.includes('象传：'), `${name} 应包含大象传`)
  assert.ok(text.yaoci.length >= 6, `${name} 应至少包含六条爻辞`)
  assert.ok(text.yaoci.slice(0, 6).every((line) => line.includes('象传：')), `${name} 的六爻应包含小象传`)
}

assert.equal(domain.HEXAGRAM_TEXTS['乾为天'].yaoci.length, 7, '乾卦应收录用九')
assert.equal(domain.HEXAGRAM_TEXTS['坤为地'].yaoci.length, 7, '坤卦应收录用六')
assert.ok(domain.HEXAGRAM_TEXTS['水天需'].guaci.includes('刚健而不陷，其义不困穷矣'), '水天需应收录完整彖传')
assert.ok(domain.HEXAGRAM_TEXTS['水天需'].yaoci[5].includes('虽不当位，未大失也'), '水天需上六应收录完整小象传')
assert.ok(domain.HEXAGRAM_TEXTS['地天泰'].guaci.includes('君子道长，小人道消也'), '地天泰应收录完整彖传')
assert.ok(domain.HEXAGRAM_TEXTS['地天泰'].yaoci[5].includes('其命乱也'), '地天泰上六应收录完整小象传')

console.log('Domain verification passed: calendar, late-zi, category, text round-trip, migration, backup, 64 hexagram texts.')
