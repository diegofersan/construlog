import { contextBridge, ipcRenderer } from 'electron'

function makeCrudApi(entity: string) {
  return {
    list: () => ipcRenderer.invoke(`${entity}:list`),
    get: (id: string) => ipcRenderer.invoke(`${entity}:get`, id),
    create: (data: unknown) => ipcRenderer.invoke(`${entity}:create`, data),
    update: (id: string, data: unknown) => ipcRenderer.invoke(`${entity}:update`, id, data),
    delete: (id: string) => ipcRenderer.invoke(`${entity}:delete`, id)
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  onUpdateAvailable: (callback: () => void) =>
    ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', callback),
  pedidos: makeCrudApi('pedidos'),
  clientes: makeCrudApi('clientes'),
  tabelasPrecos: makeCrudApi('tabelas-precos'),
  faturas: makeCrudApi('faturas'),
  propostas: makeCrudApi('propostas'),
  savePdf: (fileName: string, data: number[]) => ipcRenderer.invoke('pdf:save', fileName, data),
  settings: {
    getAI: () => ipcRenderer.invoke('settings:getAI'),
    saveAI: (data: unknown) => ipcRenderer.invoke('settings:saveAI', data)
  },
  ai: {
    execute: (command: string, context?: unknown, history?: unknown[]) => ipcRenderer.invoke('ai:execute', command, context, history),
    testKey: (provider: string, apiKey: string) => ipcRenderer.invoke('ai:testKey', provider, apiKey)
  },
  sync: {
    start: () => ipcRenderer.invoke('sync:start'),
    status: () => ipcRenderer.invoke('sync:status'),
    login: () => ipcRenderer.invoke('sync:login'),
    logout: () => ipcRenderer.invoke('sync:logout'),
    isAuthenticated: () => ipcRenderer.invoke('sync:isAuthenticated')
  }
})
