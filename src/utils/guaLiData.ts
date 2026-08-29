import type { GuaLi, Yao } from '@/types'
import { categoryToFilterTag } from './category'

export const CURRENT_GUALI_SCHEMA_VERSION = 2
export const GUALI_BACKUP_FORMAT = 'liuyao-guali-backup'

export interface GuaLiBackup {
  format: typeof GUALI_BACKUP_FORMAT
  version: number
  exportedAt: string
  records: GuaLi[]
  geJueList?: unknown[]
}

const normalizeYao = (yao: any): Yao => ({
  ...yao,
  tags: Array.isArray(yao?.tags) ? yao.tags : []
})

export const normalizeGuaLi = (raw: any): GuaLi | null => {
  if (!raw || typeof raw !== 'object' || !raw.id || !raw.benGua || !Array.isArray(raw.benGua.yaos)) {
    return null
  }

  const parsedTime = raw.time instanceof Date ? raw.time : new Date(raw.time || raw.timestamp)
  if (Number.isNaN(parsedTime.getTime())) return null

  const tags = Array.isArray(raw.tags) ? raw.tags.filter((tag: unknown) => typeof tag === 'string') : []
  const categoryTag = categoryToFilterTag(raw.category)
  if (categoryTag && !tags.includes(categoryTag)) tags.push(categoryTag)

  return {
    ...raw,
    id: String(raw.id),
    moduleType: 'liuyao',
    schemaVersion: CURRENT_GUALI_SCHEMA_VERSION,
    timestamp: Number.isFinite(Number(raw.timestamp)) ? Number(raw.timestamp) : parsedTime.getTime(),
    reason: typeof raw.reason === 'string' ? raw.reason : '未命名卦例',
    time: parsedTime,
    tags: [...new Set(tags)],
    duangua: typeof raw.duangua === 'string' ? raw.duangua : '',
    dongYaoList: Array.isArray(raw.dongYaoList) ? raw.dongYaoList : [],
    shensha: raw.shensha && typeof raw.shensha === 'object' ? raw.shensha : {},
    shenshaList: Array.isArray(raw.shenshaList) ? raw.shenshaList : [],
    hiddenYaos: Array.isArray(raw.hiddenYaos) ? raw.hiddenYaos : [],
    cangYaoList: Array.isArray(raw.cangYaoList) ? raw.cangYaoList : Array(6).fill(null),
    benGua: { ...raw.benGua, yaos: raw.benGua.yaos.map(normalizeYao) },
    bianGua: raw.bianGua && Array.isArray(raw.bianGua.yaos)
      ? { ...raw.bianGua, yaos: raw.bianGua.yaos.map(normalizeYao) }
      : undefined
  } as GuaLi
}

export const extractBackupRecords = (payload: unknown): unknown[] | null => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return null
  const data = payload as Record<string, unknown>
  if (data.format === GUALI_BACKUP_FORMAT && Array.isArray(data.records)) return data.records
  if (Array.isArray(data.guaLiList)) return data.guaLiList
  return null
}
