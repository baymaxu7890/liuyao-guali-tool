// src/types/index.ts
import type { CaseRecordBase } from './case'
export type { CaseRecordBase, ModuleType } from './case'

export type YaoType = 1 | 2 | 3 | 4 
export type GuaType = '六冲卦' | '六合卦' | '一世卦' | '二世卦' | '三世卦' | '四世卦' | '五世卦' | '游魂卦' | '归魂卦'

export interface Yao {
  position: number
  type: YaoType
  liuqin: string
  dizhi: string
  liushen: string
  isShi?: boolean
  isYing?: boolean
  tags?: string[]
}

export interface Gua {
  name: string
  // 允许只读数组
  code: readonly [number, number, number, number, number, number] | number[]
  palace: string
  type: GuaType
  yaos?: Yao[] 
}

export interface ShenSha {
  [key: string]: string
}

// 新增：藏爻单行结构
export interface CangYaoItem {
  liuqin: string
  dizhi: string
  isFu: boolean    // 是否为伏神（本卦没出现的五行）
  show: boolean    // 是否显示（根据内外卦相同原则）
}

export interface GuaLi extends CaseRecordBase {
  time: Date
  benGua: Gua & { yaos: Yao[] } 
  bianGua?: Gua & { yaos: Yao[] }
  dongYaoList: number[]
  xunkong: string
  shensha: ShenSha
  bazi: string
  shenshaList: string[]
  hiddenYaos: any[] // 旧的伏神列表，保留以兼容
  cangYaoList: (CangYaoItem | null)[] // 新增：每爻对应的藏爻数据
}
