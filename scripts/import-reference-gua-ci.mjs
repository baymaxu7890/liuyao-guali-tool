import fs from 'node:fs'
import path from 'node:path'

const bundlePath = process.argv[2]
const outputPath = process.argv[3] ?? path.resolve('src/data/guaCiData.ts')

if (!bundlePath) {
  console.error('Usage: node scripts/import-reference-gua-ci.mjs <reference-bundle.js> [output.ts]')
  process.exit(1)
}

const source = fs.readFileSync(path.resolve(bundlePath), 'utf8')
const exportMarker = 'u.exports=[{name:"\\u4e7e",wuXing:'
const markerIndex = source.indexOf(exportMarker)

if (markerIndex < 0) {
  throw new Error('未在参考 bundle 中找到以乾宫开头的六十四卦数据。')
}

const arrayStart = markerIndex + 'u.exports='.length

function extractArrayExpression(text, start) {
  let depth = 0
  let quote = ''
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
    } else if (char === '[') {
      depth += 1
    } else if (char === ']') {
      depth -= 1
      if (depth === 0) return text.slice(start, index + 1)
    }
  }

  throw new Error('六十四卦数据数组不完整。')
}

const arrayExpression = extractArrayExpression(source, arrayStart)
const palaces = Function(`"use strict"; return (${arrayExpression})`)()
const hexagrams = palaces.flatMap((palace) => palace.children ?? [])
const canonicalNames = new Map([
  ['风天小蓄', '风天小畜'],
  ['山天大蓄', '山天大畜'],
])

if (palaces.length !== 8 || hexagrams.length !== 64) {
  throw new Error(`参考数据数量异常：${palaces.length} 宫、${hexagrams.length} 卦。`)
}

const names = new Set()
for (const item of hexagrams) {
  item.fullName = canonicalNames.get(item.fullName) ?? item.fullName
  if (!item.fullName || typeof item.guaCi !== 'string' || !Array.isArray(item.yaoCi)) {
    throw new Error(`参考卦辞结构异常：${JSON.stringify(item)}`)
  }
  if (names.has(item.fullName)) throw new Error(`发现重复卦名：${item.fullName}`)
  if (item.yaoCi.length < 6) throw new Error(`${item.fullName} 的爻辞不足六条。`)
  names.add(item.fullName)
}

const lines = [
  '/**',
  ' * 六十四卦卦辞、彖传、象传及爻辞。',
  ' * 古籍正文来自 likeSo/liu-yao 公开构建中的六十四卦数据；仅迁移公版古籍文本，未复制其程序代码。',
  ' * 来源：https://github.com/likeSo/liu-yao',
  ' * 本文件由 scripts/import-reference-gua-ci.mjs 生成。',
  ' */',
  '',
  'export interface GuaCiItem {',
  '  guaci: string',
  '  yaoci: string[]',
  '}',
  '',
  "export const HEXAGRAM_TEXT_SOURCE = 'https://github.com/likeSo/liu-yao'", 
  '',
  'export const HEXAGRAM_TEXTS: Record<string, GuaCiItem> = {',
]

for (const item of hexagrams) {
  lines.push(`  ${JSON.stringify(item.fullName)}: {`)
  lines.push(`    guaci: ${JSON.stringify(item.guaCi)},`)
  lines.push('    yaoci: [')
  for (const yaoCi of item.yaoCi) lines.push(`      ${JSON.stringify(yaoCi)},`)
  lines.push('    ],')
  lines.push('  },')
}

lines.push('}')
lines.push('')

fs.writeFileSync(path.resolve(outputPath), `${lines.join('\n')}\n`, 'utf8')
console.log(`Imported ${hexagrams.length} hexagrams into ${path.resolve(outputPath)}`)
