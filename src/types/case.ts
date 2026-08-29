export type ModuleType = 'liuyao' | 'calendar' | 'meihua' | 'bazi' | 'qimen'

/** 所有术数案例共用的外层字段；各模块把自己的盘面放在独立数据结构中。 */
export interface CaseRecordBase {
  id: string
  moduleType: ModuleType
  schemaVersion: number
  timestamp: number
  reason: string
  category?: string
  gender?: string
  duangua?: string
  tags: string[]
}
