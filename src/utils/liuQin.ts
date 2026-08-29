import type { Yao } from '@/types'
import { LIUSHEN } from '@/types/gua'

// === 1. 五行映射 ===
const WUXING_MAP: Record<string, string> = {
  '亥': '水', '子': '水',
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '辰': '土', '戌': '土', '丑': '土', '未': '土'
}

// === 2. 宫位五行 (定宫) ===
const PALACE_WUXING: Record<string, string> = {
  '乾宫': '金', '兑宫': '金',
  '离宫': '火',
  '震宫': '木', '巽宫': '木',
  '坎宫': '水',
  '艮宫': '土', '坤宫': '土'
}

// === 3. 八卦纳支表 (Ground Truth) ===
// 键值说明：1=阳爻, 2=阴爻。顺序：[初爻, 二爻, 三爻]
// 数据来源：用户指令表格
const NAJIA_TABLE: Record<string, { inner: string[], outer: string[] }> = {
  // 乾 (☰ 111) -> 内: 子寅辰, 外: 午申戌
  '1,1,1': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  
  // 兑 (☱ 112) -> 内: 巳卯丑, 外: 亥酉未 (注意：代码是从下往上，兑是上缺，即阳阳阴)
  // 修正：兑卦画是 ☱ (下阳,中阳,上阴) -> [1,1,2]
  '1,1,2': { inner: ['巳', '卯', '丑'], outer: ['亥', '酉', '未'] },
  
  // 离 (☲ 121) -> 内: 卯丑亥, 外: 酉未巳
  '1,2,1': { inner: ['卯', '丑', '亥'], outer: ['酉', '未', '巳'] },
  
  // 震 (☳ 122) -> 内: 子寅辰, 外: 午申戌
  '1,2,2': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  
  // 巽 (☴ 211) -> 内: 丑亥酉, 外: 未巳卯
  '2,1,1': { inner: ['丑', '亥', '酉'], outer: ['未', '巳', '卯'] },
  
  // 坎 (☵ 212) -> 内: 寅辰午, 外: 申戌子
  '2,1,2': { inner: ['寅', '辰', '午'], outer: ['申', '戌', '子'] },
  
  // 艮 (☶ 221) -> 内: 辰午申, 外: 戌子寅
  '2,2,1': { inner: ['辰', '午', '申'], outer: ['戌', '子', '寅'] },
  
  // 坤 (☷ 222) -> 内: 未巳卯, 外: 丑亥酉
  '2,2,2': { inner: ['未', '巳', '卯'], outer: ['丑', '亥', '酉'] }
}

// === 4. 六亲生克逻辑 ===
// 参数: lineWx (爻五行), palaceWx (宫五行)
function getRelation(lineWx: string, palaceWx: string): string {
  if (lineWx === palaceWx) return '兄弟'
  
  // 生我者父母
  if ((lineWx === '金' && palaceWx === '水') ||
      (lineWx === '水' && palaceWx === '木') ||
      (lineWx === '木' && palaceWx === '火') ||
      (lineWx === '火' && palaceWx === '土') ||
      (lineWx === '土' && palaceWx === '金')) return '父母'
      
  // 我生者子孙
  if ((palaceWx === '金' && lineWx === '水') ||
      (palaceWx === '水' && lineWx === '木') ||
      (palaceWx === '木' && lineWx === '火') ||
      (palaceWx === '火' && lineWx === '土') ||
      (palaceWx === '土' && lineWx === '金')) return '子孙'
      
  // 克我者官鬼
  if ((lineWx === '金' && palaceWx === '木') ||
      (lineWx === '木' && palaceWx === '土') ||
      (lineWx === '土' && palaceWx === '水') ||
      (lineWx === '水' && palaceWx === '火') ||
      (lineWx === '火' && palaceWx === '金')) return '官鬼'
      
  // 我克者妻财
  if ((palaceWx === '金' && lineWx === '木') ||
      (palaceWx === '木' && lineWx === '土') ||
      (palaceWx === '土' && lineWx === '水') ||
      (palaceWx === '水' && lineWx === '火') ||
      (palaceWx === '火' && lineWx === '金')) return '妻财'
      
  return '兄弟' // 兜底
}

/**
 * 计算六亲与纳甲
 * @param guaCode 全卦6爻代码 [初, 二, 三, 四, 五, 上] (1=阳, 2=阴)
 * @param palaceName 宫名 (如 '乾宫'), 用于定"我"
 */
export function calculateLiuQin(guaCode: number[], palaceName: string): Yao[] {
  const result: Yao[] = []

  // 1. 获取宫位五行 (我)
  const palaceWx = PALACE_WUXING[palaceName]
  if (!palaceWx) {
    console.error('Invalid palace name:', palaceName)
    throw new Error(`宫位数据错误: ${palaceName}`)
  }

  // 2. 拆分内外卦，标准化代码 (确保输入只有1和2，外部3/0已转1/2)
  // code: [初, 二, 三, 四, 五, 上]
  const innerCode = [guaCode[0], guaCode[1], guaCode[2]]
  const outerCode = [guaCode[3], guaCode[4], guaCode[5]]
  
  const innerKey = innerCode.join(',')
  const outerKey = outerCode.join(',')

  // 3. 查表纳支
  const innerBranches = NAJIA_TABLE[innerKey]?.inner
  const outerBranches = NAJIA_TABLE[outerKey]?.outer

  if (!innerBranches || !outerBranches) {
    console.error('GuaCode:', guaCode, 'InnerKey:', innerKey, 'OuterKey:', outerKey)
    throw new Error('卦象代码无法匹配纳甲表')
  }

  const allBranches = [...innerBranches, ...outerBranches]

  // 4. 逐爻计算六亲
  for (let i = 0; i < 6; i++) {
    const position = i + 1
    const dizhi = allBranches[i]
    const wuxing = WUXING_MAP[dizhi]
    const liuqin = getRelation(wuxing, palaceWx)

    result.push({
      position,
      type: guaCode[i] as 1 | 2 | 3 | 4,
      liuqin,
      dizhi,
      liushen: '', // 六神在外部计算
      isShi: false,
      isYing: false
    })
  }

  return result
}

// 六神计算保持不变
export function calculateLiuShen(dayGan: string): string[] {
  if (!dayGan) return [...LIUSHEN]
  
  let startIdx = 0
  if (dayGan === '甲' || dayGan === '乙') startIdx = 0 // 青龙
  else if (dayGan === '丙' || dayGan === '丁') startIdx = 1 // 朱雀
  else if (dayGan === '戊') startIdx = 2 // 勾陈
  else if (dayGan === '己') startIdx = 3 // 螣蛇
  else if (dayGan === '庚' || dayGan === '辛') startIdx = 4 // 白虎
  else if (dayGan === '壬' || dayGan === '癸') startIdx = 5 // 玄武
  
  const result: string[] = []
  for (let i = 0; i < 6; i++) {
    result.push(LIUSHEN[(startIdx + i) % 6])
  }
  return result
}