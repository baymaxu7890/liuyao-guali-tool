export interface ParsedGuaLiText {
  reason: string
  time: Date
  gender: string
  category: string
  tags: string[]
  duangua: string
  _tempCode: number[]
}

const valueAfterLabel = (line: string): string => line.replace(/^[^:：]+[:：]\s*/, '').trim()
const liuShenNames = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']

const parseYaoType = (line: string): number | null => {
  if (/[Oo⭕]/.test(line)) return 3
  if (/[Xx❌]/.test(line)) return 4
  // 本项目复制格式：单引号为阳爻，双引号为阴爻。
  if (/['’‘]/.test(line)) return 1
  if (/["”“]/.test(line)) return 2
  return null
}

export function parseGuaLiText(text: string): ParsedGuaLiText | null {
  try {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    let reason = '未命名导入卦例'
    let time = new Date()
    let category = ''
    let gender = ''
    const tags: string[] = []
    const noteLines: string[] = []
    const codes: number[] = []
    let inNotes = false

    const personMatch = text.match(/(?:问卦人|求测人|用户)[\s:：]+(\S+)/)
    if (personMatch) tags.push(personMatch[1])
    const sourceMatch = text.match(/(?:来源|来源于)[\s:：]+(\S+)/)
    if (sourceMatch) tags.push(sourceMatch[1])

    for (const line of lines) {
      const noteHeader = line.match(/^(?:断语|断卦记录|笔记|分析|反馈)\s*[:：]?\s*(.*)$/)
      if (noteHeader) {
        inNotes = true
        if (noteHeader[1]) noteLines.push(noteHeader[1])
        continue
      }
      if (inNotes) {
        noteLines.push(line)
        continue
      }

      if (/^(?:占问事项|问念|问题|求测)[:：]/.test(line)) {
        reason = valueAfterLabel(line)
        continue
      }
      if (/^(?:起卦时间|时间)[:：]/.test(line)) {
        const rawTime = valueAfterLabel(line)
        const normalizedTime = rawTime
          .replace(/(\d{4})年(\d{1,2})月(\d{1,2})日/, '$1/$2/$3')
          .replace(/周[日一二三四五六]/, '')
          .trim()
        const parsedDate = new Date(normalizedTime)
        if (!Number.isNaN(parsedDate.getTime())) time = parsedDate
        continue
      }
      if (/^分类[:：]/.test(line)) {
        const value = valueAfterLabel(line)
        if (value && value !== '无') category = value
        continue
      }
      if (/^(?:性别|求测人性别)[:：]/.test(line)) {
        const value = valueAfterLabel(line)
        if (value.includes('女')) gender = '女'
        else if (value.includes('男')) gender = '男'
        continue
      }
      if (/^标签[:：]/.test(line)) {
        valueAfterLabel(line).split(/[，,、\s]+/).filter(Boolean).forEach(tag => tags.push(tag))
        continue
      }

      if (codes.length < 6) {
        const hasLiuShen = liuShenNames.some(name => line.includes(name))
        const type = parseYaoType(line)
        if (type !== null && (hasLiuShen || /(?:上|五|四|三|二|初)爻/.test(line))) {
          codes.push(type)
          continue
        }
      }

      // 兼容没有“断语”标题、但采用编号书写的分析文本。
      if (codes.length === 6 && /^(?:\d+[、.]|结论[:：])/.test(line)) noteLines.push(line)
    }

    if (codes.length !== 6) return null

    return {
      reason,
      time,
      gender: gender || '男',
      category,
      tags: [...new Set(tags)],
      duangua: noteLines.join('\n'),
      _tempCode: codes.reverse()
    }
  } catch (error) {
    console.error('解析文本失败', error)
    return null
  }
}
