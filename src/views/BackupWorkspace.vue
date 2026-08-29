<template>
  <section class="workspace-page">
    <div class="workspace-heading">
      <div>
        <span class="workspace-kicker">综合排盘 · 数据保护</span>
        <h2>☁️ 云端与本地备份</h2>
        <p v-if="desktopState.enabled">桌面版会自动写入 Windows 本地备份目录；云端登录或网络异常不会影响排盘、日历和本地保存。</p>
        <p v-else>云端部署后，归档、更新、删除或导入卦例会自动由服务器同步到坚果云、Yandex Disk 和 Box；浏览器不保存任何云盘凭据。</p>
      </div>
      <span :class="['status-badge', statusTone]">{{ statusLabel }}</span>
    </div>

    <div v-if="!state.supported && !desktopState.enabled" class="notice warning">
      当前浏览器不支持直接写入本地目录。请使用 Chrome 或 Edge，或者使用下方“下载 JSON”方式备份。
    </div>

    <article v-if="desktopState.enabled" class="backup-card desktop-card">
      <div class="card-title-row">
        <div>
          <span class="card-kicker">桌面版主要备份</span>
          <h3>🖥️ Windows 本地自动备份</h3>
        </div>
        <span :class="['status-badge', desktopState.lastError ? 'warning' : 'ready']">
          {{ desktopState.isBackingUp ? '正在写入' : (desktopState.lastError ? '备份异常' : '始终开启') }}
        </span>
      </div>

      <p class="cloud-description">
        每次归档、修改、删除或导入后，桌面版都会更新最新备份，并按天保留历史版本。此功能完全离线，不依赖服务器或云盘登录。
      </p>

      <dl class="status-list desktop-status-list">
        <div>
          <dt>备份目录</dt>
          <dd>{{ desktopState.backupDirectory || '正在初始化…' }}</dd>
        </div>
        <div>
          <dt>最近备份</dt>
          <dd>{{ formattedDesktopBackupAt }}</dd>
        </div>
        <div>
          <dt>最新文件</dt>
          <dd>{{ desktopState.lastBackupFile || desktopLatestFileName }}</dd>
        </div>
      </dl>

      <div v-if="desktopState.lastError" class="inline-error">{{ desktopState.lastError }}</div>
      <div class="button-row desktop-buttons">
        <button class="btn primary" :disabled="desktopState.isBackingUp" @click="backupDesktopNow">
          {{ desktopState.isBackingUp ? '正在备份…' : '立即写入桌面备份' }}
        </button>
        <button class="btn secondary" @click="openDesktopBackupLocation">打开备份位置</button>
        <button class="btn secondary" @click="restoreDesktopLatest">恢复桌面最新备份（合并）</button>
      </div>
    </article>

    <article class="backup-card cloud-card">
      <div class="card-title-row">
        <div>
          <span class="card-kicker">主要备份</span>
          <h3>🌐 服务器自动备份到三家云盘</h3>
        </div>
        <span :class="['status-badge', cloudStatusTone]">{{ cloudStatusLabel }}</span>
      </div>

      <p class="cloud-description">
        云端版本无需选择同步目录。保存卦例后，网页把标准 JSON 发送给同域备份接口，再由服务器并行上传到坚果云、Yandex Disk 和 Box。
      </p>

      <dl class="status-list cloud-status-list">
        <div>
          <dt>自动上传</dt>
          <dd>{{ cloudState.enabled ? '已由部署配置开启' : '本地开发环境未开启' }}</dd>
        </div>
        <div>
          <dt>同步状态</dt>
          <dd>{{ cloudStatusLabel }}</dd>
        </div>
        <div>
          <dt>最近上传</dt>
          <dd>{{ formattedCloudBackupAt }}</dd>
        </div>
      </dl>

      <div v-if="cloudState.lastError" class="inline-error">{{ cloudState.lastError }}</div>
      <div class="button-row cloud-buttons">
        <button class="btn primary" :disabled="!cloudState.enabled || cloudState.status === 'syncing'" @click="backupCloudNow">
          {{ cloudState.status === 'syncing' ? '正在上传…' : '立即上传云端' }}
        </button>
        <button v-if="cloudState.status === 'auth-required'" class="btn secondary" @click="loginCloudBackup">登录云端备份</button>
        <button v-if="cloudState.status === 'failed'" class="btn secondary" @click="retryCloud">重试</button>
      </div>
    </article>

    <div class="backup-grid">
      <article class="backup-card directory-card">
        <div class="card-title-row">
          <div>
            <span class="card-kicker">可选备用</span>
            <h3>📁 本地同步文件夹</h3>
          </div>
          <span class="folder-icon">{{ state.hasDirectory ? '✅' : '➕' }}</span>
        </div>

        <div class="folder-display">
          <strong>{{ state.directoryName || '尚未选择目录' }}</strong>
          <span v-if="state.hasDirectory">将写入 {{ latestFileName }} 和“历史备份”文件夹</span>
          <span v-else>建议选择坚果云中的“六爻排盘备份”文件夹</span>
        </div>

        <div class="button-row">
          <button class="btn primary" :disabled="!state.supported" @click="selectDirectory">
            {{ state.hasDirectory ? '更换备份目录' : '选择备份目录' }}
          </button>
          <button
            v-if="state.hasDirectory && state.permission !== 'granted'"
            class="btn secondary"
            @click="reauthorize"
          >
            重新授权
          </button>
          <button v-if="state.hasDirectory" class="btn subtle" @click="forgetDirectory">取消关联</button>
        </div>
      </article>

      <article class="backup-card status-card">
        <div class="card-title-row">
          <div>
            <span class="card-kicker">自动保护</span>
            <h3>💾 备份状态</h3>
          </div>
          <label class="switch-label">
            <input v-model="autoBackupEnabled" type="checkbox" :disabled="!state.hasDirectory">
            <span>自动备份</span>
          </label>
        </div>

        <dl class="status-list">
          <div>
            <dt>目录权限</dt>
            <dd>{{ permissionLabel }}</dd>
          </div>
          <div>
            <dt>卦例数量</dt>
            <dd>{{ store.totalCount }} 条</dd>
          </div>
          <div>
            <dt>最近备份</dt>
            <dd>{{ formattedLastBackupAt }}</dd>
          </div>
          <div>
            <dt>最近文件</dt>
            <dd>{{ state.lastBackupFile || '暂无' }}</dd>
          </div>
        </dl>

        <div v-if="state.lastError" class="inline-error">{{ state.lastError }}</div>
        <div v-if="message" :class="['inline-message', messageTone]">{{ message }}</div>
      </article>
    </div>

    <article class="backup-card action-card">
      <div>
        <span class="card-kicker">备份与恢复</span>
        <h3>操作</h3>
        <p>自动备份会在归档、修改、删除或导入卦例后执行；每天保留一个历史版本，同时更新最新备份。</p>
      </div>
      <div class="action-buttons">
        <button class="btn primary" :disabled="!canUseDirectory || state.isBackingUp" @click="backupNow">
          {{ state.isBackingUp ? '正在备份…' : '立即备份' }}
        </button>
        <button class="btn secondary" :disabled="!canUseDirectory" @click="restoreLatest">恢复最新备份（合并）</button>
        <button class="btn secondary" @click="downloadJsonBackup">下载 JSON 备份</button>
        <button class="btn secondary" @click="store.setShowImportModal(true)">从其他文件恢复</button>
      </div>
    </article>

    <div class="notice info">
      <strong>可选的本地备用：</strong>如果电脑安装了坚果云客户端，也可以把本地同步目录关联到这里，形成第二份备份；这不影响服务器自动上传。
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGuaLiStore } from '@/stores/guaLiStore'
import {
  LOCAL_BACKUP_LATEST_FILE_NAME,
  chooseLocalBackupDirectory,
  forgetLocalBackupDirectory,
  initializeLocalBackup,
  localBackupState,
  readLatestLocalBackup,
  requestLocalBackupPermission,
  setAutoBackupEnabled,
  writeLocalBackup
} from '@/services/localBackup'
import {
  cloudBackupState,
  openCloudBackupLogin,
  retryCloudBackup,
  uploadCloudBackup
} from '@/services/cloudBackup'
import {
  DESKTOP_BACKUP_LATEST_FILE_NAME,
  desktopBackupState,
  initializeDesktopBackup,
  readLatestDesktopBackup,
  revealDesktopBackup,
  writeDesktopBackup
} from '@/services/desktopBackup'

const store = useGuaLiStore()
const state = localBackupState
const cloudState = cloudBackupState
const desktopState = desktopBackupState
const latestFileName = LOCAL_BACKUP_LATEST_FILE_NAME
const desktopLatestFileName = DESKTOP_BACKUP_LATEST_FILE_NAME
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const autoBackupEnabled = computed({
  get: () => state.autoEnabled,
  set: (enabled: boolean) => setAutoBackupEnabled(enabled)
})

const canUseDirectory = computed(() => state.hasDirectory && state.permission === 'granted')

const statusLabel = computed(() => {
  if (desktopState.enabled) {
    if (desktopState.isBackingUp) return '桌面备份中'
    if (desktopState.lastError) return '桌面备份异常'
    return '桌面自动备份已开启'
  }
  if (cloudState.enabled) {
    if (cloudState.status === 'syncing') return '云端备份中'
    if (cloudState.status === 'synced') return '云端自动备份已开启'
    if (cloudState.status === 'auth-required') return '云端待登录'
    if (cloudState.status === 'failed') return '云端同步失败'
    return '云端自动备份已开启'
  }
  if (!state.supported) return '需手动下载'
  if (!state.hasDirectory) return '未设置'
  if (state.permission !== 'granted') return '待授权'
  if (state.isBackingUp) return '备份中'
  return state.autoEnabled ? '自动备份已开启' : '可用'
})

const statusTone = computed(() => {
  if (desktopState.enabled) return desktopState.lastError ? 'warning' : 'ready'
  if (cloudState.enabled) {
    if (cloudState.status === 'failed' || cloudState.status === 'auth-required') return 'warning'
    if (cloudState.status === 'synced' || cloudState.status === 'syncing' || cloudState.status === 'idle') return 'ready'
  }
  if (!state.supported || state.permission === 'denied') return 'warning'
  if (canUseDirectory.value) return 'ready'
  return 'neutral'
})

const permissionLabel = computed(() => ({
  granted: '已授权读写',
  prompt: '需要重新授权',
  denied: '已拒绝',
  missing: '未选择目录',
  unsupported: '浏览器不支持'
}[state.permission]))

const formattedLastBackupAt = computed(() => {
  if (!state.lastBackupAt) return '尚未备份'
  const date = new Date(state.lastBackupAt)
  if (Number.isNaN(date.getTime())) return state.lastBackupAt
  return date.toLocaleString('zh-CN', { hour12: false })
})

const cloudStatusLabel = computed(() => ({
  disabled: '未启用',
  idle: '等待首次同步',
  syncing: '正在上传',
  synced: '云端已同步',
  'auth-required': '需要服务器登录',
  failed: '同步失败'
}[cloudState.status]))

const cloudStatusTone = computed(() => {
  if (cloudState.status === 'synced') return 'ready'
  if (cloudState.status === 'failed' || cloudState.status === 'auth-required') return 'warning'
  return 'neutral'
})

const formattedCloudBackupAt = computed(() => {
  if (!cloudState.lastBackupAt) return '尚未上传'
  const date = new Date(cloudState.lastBackupAt)
  return Number.isNaN(date.getTime()) ? cloudState.lastBackupAt : date.toLocaleString('zh-CN', { hour12: false })
})

const formattedDesktopBackupAt = computed(() => {
  if (!desktopState.lastBackupAt) return '尚未备份'
  const date = new Date(desktopState.lastBackupAt)
  return Number.isNaN(date.getTime()) ? desktopState.lastBackupAt : date.toLocaleString('zh-CN', { hour12: false })
})

const showMessage = (text: string, tone: 'success' | 'error' = 'success') => {
  message.value = text
  messageTone.value = tone
}

const selectDirectory = async () => {
  message.value = ''
  if (await chooseLocalBackupDirectory()) {
    showMessage(`已关联“${state.directoryName}”，正在创建第一份备份。`)
    await backupNow()
  }
}

const reauthorize = async () => {
  message.value = ''
  if (await requestLocalBackupPermission()) showMessage('目录权限已恢复。')
}

const forgetDirectory = async () => {
  if (!confirm('只取消软件与该目录的关联，不会删除目录中的任何备份文件。继续吗？')) return
  await forgetLocalBackupDirectory()
  showMessage('已取消目录关联，已有备份文件仍然保留。')
}

const backupNow = async () => {
  message.value = ''
  const success = await writeLocalBackup(store.createBackup(), 'manual')
  showMessage(success ? `备份成功：${state.lastBackupFile}` : (state.lastError || '备份没有完成。'), success ? 'success' : 'error')
}

const backupCloudNow = async () => {
  message.value = ''
  const success = await uploadCloudBackup(store.createBackup())
  showMessage(success ? '云端备份上传成功。' : (cloudState.lastError || '云端备份没有完成。'), success ? 'success' : 'error')
}

const backupDesktopNow = async () => {
  message.value = ''
  const success = await writeDesktopBackup(store.createBackup())
  showMessage(success ? '桌面备份已写入。' : (desktopState.lastError || '桌面备份没有完成。'), success ? 'success' : 'error')
}

const openDesktopBackupLocation = async () => {
  message.value = ''
  try {
    if (!desktopState.lastBackupFile) await writeDesktopBackup(store.createBackup())
    await revealDesktopBackup()
  } catch (error) {
    showMessage(error instanceof Error ? error.message : '无法打开桌面备份位置。', 'error')
  }
}

const restoreDesktopLatest = async () => {
  message.value = ''
  if (!confirm('将桌面最新备份合并到当前卦例库；相同 ID 的记录会以备份内容更新，其他记录不会删除。继续吗？')) return
  try {
    const payload = await readLatestDesktopBackup()
    const result = store.importBackup(payload)
    if (result.imported === 0) throw new Error('桌面最新备份中没有可识别的卦例。')
    showMessage(`桌面备份恢复完成：导入 ${result.imported} 条，跳过 ${result.skipped} 条。`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : '恢复桌面备份失败。', 'error')
  }
}

const retryCloud = async () => {
  const success = await retryCloudBackup()
  showMessage(success ? '云端备份重试成功。' : (cloudState.lastError || '重试失败。'), success ? 'success' : 'error')
}

const loginCloudBackup = () => {
  openCloudBackupLogin()
  showMessage('请在新窗口完成服务器登录，然后返回此页点击“立即上传云端”。')
}

const restoreLatest = async () => {
  message.value = ''
  if (!confirm('将最新备份合并到当前卦例库；相同 ID 的记录会以备份内容更新，其他记录不会删除。继续吗？')) return
  try {
    const payload = await readLatestLocalBackup()
    const result = store.importBackup(payload)
    if (result.imported === 0) throw new Error('最新文件中没有可识别的卦例。')
    showMessage(`恢复完成：导入 ${result.imported} 条，跳过 ${result.skipped} 条。`)
  } catch (error) {
    showMessage(error instanceof Error ? error.message : '恢复备份失败。', 'error')
  }
}

const downloadJsonBackup = () => {
  const json = JSON.stringify(store.createBackup(), null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `六爻卦例备份_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  showMessage('JSON 备份已下载。')
}

onMounted(() => {
  void initializeLocalBackup()
  void initializeDesktopBackup()
})
</script>

<style scoped>
.workspace-page { max-width: 1080px; margin: 0 auto; padding: 24px; }
.workspace-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding: 20px 22px; border: 1px solid rgba(102, 126, 234, 0.16); border-radius: 10px; background: rgba(255, 255, 255, 0.88); }
.workspace-kicker, .card-kicker { color: var(--primary-color); font-size: 13px; font-weight: bold; }
.workspace-heading h2 { margin: 5px 0 6px; color: #2d3748; font-size: 25px; }
.workspace-heading p, .action-card p { margin: 0; color: #718096; font-size: 14px; line-height: 1.6; }
.status-badge { flex-shrink: 0; padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: bold; }
.status-badge.ready { background: #e6fffa; color: #2f855a; }
.status-badge.warning { background: #fffaf0; color: #c05621; }
.status-badge.neutral { background: #edf2f7; color: #718096; }
.backup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.backup-card { padding: 20px 22px; border: 1px solid #e2e8f0; border-radius: 10px; background: rgba(255,255,255,0.94); box-shadow: 0 4px 12px rgba(45,55,72,0.04); }
.cloud-card { margin-top: 16px; border-color: rgba(102, 126, 234, 0.28); background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(237,242,255,0.94)); }
.desktop-card { margin-top: 16px; border-color: rgba(56, 161, 105, 0.32); background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,255,244,0.94)); }
.cloud-description { margin: 14px 0 0; color: #718096; font-size: 14px; line-height: 1.65; }
.cloud-status-list { grid-template-columns: repeat(3, 1fr); }
.cloud-status-list div { display: flex; flex-direction: column; gap: 5px; }
.cloud-buttons { margin-top: 14px; }
.desktop-status-list { grid-template-columns: 1.5fr 0.8fr 1.5fr; }
.desktop-status-list div { display: flex; flex-direction: column; gap: 5px; }
.desktop-buttons { margin-top: 14px; }
.card-title-row { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
.backup-card h3 { margin: 4px 0 0; color: #2d3748; font-size: 20px; }
.folder-icon { font-size: 25px; }
.folder-display { display: flex; flex-direction: column; gap: 6px; margin: 18px 0; padding: 14px; border-radius: 8px; background: #f7fafc; color: #4a5568; }
.folder-display strong { color: #2d3748; word-break: break-all; }
.folder-display span { font-size: 12px; line-height: 1.5; }
.button-row, .action-buttons { display: flex; flex-wrap: wrap; gap: 10px; }
.btn { padding: 9px 14px; border: 0; border-radius: 6px; font-family: inherit; font-size: 14px; cursor: pointer; transition: 0.2s; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn.primary { background: var(--primary-color); color: #fff; }
.btn.secondary { background: #edf2f7; color: #4a5568; }
.btn.subtle { background: #fff5f5; color: #c53030; }
.btn:not(:disabled):hover { filter: brightness(0.96); transform: translateY(-1px); }
.switch-label { display: flex; align-items: center; gap: 6px; color: #4a5568; font-size: 13px; cursor: pointer; }
.status-list { display: grid; gap: 10px; margin-top: 18px; }
.status-list div { display: grid; grid-template-columns: 82px 1fr; gap: 10px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
.status-list dt { color: #a0aec0; font-size: 13px; }
.status-list dd { margin: 0; color: #4a5568; font-size: 13px; word-break: break-all; }
.inline-error, .inline-message { margin-top: 12px; padding: 9px 11px; border-radius: 6px; font-size: 13px; line-height: 1.5; }
.inline-error, .inline-message.error { background: #fff5f5; color: #c53030; }
.inline-message.success { background: #f0fff4; color: #2f855a; }
.action-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 16px; }
.action-card > div:first-child { max-width: 560px; }
.action-card h3 { margin-bottom: 6px; }
.action-buttons { justify-content: flex-end; }
.notice { margin-top: 16px; padding: 13px 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; }
.notice.info { border: 1px solid #bee3f8; background: #ebf8ff; color: #2c5282; }
.notice.warning { border: 1px solid #fbd38d; background: #fffaf0; color: #9c4221; }
@media (max-width: 760px) {
  .backup-grid { grid-template-columns: 1fr; }
  .cloud-status-list { grid-template-columns: 1fr; }
  .desktop-status-list { grid-template-columns: 1fr; }
  .action-card { align-items: stretch; flex-direction: column; }
  .action-buttons { justify-content: flex-start; }
}
</style>
