import { google, drive_v3 } from 'googleapis'
import { Readable } from 'stream'
import { getAuthClient } from './auth'

let driveClient: drive_v3.Drive | null = null
let rootFolderId: string | null = null
const subfolderIds: Record<string, string> = {}

function getDrive(): drive_v3.Drive {
  if (!driveClient) {
    driveClient = google.drive({ version: 'v3', auth: getAuthClient() })
  }
  return driveClient
}

async function findFolder(name: string, parentId?: string): Promise<string | null> {
  const drive = getDrive()
  let q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  if (parentId) q += ` and '${parentId}' in parents`

  const res = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' })
  return res.data.files?.[0]?.id ?? null
}

async function createFolder(name: string, parentId?: string): Promise<string> {
  const drive = getDrive()
  const requestBody: drive_v3.Schema$File = {
    name,
    mimeType: 'application/vnd.google-apps.folder'
  }
  if (parentId) requestBody.parents = [parentId]

  const res = await drive.files.create({ requestBody, fields: 'id' })
  return res.data.id!
}

async function ensureFolder(name: string, parentId?: string): Promise<string> {
  const existing = await findFolder(name, parentId)
  if (existing) return existing
  return createFolder(name, parentId)
}

export async function ensureFolderStructure(): Promise<void> {
  rootFolderId = await ensureFolder('Construlog')
  const subfolders = ['propostas', 'clientes', 'tabelas-precos', 'pedidos', 'faturas']
  for (const sub of subfolders) {
    subfolderIds[sub] = await ensureFolder(sub, rootFolderId)
  }
}

export function getSubfolderId(entity: string): string {
  const id = subfolderIds[entity]
  if (!id) throw new Error(`Subfolder not initialized for entity: ${entity}`)
  return id
}

export async function uploadFile(
  entity: string,
  fileName: string,
  content: string
): Promise<{ id: string; modifiedTime: string }> {
  const drive = getDrive()
  const folderId = getSubfolderId(entity)

  const existing = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive'
  })

  const media = { mimeType: 'application/json', body: Readable.from(content) }

  if (existing.data.files?.length) {
    const fileId = existing.data.files[0].id!
    const res = await drive.files.update({
      fileId,
      media,
      fields: 'id,modifiedTime'
    })
    return { id: res.data.id!, modifiedTime: res.data.modifiedTime! }
  }

  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media,
    fields: 'id,modifiedTime'
  })
  return { id: res.data.id!, modifiedTime: res.data.modifiedTime! }
}

export async function downloadFile(fileId: string): Promise<string> {
  const drive = getDrive()
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' })
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
}

export async function listFiles(
  entity: string
): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  const drive = getDrive()
  const folderId = getSubfolderId(entity)

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,modifiedTime)',
    spaces: 'drive'
  })

  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    modifiedTime: f.modifiedTime!
  }))
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDrive()
  await drive.files.delete({ fileId })
}

export function resetDriveClient(): void {
  driveClient = null
  rootFolderId = null
  Object.keys(subfolderIds).forEach((k) => delete subfolderIds[k])
}
