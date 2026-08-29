import { reactive } from 'vue'
import type { GuaLiBackup } from '@/utils/guaLiData'

type BackupPermission = PermissionState | 'unsupported' | 'missing'
type BackupTrigger = 'auto' | 'manual'

interface PermissionDescriptorLike {
  mode?: 'read' | 'readwrite'
}

interface BackupDirectoryHandle extends FileSystemDirectoryHandle {
  queryPermission?: (descriptor?: PermissionDescriptorLike) => Promise<PermissionState>
  requestPermission?: (descriptor?: PermissionDescriptorLike) => Promise<PermissionState>
}

interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: {
    id?: string
    mode?: 'read' | 'readwrite'
  }) => Promise<FileSystemDirectoryHandle>
}

const DB_NAME = 'liuyao-local-backup'
const DB_VERSION = 1
const STORE_NAME = 'settings'
const DIRECTORY_HANDLE_KEY = 'backup-directory'
const AUTO_BACKUP_KEY = 'liuyao-auto-backup-enabled'
const LAST_BACKUP_AT_KEY = 'liuyao-last-backup-at'
const LAST_BACKUP_FILE_KEY = 'liuyao-last-backup-file'
const LATEST_FILE_NAME = '六爻排盘_latest.json'
const HISTORY_DIRECTORY_NAME = '历史备份'

let directoryHandle: BackupDirectoryHandle | null = null
let initialized = false
let initializationPromise: Promise<void> | null = null
let backupTimer: ReturnType<typeof setTimeout> | null = null
let queuedBackupProvider: (() => GuaLiBackup) | null = null
let pendingBackup: GuaLiBackup | null = null

export const localBackupState = reactive({
  supported: typeof window !== 'undefined' && typeof (window as DirectoryPickerWindow).showDirectoryPicker === 'function',
  initialized: false,
  hasDirectory: false,
  directoryName: '',
  permission: 'missing' as BackupPermission,
  autoEnabled: localStorage.getItem(AUTO_BACKUP_KEY) === 'true',
  isBackingUp: false,
  lastBackupAt: localStorage.getItem(LAST_BACKUP_AT_KEY) || '',
  lastBackupFile: localStorage.getItem(LAST_BACKUP_FILE_KEY) || '',
  lastError: ''
})

const openSettingsDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION)
  request.onupgradeneeded = () => {
    const database = request.result
    if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error ?? new Error('无法打开备份设置数据库。'))
})

const readSetting = async <T>(key: string): Promise<T | null> => {
  const database = await openSettingsDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(key)
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('无法读取备份设置。'))
    transaction.oncomplete = () => database.close()
  })
}

const writeSetting = async (key: string, value: unknown): Promise<void> => {
  const database = await openSettingsDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(value, key)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('无法保存备份设置。'))
    }
  })
}

const deleteSetting = async (key: string): Promise<void> => {
  const database = await openSettingsDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(key)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('无法清除备份设置。'))
    }
  })
}

const getPermission = async (handle: BackupDirectoryHandle, request: boolean): Promise<PermissionState> => {
  if (!handle.queryPermission) return 'granted'
  let permission = await handle.queryPermission({ mode: 'readwrite' })
  if (permission === 'prompt' && request && handle.requestPermission) {
    permission = await handle.requestPermission({ mode: 'readwrite' })
  }
  return permission
}

const refreshPermission = async (request = false): Promise<boolean> => {
  if (!directoryHandle) {
    localBackupState.permission = 'missing'
    return false
  }
  try {
    const permission = await getPermission(directoryHandle, request)
    localBackupState.permission = permission
    if (permission !== 'granted') {
      localBackupState.lastError = permission === 'denied'
        ? '备份目录权限已被拒绝，请重新选择目录。'
        : '需要重新授权备份目录后才能自动写入。'
    } else {
      localBackupState.lastError = ''
    }
    return permission === 'granted'
  } catch (error) {
    localBackupState.permission = 'denied'
    localBackupState.lastError = error instanceof Error ? error.message : '检查备份目录权限失败。'
    return false
  }
}

export const initializeLocalBackup = async (): Promise<void> => {
  if (initialized) return
  if (initializationPromise) return initializationPromise

  initializationPromise = (async () => {
    if (!localBackupState.supported) {
      localBackupState.permission = 'unsupported'
      localBackupState.initialized = true
      initialized = true
      return
    }

    try {
      directoryHandle = await readSetting<BackupDirectoryHandle>(DIRECTORY_HANDLE_KEY)
      if (directoryHandle) {
        localBackupState.hasDirectory = true
        localBackupState.directoryName = directoryHandle.name
        await refreshPermission(false)
      }
    } catch (error) {
      localBackupState.lastError = error instanceof Error ? error.message : '读取备份目录设置失败。'
    } finally {
      localBackupState.initialized = true
      initialized = true
    }
  })()

  return initializationPromise
}

export const chooseLocalBackupDirectory = async (): Promise<boolean> => {
  if (!localBackupState.supported) {
    localBackupState.lastError = '当前浏览器不支持选择本地同步目录，请使用 Chrome 或 Edge。'
    return false
  }

  try {
    const pickerWindow = window as DirectoryPickerWindow
    const picked = await pickerWindow.showDirectoryPicker?.({ id: 'liuyao-backup', mode: 'readwrite' })
    if (!picked) return false
    directoryHandle = picked as BackupDirectoryHandle
    const granted = await refreshPermission(true)
    if (!granted) return false

    await writeSetting(DIRECTORY_HANDLE_KEY, directoryHandle)
    localBackupState.hasDirectory = true
    localBackupState.directoryName = directoryHandle.name
    setAutoBackupEnabled(true)
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return false
    localBackupState.lastError = error instanceof Error ? error.message : '选择备份目录失败。'
    return false
  }
}

export const requestLocalBackupPermission = async (): Promise<boolean> => {
  await initializeLocalBackup()
  return refreshPermission(true)
}

export const forgetLocalBackupDirectory = async (): Promise<void> => {
  directoryHandle = null
  localBackupState.hasDirectory = false
  localBackupState.directoryName = ''
  localBackupState.permission = 'missing'
  localBackupState.lastError = ''
  setAutoBackupEnabled(false)
  await deleteSetting(DIRECTORY_HANDLE_KEY)
}

export const setAutoBackupEnabled = (enabled: boolean): void => {
  localBackupState.autoEnabled = enabled
  localStorage.setItem(AUTO_BACKUP_KEY, String(enabled))
}

const writeTextFile = async (directory: FileSystemDirectoryHandle, name: string, text: string): Promise<void> => {
  const fileHandle = await directory.getFileHandle(name, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(text)
  await writable.close()
}

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const writeLocalBackup = async (backup: GuaLiBackup, trigger: BackupTrigger = 'manual'): Promise<boolean> => {
  await initializeLocalBackup()

  if (localBackupState.isBackingUp) {
    pendingBackup = backup
    return false
  }
  if (!directoryHandle || !localBackupState.hasDirectory) {
    if (trigger === 'manual') localBackupState.lastError = '请先选择坚果云同步目录。'
    return false
  }
  if (!(await refreshPermission(trigger === 'manual'))) return false

  localBackupState.isBackingUp = true
  localBackupState.lastError = ''
  try {
    const now = new Date()
    const historyName = `六爻排盘_${formatDateKey(now)}.json`
    const payload = JSON.stringify(backup, null, 2)
    const historyDirectory = await directoryHandle.getDirectoryHandle(HISTORY_DIRECTORY_NAME, { create: true })

    await writeTextFile(historyDirectory, historyName, payload)
    await writeTextFile(directoryHandle, LATEST_FILE_NAME, payload)

    localBackupState.lastBackupAt = now.toISOString()
    localBackupState.lastBackupFile = `${localBackupState.directoryName}\\${LATEST_FILE_NAME}`
    localStorage.setItem(LAST_BACKUP_AT_KEY, localBackupState.lastBackupAt)
    localStorage.setItem(LAST_BACKUP_FILE_KEY, localBackupState.lastBackupFile)
    return true
  } catch (error) {
    localBackupState.lastError = error instanceof Error ? error.message : '写入备份文件失败。'
    return false
  } finally {
    localBackupState.isBackingUp = false
    const nextBackup = pendingBackup
    pendingBackup = null
    if (nextBackup) void writeLocalBackup(nextBackup, 'auto')
  }
}

export const queueLocalBackup = (provider: () => GuaLiBackup, delay = 900): void => {
  if (!localBackupState.autoEnabled) return
  queuedBackupProvider = provider
  if (backupTimer) clearTimeout(backupTimer)
  backupTimer = setTimeout(() => {
    backupTimer = null
    const currentProvider = queuedBackupProvider
    queuedBackupProvider = null
    if (currentProvider) void writeLocalBackup(currentProvider(), 'auto')
  }, delay)
}

export const readLatestLocalBackup = async (): Promise<unknown> => {
  await initializeLocalBackup()
  if (!directoryHandle || !localBackupState.hasDirectory) throw new Error('请先选择备份目录。')
  if (!(await refreshPermission(true))) throw new Error(localBackupState.lastError || '没有备份目录读取权限。')

  try {
    const fileHandle = await directoryHandle.getFileHandle(LATEST_FILE_NAME)
    const file = await fileHandle.getFile()
    return JSON.parse(await file.text())
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      throw new Error('当前目录里还没有最新备份，请先执行一次备份。')
    }
    throw error
  }
}

export const LOCAL_BACKUP_LATEST_FILE_NAME = LATEST_FILE_NAME
