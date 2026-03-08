import { app, BrowserWindow } from 'electron'
import { execFile, spawn } from 'child_process'
import { createWriteStream, writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import https from 'https'

const REPO = 'diegofersan/construlog'

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  assets: GitHubAsset[]
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
  }
  return 0
}

function fetchJSON(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const get = (reqUrl: string) => {
      https.get(reqUrl, { headers: { 'User-Agent': 'construlog-updater' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location!)
        }
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode === 200) resolve(JSON.parse(data))
          else reject(new Error(`HTTP ${res.statusCode}`))
        })
      }).on('error', reject)
    }
    get(url)
  })
}

function downloadFile(url: string, dest: string, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const get = (reqUrl: string) => {
      https.get(reqUrl, { headers: { 'User-Agent': 'construlog-updater' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location!)
        }
        const total = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0
        const file = createWriteStream(dest)
        res.on('data', (chunk) => {
          downloaded += chunk.length
          if (total > 0 && onProgress) {
            onProgress(Math.round((downloaded / total) * 100))
          }
        })
        res.pipe(file)
        file.on('finish', () => { file.close(); resolve() })
        file.on('error', reject)
      }).on('error', reject)
    }
    get(url)
  })
}

let pendingVersion = ''
let pendingZipPath = ''

export async function checkForUpdates(win: BrowserWindow): Promise<void> {
  try {
    const release: GitHubRelease = await fetchJSON(
      `https://api.github.com/repos/${REPO}/releases/latest`
    )

    const latestVersion = release.tag_name.replace(/^v/, '')
    const currentVersion = app.getVersion()

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      win.webContents.send('update-not-available')
      return
    }

    // Find the macOS zip asset
    const zipAsset = release.assets.find(
      (a) => a.name.endsWith('.zip') && a.name.includes('arm64')
    )

    if (!zipAsset) {
      win.webContents.send('update-error', 'Ficheiro de atualização não encontrado na release.')
      return
    }

    win.webContents.send('update-available', latestVersion)

    // Download the zip
    const tmpDir = join(app.getPath('temp'), 'construlog-update')
    mkdirSync(tmpDir, { recursive: true })
    const zipPath = join(tmpDir, 'update.zip')

    await downloadFile(zipAsset.browser_download_url, zipPath)

    pendingVersion = latestVersion
    pendingZipPath = zipPath

    win.webContents.send('update-downloaded', latestVersion)
  } catch (err: any) {
    win.webContents.send('update-error', err.message || 'Erro desconhecido')
  }
}

export function installUpdate(): void {
  if (!pendingZipPath) return

  const appBundlePath = app.getPath('exe').replace(/\/Contents\/MacOS\/.*$/, '')
  const tmpDir = join(app.getPath('temp'), 'construlog-update')

  const script = `#!/bin/bash
sleep 1
ditto -xk "${pendingZipPath}" "${tmpDir}/extracted"
APP=$(find "${tmpDir}/extracted" -maxdepth 1 -name "*.app" | head -1)
if [ -z "$APP" ]; then
  exit 1
fi
rm -rf "${appBundlePath}"
mv "$APP" "${appBundlePath}"
xattr -cr "${appBundlePath}"
open "${appBundlePath}"
rm -rf "${tmpDir}"
`
  const scriptPath = join(tmpDir, 'update.sh')
  writeFileSync(scriptPath, script, { mode: 0o755 })

  spawn('/bin/bash', [scriptPath], { detached: true, stdio: 'ignore' }).unref()
  app.quit()
}
