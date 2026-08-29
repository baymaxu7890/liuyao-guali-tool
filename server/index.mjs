import http from 'node:http'
import path from 'node:path'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const port = Number(process.env.PORT || 3000)
const host = process.env.HOST || '0.0.0.0'
const nutstoreUsername = process.env.NUTSTORE_USERNAME || ''
const nutstoreAppPassword = process.env.NUTSTORE_APP_PASSWORD || ''
const nutstoreBaseUrl = process.env.NUTSTORE_WEBDAV_URL || 'https://dav.jianguoyun.com/dav/'
const backupDirectory = process.env.NUTSTORE_BACKUP_DIRECTORY || '六爻排盘备份'
const maxBodyBytes = Number(process.env.MAX_BACKUP_BYTES || 20 * 1024 * 1024)
const localBackupRoot = process.env.LOCAL_BACKUP_ROOT || ''
const rcloneConfigPath = process.env.RCLONE_CONFIG || '/config/rclone/rclone.conf'
const rcloneTargets = (process.env.RCLONE_TARGETS || '')
  .split(',')
  .map((target) => target.trim())
  .filter((target) => /^[a-zA-Z0-9_-]+$/.test(target))
const rcloneBackupDirectory = process.env.RCLONE_BACKUP_DIRECTORY || backupDirectory
const execFileAsync = promisify(execFile)

const webDavReady = Boolean(nutstoreUsername && nutstoreAppPassword)
const rcloneReady = Boolean(localBackupRoot && rcloneTargets.length)
const credentialsReady = webDavReady || rcloneReady

const sendJson = (response, status, payload) => {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  })
  response.end(body)
}

const readJsonBody = (request) => new Promise((resolve, reject) => {
  let size = 0
  const chunks = []
  request.on('data', (chunk) => {
    size += chunk.length
    if (size > maxBodyBytes) {
      reject(Object.assign(new Error('备份文件超过服务器允许的大小。'), { statusCode: 413 }))
      request.destroy()
      return
    }
    chunks.push(chunk)
  })
  request.on('end', () => {
    try {
      resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    } catch (_) {
      reject(Object.assign(new Error('请求内容不是有效 JSON。'), { statusCode: 400 }))
    }
  })
  request.on('error', reject)
})

const encodePath = (...segments) => segments
  .flatMap((segment) => String(segment).split('/'))
  .filter(Boolean)
  .map(encodeURIComponent)
  .join('/')

const webDavUrl = (...segments) => new URL(encodePath(...segments), nutstoreBaseUrl).toString()
const authorization = () => `Basic ${Buffer.from(`${nutstoreUsername}:${nutstoreAppPassword}`).toString('base64')}`

const requestWebDav = async (url, options) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: authorization(),
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(20000)
  })
  return response
}

const ensureDirectory = async (...segments) => {
  const response = await requestWebDav(webDavUrl(...segments) + '/', { method: 'MKCOL' })
  if (![201, 301, 302, 405].includes(response.status)) {
    throw new Error(`坚果云目录创建失败（HTTP ${response.status}）。`)
  }
}

const uploadText = async (segments, text) => {
  const response = await requestWebDav(webDavUrl(...segments), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: text
  })
  if (!response.ok) throw new Error(`坚果云文件上传失败（HTTP ${response.status}）。`)
}

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const assertInsideRoot = (root, target) => {
  const relative = path.relative(root, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('本地备份目录配置无效。')
  }
}

const atomicWrite = async (filePath, text) => {
  const temporaryPath = `${filePath}.${process.pid}.tmp`
  await writeFile(temporaryPath, text, { encoding: 'utf8', mode: 0o600 })
  await rename(temporaryPath, filePath)
}

const writeLocalBackup = async (json, historyFileName) => {
  if (!localBackupRoot) return null

  const root = path.resolve(localBackupRoot)
  const targetRoot = path.resolve(root, backupDirectory)
  assertInsideRoot(root, targetRoot)
  const historyRoot = path.join(targetRoot, '历史备份')
  await mkdir(historyRoot, { recursive: true, mode: 0o700 })

  const latestPath = path.join(targetRoot, '六爻排盘_latest.json')
  const historyPath = path.join(historyRoot, historyFileName)
  await atomicWrite(historyPath, json)
  await atomicWrite(latestPath, json)
  return targetRoot
}

const syncRcloneTargets = async (sourceDirectory) => {
  if (!rcloneTargets.length) return []
  if (!sourceDirectory) throw new Error('多云同步已开启，但服务器本地备份目录未配置。')

  const results = await Promise.allSettled(rcloneTargets.map(async (target) => {
    await execFileAsync('rclone', [
      'copy',
      sourceDirectory,
      `${target}:${rcloneBackupDirectory}`,
      '--config', rcloneConfigPath,
      '--checkers', '2',
      '--transfers', '2',
      '--contimeout', '10s',
      '--timeout', '30s'
    ], { timeout: 120000, maxBuffer: 1024 * 1024 })
    return target
  }))

  const synced = []
  const failed = []
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') synced.push(result.value)
    else failed.push(`${rcloneTargets[index]}: ${result.reason instanceof Error ? result.reason.message : '同步失败'}`)
  })
  if (failed.length) throw new Error(`多云同步未全部完成（${failed.join('；')}）。`)
  return synced
}

const uploadBackup = async (payload) => {
  if (!payload || payload.format !== 'liuyao-guali-backup' || !Array.isArray(payload.records)) {
    throw Object.assign(new Error('备份结构无效。'), { statusCode: 400 })
  }
  if (!credentialsReady) throw Object.assign(new Error('服务器尚未配置云备份目标。'), { statusCode: 503 })

  const now = new Date()
  const json = JSON.stringify(payload, null, 2)
  const historyDirectory = '历史备份'
  const historyFileName = `六爻排盘_${formatDateKey(now)}.json`
  const localDirectory = await writeLocalBackup(json, historyFileName)
  let syncedTargets = []

  if (rcloneReady) {
    syncedTargets = await syncRcloneTargets(localDirectory)
  } else {
    await ensureDirectory(backupDirectory)
    await ensureDirectory(backupDirectory, historyDirectory)
    await uploadText([backupDirectory, historyDirectory, historyFileName], json)
    await uploadText([backupDirectory, '六爻排盘_latest.json'], json)
    syncedTargets = ['nutstore']
  }

  return {
    uploadedAt: now.toISOString(),
    records: payload.records.length,
    targets: syncedTargets,
    latestFile: `${backupDirectory}/六爻排盘_latest.json`,
    historyFile: `${backupDirectory}/${historyDirectory}/${historyFileName}`
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://backup-api.local')

  if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/status')) {
    sendJson(response, credentialsReady ? 200 : 503, {
      status: credentialsReady ? 'ready' : 'configuration-required',
      target: rcloneReady ? 'multi-cloud-rclone' : 'nutstore-webdav',
      targets: rcloneReady ? rcloneTargets : (webDavReady ? ['nutstore'] : [])
    })
    return
  }

  if (request.method === 'POST' && url.pathname === '/backup') {
    try {
      const payload = await readJsonBody(request)
      sendJson(response, 200, await uploadBackup(payload))
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 502
      console.error(`[backup-api] ${new Date().toISOString()} ${error instanceof Error ? error.message : 'Unknown error'}`)
      sendJson(response, statusCode, { error: error instanceof Error ? error.message : '云端备份失败。' })
    }
    return
  }

  sendJson(response, 404, { error: 'Not found' })
})

server.listen(port, host, () => {
  console.log(`[backup-api] listening on ${host}:${port}; cloud targets: ${credentialsReady ? 'configured' : 'missing'}`)
})
