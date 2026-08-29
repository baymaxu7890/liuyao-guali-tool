// src/types/gua.ts
/**
 * 完整的六十四卦数据
 * code顺序: [初爻, 二爻, 三爻, 四爻, 五爻, 上爻] (1=阳, 2=阴)
 */
export const GUA64 = [
  // === 乾宫八卦 (金) ===
  { name: '乾为天', code: [1,1,1, 1,1,1], palace: '乾宫', type: '本位卦·六冲' },
  { name: '天风姤', code: [2,1,1, 1,1,1], palace: '乾宫', type: '一世卦' },
  { name: '天山遁', code: [2,2,1, 1,1,1], palace: '乾宫', type: '二世卦' },
  { name: '天地否', code: [2,2,2, 1,1,1], palace: '乾宫', type: '三世卦·六合' },
  { name: '风地观', code: [2,2,2, 2,1,1], palace: '乾宫', type: '四世卦' },
  { name: '山地剥', code: [2,2,2, 2,2,1], palace: '乾宫', type: '五世卦' },
  { name: '火地晋', code: [2,2,2, 1,2,1], palace: '乾宫', type: '游魂卦' },
  { name: '火天大有', code: [1,1,1, 1,2,1], palace: '乾宫', type: '归魂卦' },

  // === 坎宫八卦 (水) ===
  { name: '坎为水', code: [2,1,2, 2,1,2], palace: '坎宫', type: '本位卦·六冲' },
  { name: '水泽节', code: [1,1,2, 2,1,2], palace: '坎宫', type: '一世卦·六合' },
  { name: '水雷屯', code: [1,2,2, 2,1,2], palace: '坎宫', type: '二世卦' },
  { name: '水火既济', code: [1,2,1, 2,1,2], palace: '坎宫', type: '三世卦' },
  { name: '泽火革', code: [1,2,1, 1,1,2], palace: '坎宫', type: '四世卦' },
  { name: '雷火丰', code: [1,2,1, 1,2,2], palace: '坎宫', type: '五世卦' },
  { name: '地火明夷', code: [1,2,1, 2,2,2], palace: '坎宫', type: '游魂卦' },
  { name: '地水师', code: [2,1,2, 2,2,2], palace: '坎宫', type: '归魂卦' },

  // === 艮宫八卦 (土) ===
  { name: '艮为山', code: [2,2,1, 2,2,1], palace: '艮宫', type: '本位卦·六冲' },
  { name: '山火贲', code: [1,2,1, 2,2,1], palace: '艮宫', type: '一世卦·六合' },
  { name: '山天大畜', code: [1,1,1, 2,2,1], palace: '艮宫', type: '二世卦' },
  { name: '山泽损', code: [1,1,2, 2,2,1], palace: '艮宫', type: '三世卦' },
  { name: '火泽睽', code: [1,1,2, 1,2,1], palace: '艮宫', type: '四世卦' },
  { name: '天泽履', code: [1,1,2, 1,1,1], palace: '艮宫', type: '五世卦' },
  { name: '风泽中孚', code: [1,1,2, 2,1,1], palace: '艮宫', type: '游魂卦' },
  { name: '风山渐', code: [2,2,1, 2,1,1], palace: '艮宫', type: '归魂卦' },

  // === 震宫八卦 (木) ===
  { name: '震为雷', code: [1,2,2, 1,2,2], palace: '震宫', type: '本位卦·六冲' },
  { name: '雷地豫', code: [2,2,2, 1,2,2], palace: '震宫', type: '一世卦·六合' },
  { name: '雷水解', code: [2,1,2, 1,2,2], palace: '震宫', type: '二世卦' },
  { name: '雷风恒', code: [2,1,1, 1,2,2], palace: '震宫', type: '三世卦' },
  { name: '地风升', code: [2,1,1, 2,2,2], palace: '震宫', type: '四世卦' },
  { name: '水风井', code: [2,1,1, 2,1,2], palace: '震宫', type: '五世卦' },
  { name: '泽风大过', code: [2,1,1, 1,1,2], palace: '震宫', type: '游魂卦' },
  { name: '泽雷随', code: [1,2,2, 1,1,2], palace: '震宫', type: '归魂卦' },

  // === 巽宫八卦 (木) ===
  { name: '巽为风', code: [2,1,1, 2,1,1], palace: '巽宫', type: '本位卦·六冲' },
  { name: '风天小畜', code: [1,1,1, 2,1,1], palace: '巽宫', type: '一世卦' },
  { name: '风火家人', code: [1,2,1, 2,1,1], palace: '巽宫', type: '二世卦' },
  { name: '风雷益', code: [1,2,2, 2,1,1], palace: '巽宫', type: '三世卦' },
  { name: '天雷无妄', code: [1,2,2, 1,1,1], palace: '巽宫', type: '四世卦·六冲' },
  { name: '火雷噬嗑', code: [1,2,2, 1,2,1], palace: '巽宫', type: '五世卦' },
  { name: '山雷颐', code: [1,2,2, 2,2,1], palace: '巽宫', type: '游魂卦' },
  { name: '山风蛊', code: [2,1,1, 2,2,1], palace: '巽宫', type: '归魂卦' },

  // === 离宫八卦 (火) ===
  { name: '离为火', code: [1,2,1, 1,2,1], palace: '离宫', type: '本位卦·六冲' },
  { name: '火山旅', code: [2,2,1, 1,2,1], palace: '离宫', type: '一世卦·六合' },
  { name: '火风鼎', code: [2,1,1, 1,2,1], palace: '离宫', type: '二世卦' },
  { name: '火水未济', code: [2,1,2, 1,2,1], palace: '离宫', type: '三世卦' },
  { name: '山水蒙', code: [2,1,2, 2,2,1], palace: '离宫', type: '四世卦' },
  { name: '风水涣', code: [2,1,2, 2,1,1], palace: '离宫', type: '五世卦' },
  { name: '天水讼', code: [2,1,2, 1,1,1], palace: '离宫', type: '游魂卦' },
  { name: '天火同人', code: [1,2,1, 1,1,1], palace: '离宫', type: '归魂卦' },

  // === 坤宫八卦 (土) ===
  { name: '坤为地', code: [2,2,2, 2,2,2], palace: '坤宫', type: '本位卦·六冲' },
  { name: '地雷复', code: [1,2,2, 2,2,2], palace: '坤宫', type: '一世卦·六合' },
  { name: '地泽临', code: [1,1,2, 2,2,2], palace: '坤宫', type: '二世卦' },
  { name: '地天泰', code: [1,1,1, 2,2,2], palace: '坤宫', type: '三世卦·六合' },
  { name: '雷天大壮', code: [1,1,1, 1,2,2], palace: '坤宫', type: '四世卦·六冲' },
  { name: '泽天夬', code: [1,1,1, 1,1,2], palace: '坤宫', type: '五世卦' },
  { name: '水天需', code: [1,1,1, 2,1,2], palace: '坤宫', type: '游魂卦' },
  { name: '水地比', code: [2,2,2, 2,1,2], palace: '坤宫', type: '归魂卦' },

  // === 兑宫八卦 (金) ===
  { name: '兑为泽', code: [1,1,2, 1,1,2], palace: '兑宫', type: '本位卦·六冲' },
  { name: '泽水困', code: [2,1,2, 1,1,2], palace: '兑宫', type: '一世卦·六合' },
  { name: '泽地萃', code: [2,2,2, 1,1,2], palace: '兑宫', type: '二世卦' },
  { name: '泽山咸', code: [2,2,1, 1,1,2], palace: '兑宫', type: '三世卦' },
  { name: '水山蹇', code: [2,2,1, 2,1,2], palace: '兑宫', type: '四世卦' },
  { name: '地山谦', code: [2,2,1, 2,2,2], palace: '兑宫', type: '五世卦' },
  { name: '雷山小过', code: [2,2,1, 1,2,2], palace: '兑宫', type: '游魂卦' },
  { name: '雷泽归妹', code: [1,1,2, 1,2,2], palace: '兑宫', type: '归魂卦' }
] as const

// 基础常量
export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
export const LIUQIN = ['兄弟', '子孙', '妻财', '官鬼', '父母'] as const
export const LIUSHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'] as const
export const TAGS = ['财运', '感情', '事业', '健康', '学业', '其他'] as const

/**
 * 世应位置表 
 * 注意：这里的 key 必须涵盖上面 GUA64 中定义的所有 type 字符串
 */
const COMMON_SHI_POS: Record<string, number> = {
  '本位卦·六冲': 6,
  '六冲卦': 6,
  '一世卦': 1,
  '一世卦·六合': 1,
  '二世卦': 2,
  '三世卦': 3,
  '三世卦·六合': 3,
  '四世卦': 4,
  '四世卦·六冲': 4,
  '五世卦': 5,
  '游魂卦': 4,
  '归魂卦': 3
}

export const SHIYING_POS: Record<string, Record<string, number>> = {
  '乾宫': COMMON_SHI_POS,
  '兑宫': COMMON_SHI_POS,
  '离宫': COMMON_SHI_POS,
  '震宫': COMMON_SHI_POS,
  '巽宫': COMMON_SHI_POS,
  '坎宫': COMMON_SHI_POS,
  '艮宫': COMMON_SHI_POS,
  '坤宫': COMMON_SHI_POS
}

// 宫位藏爻表（顺序：初爻 -> 上爻）
export const PALACE_CANG_YAO: Record<string, string[]> = {
  '乾宫': ['子孙子水', '妻财寅木', '父母辰土', '官鬼午火', '兄弟申金', '父母戌土'],
  '兑宫': ['官鬼巳火', '妻财卯木', '父母丑土', '子孙亥水', '兄弟酉金', '父母未土'],
  '离宫': ['子孙卯木', '父母丑土', '官鬼亥水', '妻财酉金', '子孙未土', '兄弟巳火'],
  '震宫': ['兄弟子水', '子孙寅木', '兄弟辰土', '父母午火', '官鬼申金', '妻财戌土'],
  '巽宫': ['妻财丑土', '父母亥水', '官鬼酉金', '妻财未土', '子孙巳火', '兄弟卯木'],
  '坎宫': ['父母寅木', '官鬼辰土', '妻财午火', '兄弟申金', '父母戌土', '官鬼子水'],
  '艮宫': ['兄弟辰土', '父母午火', '兄弟申金', '妻财戌土', '官鬼子水', '父母寅木'],
  '坤宫': ['兄弟未土', '父母巳火', '官鬼卯木', '兄弟丑土', '妻财亥水', '子孙酉金']
}