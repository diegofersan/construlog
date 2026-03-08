import { app } from 'electron'
import { net } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import * as storage from './storage'
import * as drive from './drive'
import { isAuthenticated, loadStoredTokens } from './auth'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'not-authenticated'

interface SyncQueueItem {
  entity: string
  id: string
  action: 'upload' | 'delete'
  timestamp: string
}

const SYNC_INTERVAL = 30_000
const ENTITIES = ['propostas', 'pedidos', 'faturas', 'clientes', 'tabelas-precos'] as const
const queuePath = join(app.getPath('userData'), 'sync-queue.json')

let currentStatus: SyncStatus = 'idle'
let syncTimer: ReturnType<typeof setInterval> | null = null
let statusListeners: Array<(status: SyncStatus) => void> = []

function setStatus(status: SyncStatus): void {
  currentStatus = status
  statusListeners.forEach((fn) => fn(status))
}

export function getStatus(): SyncStatus {
  return currentStatus
}

export function onStatusChange(listener: (status: SyncStatus) => void): () => void {
  statusListeners.push(listener)
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener)
  }
}

function isOnline(): boolean {
  return net.isOnline()
}

function loadQueue(): SyncQueueItem[] {
  if (!existsSync(queuePath)) return []
  try {
    return JSON.parse(readFileSync(queuePath, 'utf-8'))
  } catch {
    return []
  }
}

function saveQueue(queue: SyncQueueItem[]): void {
  writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf-8')
}

export function enqueue(entity: string, id: string, action: 'upload' | 'delete'): void {
  const queue = loadQueue()
  const existing = queue.findIndex((item) => item.entity === entity && item.id === id)
  if (existing !== -1) {
    queue[existing] = { entity, id, action, timestamp: new Date().toISOString() }
  } else {
    queue.push({ entity, id, action, timestamp: new Date().toISOString() })
  }
  saveQueue(queue)
}

async function processQueue(): Promise<void> {
  const queue = loadQueue()
  if (queue.length === 0) return

  const remaining: SyncQueueItem[] = []

  for (const item of queue) {
    try {
      if (item.action === 'upload') {
        const record = storage.getById(item.entity, item.id)
        if (record) {
          await drive.uploadFile(item.entity, `${item.id}.json`, JSON.stringify(record, null, 2))
        }
      } else if (item.action === 'delete') {
        const remoteFiles = await drive.listFiles(item.entity)
        const remote = remoteFiles.find((f) => f.name === `${item.id}.json`)
        if (remote) {
          await drive.deleteFile(remote.id)
        }
      }
    } catch {
      remaining.push(item)
    }
  }

  saveQueue(remaining)
}

async function syncEntity(entity: string): Promise<void> {
  const localRecords = storage.list<{ id: string; updatedAt: string }>(entity)
  const remoteFiles = await drive.listFiles(entity)

  const localMap = new Map(localRecords.map((r) => [r.id, r]))
  const remoteMap = new Map(remoteFiles.map((f) => [f.name.replace('.json', ''), f]))

  // Sync remote → local (remote newer or remote-only)
  for (const [id, remote] of remoteMap) {
    const local = localMap.get(id)
    if (!local) {
      // Remote-only: download
      const content = await drive.downloadFile(remote.id)
      const record = JSON.parse(content)
      const filePath = join(app.getPath('userData'), 'data', entity, `${id}.json`)
      writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8')
    } else {
      const localTime = new Date(local.updatedAt).getTime()
      const remoteTime = new Date(remote.modifiedTime).getTime()
      if (remoteTime > localTime) {
        const content = await drive.downloadFile(remote.id)
        const record = JSON.parse(content)
        const filePath = join(app.getPath('userData'), 'data', entity, `${id}.json`)
        writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8')
      }
    }
  }

  // Sync local → remote (local newer or local-only)
  for (const [id, local] of localMap) {
    const remote = remoteMap.get(id)
    if (!remote) {
      // Local-only: upload
      await drive.uploadFile(entity, `${id}.json`, JSON.stringify(local, null, 2))
    } else {
      const localTime = new Date(local.updatedAt).getTime()
      const remoteTime = new Date(remote.modifiedTime).getTime()
      if (localTime > remoteTime) {
        await drive.uploadFile(entity, `${id}.json`, JSON.stringify(local, null, 2))
      }
    }
  }
}

export async function syncAll(): Promise<void> {
  if (!isAuthenticated()) {
    setStatus('not-authenticated')
    return
  }

  if (!isOnline()) {
    setStatus('offline')
    return
  }

  if (currentStatus === 'syncing') return

  setStatus('syncing')

  try {
    await drive.ensureFolderStructure()
    await processQueue()

    for (const entity of ENTITIES) {
      await syncEntity(entity)
    }

    setStatus('synced')
  } catch (err) {
    console.error('Sync error:', err)
    setStatus('error')
  }
}

export function startAutoSync(): void {
  if (syncTimer) return

  loadStoredTokens()

  if (isAuthenticated() && isOnline()) {
    syncAll()
  }

  syncTimer = setInterval(() => {
    if (isAuthenticated() && isOnline()) {
      syncAll()
    }
  }, SYNC_INTERVAL)
}

export function stopAutoSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}
