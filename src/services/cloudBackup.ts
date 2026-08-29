import { reactive } from 'vue'
import type { GuaLiBackup } from '@/utils/guaLiData'

type CloudBackupStatus = 'disabled' | 'idle' | 'syncing' | 'synced' | 'auth-required' | 'failed'

const CLOUD_BACKUP_ENABLED = import.meta.env.VITE_CLOUD_BACKUP_ENABLED === 'true'
const CLOUD_BACKUP_ENDPOINT = import.meta.env.VITE_CLOUD_BACKUP_ENDPOINT || '/api/backup'
const CLOUD_BACKUP_STATUS_ENDPOINT = import.meta.env.VITE_CLOUD_BACKUP_STATUS_ENDPOINT || '/api/status'
const LAST_CLOUD_BACKUP_AT_KEY = 'liuyao-last-cloud-backup-at'
const CLOUD_BACKUP_TIMEOUT_MS = 8000

let backupTimer: ReturnType<typeof setTimeout> | null = null
let latestProvider: (() => GuaLiBackup) | null = null
let pendingBackup: GuaLiBackup | null = null

export const cloudBackupState = reactive({
  enabled: CLOUD_BACKUP_ENABLED,
  status: (CLOUD_BACKUP_ENABLED ? 'idle' : 'disabled') as CloudBackupStatus,
  lastBackupAt: localStorage.getItem(LAST_CLOUD_BACKUP_AT_KEY) || '',
  lastError: ''
})

export const uploadCloudBackup = async (backup: GuaLiBackup): Promise<boolean> => {
  if (!cloudBackupState.enabled) return false
  if (cloudBackupState.status === 'syncing') {
    pendingBackup = backup
    return false
  }

  cloudBackupState.status = 'syncing'
  cloudBackupState.lastError = ''
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CLOUD_BACKUP_TIMEOUT_MS)

  try {
    const response = await fetch(CLOUD_BACKUP_ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backup)
    })

    if (response.status === 401) {
      cloudBackupState.status = 'auth-required'
      cloudBackupState.lastError = '云端备份需要登录服务器。'
      return false
    }

    if (!response.ok) {
      let detail = ''
      try {
        const payload = await response.json() as { error?: string }
        detail = payload.error || ''
      } catch (_) {}
      throw new Error(detail || `云端备份失败（HTTP ${response.status}）。`)
    }

    const result = await response.json() as { uploadedAt?: string }
    cloudBackupState.lastBackupAt = result.uploadedAt || new Date().toISOString()
    localStorage.setItem(LAST_CLOUD_BACKUP_AT_KEY, cloudBackupState.lastBackupAt)
    cloudBackupState.status = 'synced'
    return true
  } catch (error) {
    cloudBackupState.status = 'failed'
    cloudBackupState.lastError = error instanceof Error && error.name === 'AbortError'
      ? '云端备份连接超时；排盘和本地保存不受影响。'
      : `云端备份失败；排盘和本地保存不受影响。${error instanceof Error ? ` ${error.message}` : ''}`
    return false
  } finally {
    clearTimeout(timeoutId)
    const nextBackup = pendingBackup
    pendingBackup = null
    if (nextBackup) setTimeout(() => void uploadCloudBackup(nextBackup), 0)
  }
}

export const queueCloudBackup = (provider: () => GuaLiBackup, delay = 1000): void => {
  if (!cloudBackupState.enabled) return
  latestProvider = provider
  if (backupTimer) clearTimeout(backupTimer)
  backupTimer = setTimeout(() => {
    backupTimer = null
    const providerToRun = latestProvider
    if (providerToRun) void uploadCloudBackup(providerToRun())
  }, delay)
}

export const retryCloudBackup = async (): Promise<boolean> => {
  if (!latestProvider) return false
  return uploadCloudBackup(latestProvider())
}

export const openCloudBackupLogin = (): void => {
  window.open(CLOUD_BACKUP_STATUS_ENDPOINT, 'liuyao-cloud-backup-login', 'width=520,height=420')
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (cloudBackupState.enabled && latestProvider) queueCloudBackup(latestProvider, 300)
  })
}
