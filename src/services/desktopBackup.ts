import { reactive } from 'vue'
import { isTauri } from '@tauri-apps/api/core'
import { appDataDir, join } from '@tauri-apps/api/path'
import {
  BaseDirectory,
  mkdir,
  readTextFile,
  writeTextFile
} from '@tauri-apps/plugin-fs'
import { revealItemInDir } from '@tauri-apps/plugin-opener'
import type { GuaLiBackup } from '@/utils/guaLiData'

const BACKUP_DIRECTORY = 'backups'
const HISTORY_DIRECTORY = `${BACKUP_DIRECTORY}/历史备份`
const LATEST_FILE_NAME = '六爻排盘_latest.json'
const LAST_BACKUP_AT_KEY = 'liuyao-desktop-last-backup-at'
const LAST_BACKUP_FILE_KEY = 'liuyao-desktop-last-backup-file'

let initialized = false
let initializationPromise: Promise<void> | null = null
let backupTimer: ReturnType<typeof setTimeout> | null = null
let queuedProvider: (() => GuaLiBackup) | null = null
let pendingBackup: GuaLiBackup | null = null

const describeError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  try {
    const message = JSON.stringify(error)
    return message && message !== '{}' ? message : fallback
  } catch {
    return fallback
  }
}

export const desktopBackupState = reactive({
  enabled: typeof window !== 'undefined' && isTauri(),
  initialized: false,
  isBackingUp: false,
  backupDirectory: '',
  lastBackupAt: localStorage.getItem(LAST_BACKUP_AT_KEY) || '',
  lastBackupFile: localStorage.getItem(LAST_BACKUP_FILE_KEY) || '',
  lastError: ''
})

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const initializeDesktopBackup = async (): Promise<void> => {
  if (!desktopBackupState.enabled || initialized) return
  if (initializationPromise) return initializationPromise

  initializationPromise = (async () => {
    try {
      await mkdir(HISTORY_DIRECTORY, { baseDir: BaseDirectory.AppData, recursive: true })
      desktopBackupState.backupDirectory = await join(await appDataDir(), BACKUP_DIRECTORY)
      desktopBackupState.lastError = ''
    } catch (error) {
      desktopBackupState.lastError = describeError(error, '无法初始化桌面备份目录。')
    } finally {
      desktopBackupState.initialized = true
      initialized = true
    }
  })()

  return initializationPromise
}

export const writeDesktopBackup = async (backup: GuaLiBackup): Promise<boolean> => {
  if (!desktopBackupState.enabled) return false
  await initializeDesktopBackup()

  if (desktopBackupState.isBackingUp) {
    pendingBackup = backup
    return false
  }

  desktopBackupState.isBackingUp = true
  desktopBackupState.lastError = ''
  try {
    const now = new Date()
    const historyName = `六爻排盘_${formatDateKey(now)}.json`
    const payload = JSON.stringify(backup, null, 2)

    await writeTextFile(`${HISTORY_DIRECTORY}/${historyName}`, payload, { baseDir: BaseDirectory.AppData })
    await writeTextFile(`${BACKUP_DIRECTORY}/${LATEST_FILE_NAME}`, payload, { baseDir: BaseDirectory.AppData })

    desktopBackupState.lastBackupAt = now.toISOString()
    desktopBackupState.lastBackupFile = await join(await appDataDir(), BACKUP_DIRECTORY, LATEST_FILE_NAME)
    localStorage.setItem(LAST_BACKUP_AT_KEY, desktopBackupState.lastBackupAt)
    localStorage.setItem(LAST_BACKUP_FILE_KEY, desktopBackupState.lastBackupFile)
    return true
  } catch (error) {
    desktopBackupState.lastError = describeError(error, '桌面自动备份失败。')
    return false
  } finally {
    desktopBackupState.isBackingUp = false
    const nextBackup = pendingBackup
    pendingBackup = null
    if (nextBackup) void writeDesktopBackup(nextBackup)
  }
}

export const queueDesktopBackup = (provider: () => GuaLiBackup, delay = 700): void => {
  if (!desktopBackupState.enabled) return
  queuedProvider = provider
  if (backupTimer) clearTimeout(backupTimer)
  backupTimer = setTimeout(() => {
    backupTimer = null
    const currentProvider = queuedProvider
    queuedProvider = null
    if (currentProvider) void writeDesktopBackup(currentProvider())
  }, delay)
}

export const readLatestDesktopBackup = async (): Promise<unknown> => {
  if (!desktopBackupState.enabled) throw new Error('当前不是桌面版。')
  await initializeDesktopBackup()
  try {
    const payload = await readTextFile(`${BACKUP_DIRECTORY}/${LATEST_FILE_NAME}`, { baseDir: BaseDirectory.AppData })
    return JSON.parse(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes('not found') || message.includes('找不到')) {
      throw new Error('桌面备份目录中还没有最新备份。')
    }
    throw error
  }
}

export const revealDesktopBackup = async (): Promise<void> => {
  if (!desktopBackupState.enabled) return
  await initializeDesktopBackup()
  const target = desktopBackupState.lastBackupFile
    || await join(await appDataDir(), BACKUP_DIRECTORY, LATEST_FILE_NAME)
  await revealItemInDir(target)
}

export const DESKTOP_BACKUP_LATEST_FILE_NAME = LATEST_FILE_NAME
