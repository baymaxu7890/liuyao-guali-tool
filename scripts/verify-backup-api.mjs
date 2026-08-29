import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'

const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => resolve(server.address().port))
})

const close = (server) => new Promise((resolve) => server.close(resolve))

const waitForApi = async (url, child) => {
  const deadline = Date.now() + 8000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`备份服务提前退出，退出码 ${child.exitCode}`)
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch (_) {
      // 服务仍在启动，短暂等待后继续。
    }
    await new Promise((resolve) => setTimeout(resolve, 80))
  }
  throw new Error('等待备份服务启动超时。')
}

const stopChild = async (child) => {
  if (child.exitCode !== null) return
  child.kill()
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2000))
  ])
}

const uploads = []
const directories = []
const mockWebDav = http.createServer((request, response) => {
  if (request.method === 'MKCOL') {
    directories.push(decodeURIComponent(request.url || ''))
    response.writeHead(201).end()
    return
  }

  if (request.method === 'PUT') {
    const chunks = []
    request.on('data', (chunk) => chunks.push(chunk))
    request.on('end', () => {
      uploads.push({
        path: decodeURIComponent(request.url || ''),
        body: Buffer.concat(chunks).toString('utf8'),
        authorization: request.headers.authorization
      })
      response.writeHead(201).end()
    })
    return
  }

  response.writeHead(404).end()
})

let child

try {
  const webDavPort = await listen(mockWebDav)
  const portProbe = http.createServer()
  const apiPort = await listen(portProbe)
  await close(portProbe)

  child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(apiPort),
      NUTSTORE_USERNAME: 'test-user',
      NUTSTORE_APP_PASSWORD: 'test-app-password',
      NUTSTORE_WEBDAV_URL: `http://127.0.0.1:${webDavPort}/dav/`,
      NUTSTORE_BACKUP_DIRECTORY: '六爻排盘备份'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  let stderr = ''
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })

  await waitForApi(`http://127.0.0.1:${apiPort}/status`, child)

  const payload = {
    format: 'liuyao-guali-backup',
    version: 2,
    exportedAt: new Date().toISOString(),
    records: []
  }

  const response = await fetch(`http://127.0.0.1:${apiPort}/backup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const result = await response.json()

  assert.equal(response.status, 200, JSON.stringify(result))
  assert.equal(uploads.length, 2, '应上传每日历史备份和 latest 备份各一份')
  assert.deepEqual(directories, ['/dav/六爻排盘备份/', '/dav/六爻排盘备份/历史备份/'])
  assert.ok(uploads.some((item) => /^\/dav\/六爻排盘备份\/历史备份\/六爻排盘_\d{4}-\d{2}-\d{2}\.json$/.test(item.path)))
  assert.ok(uploads.some((item) => item.path === '/dav/六爻排盘备份/六爻排盘_latest.json'))
  assert.ok(uploads.every((item) => item.authorization?.startsWith('Basic ')))
  assert.ok(uploads.every((item) => JSON.parse(item.body).format === payload.format))
  assert.equal(stderr, '')

  console.log('Backup API verification passed: MKCOL directories and two WebDAV JSON uploads succeeded.')
} finally {
  if (child) await stopChild(child)
  if (mockWebDav.listening) await close(mockWebDav)
}
