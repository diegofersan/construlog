import { ipcMain, dialog, BrowserWindow, clipboard, nativeImage } from 'electron'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import * as storage from './services/storage'
import * as auth from './services/auth'
import * as sync from './services/sync'
import { resetDriveClient } from './services/drive'
import { executeAI, testAIKey } from './services/ai'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateId(id: unknown): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new Error('Invalid ID')
  }
  return id
}

const entities = [
  { ipc: 'pedidos', storage: 'pedidos' },
  { ipc: 'clientes', storage: 'clientes' },
  { ipc: 'tabelas-precos', storage: 'tabelas-precos' },
  { ipc: 'faturas', storage: 'faturas' },
  { ipc: 'propostas', storage: 'propostas' }
] as const

export function registerIpcHandlers(): void {
  for (const entity of entities) {
    ipcMain.handle(`${entity.ipc}:list`, () => storage.list(entity.storage))
    ipcMain.handle(`${entity.ipc}:get`, (_, id: string) => storage.getById(entity.storage, validateId(id)))
    ipcMain.handle(`${entity.ipc}:create`, (_, data) => {
      const record = storage.create(entity.storage, data)
      sync.enqueue(entity.storage, record.id, 'upload')
      return record
    })
    ipcMain.handle(`${entity.ipc}:update`, (_, id: string, data) => {
      const validId = validateId(id)
      const record = storage.update(entity.storage, validId, data)
      if (record) sync.enqueue(entity.storage, validId, 'upload')
      return record
    })
    ipcMain.handle(`${entity.ipc}:delete`, (_, id: string) => {
      const validId = validateId(id)
      storage.remove(entity.storage, validId)
      sync.enqueue(entity.storage, validId, 'delete')
    })
  }

  // Sync IPC handlers
  ipcMain.handle('sync:start', () => sync.syncAll())
  ipcMain.handle('sync:status', () => sync.getStatus())
  ipcMain.handle('sync:login', () => auth.login())
  ipcMain.handle('sync:logout', () => {
    auth.logout()
    resetDriveClient()
  })
  ipcMain.handle('sync:isAuthenticated', () => auth.isAuthenticated())

  // Settings handlers
  ipcMain.handle('settings:getAI', () => storage.getSettings('ai'))
  ipcMain.handle('settings:saveAI', (_, data) => storage.saveSettings('ai', data))

  // AI handlers
  ipcMain.handle('ai:execute', async (_, command: string, context?: { route: string; pedido_id?: string }, history?: { role: string; content: string }[]) => {
    try {
      return await executeAI(command, context, history)
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  })

  ipcMain.handle('ai:testKey', async (_, provider: string, apiKey: string) => {
    return testAIKey(provider, apiKey)
  })

  // PDF save handler
  ipcMain.handle('pdf:save', async (event, fileName: string, data: number[]) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: fileName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (result.canceled || !result.filePath) return false
    await writeFile(result.filePath, Buffer.from(data))
    return true
  })

  // PDF copy to clipboard handler
  ipcMain.handle('pdf:copy', async (_, fileName: string, data: number[]) => {
    const tempPath = join(tmpdir(), fileName)
    await writeFile(tempPath, Buffer.from(data))
    if (process.platform === 'darwin') {
      const { execSync } = await import('child_process')
      execSync(`osascript -e 'set the clipboard to POSIX file "${tempPath}"'`)
    } else {
      clipboard.writeBuffer('FileNameW', Buffer.from(tempPath + '\0', 'ucs2'))
    }
    return true
  })
}
