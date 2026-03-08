import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { v4 as uuidv4 } from 'uuid'

const dataPath = join(app.getPath('userData'), 'data')

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function getEntityDir(entity: string): string {
  const dir = join(dataPath, entity)
  ensureDir(dir)
  return dir
}

function safePath(dir: string, filename: string): string {
  const filePath = join(dir, filename)
  const resolved = resolve(filePath)
  if (!resolved.startsWith(resolve(dir))) {
    throw new Error('Invalid path')
  }
  return filePath
}

export function list<T>(entity: string): T[] {
  const dir = getEntityDir(entity)
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  return files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as T)
}

export function getById<T>(entity: string, id: string): T | null {
  const filePath = safePath(getEntityDir(entity), `${id}.json`)
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

export function create<T extends { id: string; createdAt: string; updatedAt: string }>(
  entity: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): T {
  const now = new Date().toISOString()
  const record = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  } as T
  const filePath = safePath(getEntityDir(entity), `${record.id}.json`)
  writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8')
  return record
}

export function update<T extends { id: string; updatedAt: string }>(
  entity: string,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): T | null {
  const existing = getById<T>(entity, id)
  if (!existing) return null
  const updated = {
    ...existing,
    ...data,
    id,
    updatedAt: new Date().toISOString()
  } as T
  const filePath = safePath(getEntityDir(entity), `${id}.json`)
  writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

export function remove(entity: string, id: string): boolean {
  const filePath = safePath(getEntityDir(entity), `${id}.json`)
  if (!existsSync(filePath)) return false
  unlinkSync(filePath)
  return true
}

// Settings
const settingsPath = join(dataPath, '_settings')

export function getSettings<T>(key: string): T | null {
  ensureDir(settingsPath)
  const filePath = safePath(settingsPath, `${key}.json`)
  if (!existsSync(filePath)) return null
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

export function saveSettings<T>(key: string, data: T): void {
  ensureDir(settingsPath)
  const filePath = safePath(settingsPath, `${key}.json`)
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
