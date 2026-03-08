import { app, safeStorage, shell } from 'electron'
import { google } from 'googleapis'
import { createServer } from 'http'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

// Para obter CLIENT_ID e CLIENT_SECRET:
// 1. Aceda a https://console.cloud.google.com/
// 2. Crie um projeto novo (ou selecione existente)
// 3. Ative a Google Drive API em "APIs & Services" > "Library"
// 4. Vá a "APIs & Services" > "Credentials" > "Create Credentials" > "OAuth client ID"
// 5. Tipo de aplicação: "Desktop app"
// 6. Copie o Client ID e Client Secret gerados
const CLIENT_ID = 'YOUR_CLIENT_ID'
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
const REDIRECT_PORT = 48321
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`
const SCOPES = ['https://www.googleapis.com/auth/drive.file']

const tokensPath = join(app.getPath('userData'), 'auth-tokens.json')

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

export function getAuthClient(): typeof oauth2Client {
  return oauth2Client
}

export function isAuthenticated(): boolean {
  return !!oauth2Client.credentials?.access_token
}

export function loadStoredTokens(): boolean {
  if (!existsSync(tokensPath)) return false
  try {
    const encrypted = readFileSync(tokensPath)
    const decrypted = safeStorage.decryptString(encrypted)
    const tokens = JSON.parse(decrypted)
    oauth2Client.setCredentials(tokens)
    return true
  } catch {
    return false
  }
}

function saveTokens(): void {
  const encrypted = safeStorage.encryptString(JSON.stringify(oauth2Client.credentials))
  writeFileSync(tokensPath, encrypted)
}

oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token) {
    const existing = oauth2Client.credentials
    oauth2Client.setCredentials({ ...existing, ...tokens })
  }
  saveTokens()
})

export async function login(): Promise<boolean> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  })

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      if (!req.url?.startsWith('/callback')) {
        res.writeHead(404)
        res.end()
        return
      }

      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`)
      const code = url.searchParams.get('code')

      if (!code) {
        res.writeHead(400)
        res.end('Código de autorização não encontrado.')
        server.close()
        resolve(false)
        return
      }

      try {
        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)
        saveTokens()

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<html><body><h2>Login realizado com sucesso!</h2><p>Pode fechar esta janela.</p></body></html>')
        server.close()
        resolve(true)
      } catch {
        res.writeHead(500)
        res.end('Erro ao obter tokens.')
        server.close()
        resolve(false)
      }
    })

    server.listen(REDIRECT_PORT, () => {
      shell.openExternal(authUrl)
    })

    server.on('error', () => {
      resolve(false)
    })
  })
}

export function logout(): void {
  oauth2Client.revokeCredentials().catch(() => {})
  oauth2Client.setCredentials({})
  if (existsSync(tokensPath)) {
    unlinkSync(tokensPath)
  }
}
