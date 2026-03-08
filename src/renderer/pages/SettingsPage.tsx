import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import type { AIProvider, AISettings } from '../../shared/types'

const providers: { value: AIProvider; label: string; placeholder: string }[] = [
  { value: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { value: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
  { value: 'anthropic', label: 'Anthropic (Claude)', placeholder: 'sk-ant-...' }
]

type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export default function SettingsPage() {
  const [provider, setProvider] = useState<AIProvider>('openai')
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  // Update state
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle')
  const [newVersion, setNewVersion] = useState('')
  const [updateError, setUpdateError] = useState('')

  useEffect(() => {
    window.electronAPI.settings.getAI().then((settings) => {
      if (settings) {
        setProvider(settings.provider)
        setApiKey(settings.apiKey)
      }
      setLoading(false)
    })
    window.electronAPI.getVersion().then(setAppVersion)
  }, [])

  useEffect(() => {
    window.electronAPI.onUpdateAvailable((version) => {
      setNewVersion(version)
      setUpdateStatus('downloading')
    })
    window.electronAPI.onUpdateNotAvailable(() => {
      setUpdateStatus('not-available')
    })
    window.electronAPI.onUpdateDownloaded((version) => {
      setNewVersion(version)
      setUpdateStatus('downloaded')
    })
    window.electronAPI.onUpdateError((msg) => {
      setUpdateError(msg)
      setUpdateStatus('error')
    })
  }, [])

  async function handleSave() {
    const settings: AISettings = { provider, apiKey: apiKey.trim() }
    await window.electronAPI.settings.saveAI(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const result = await window.electronAPI.ai.testKey(provider, apiKey.trim())
    setTestResult(result)
    setTesting(false)
  }

  function handleCheckUpdates() {
    setUpdateStatus('checking')
    setUpdateError('')
    window.electronAPI.checkForUpdates()
  }

  function handleInstallUpdate() {
    window.electronAPI.installUpdate()
  }

  const current = providers.find((p) => p.value === provider)!

  if (loading) {
    return (
      <div>
        <PageHeader title="Definições" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Definições" />

      <div className="max-w-lg flex flex-col gap-6">
        {/* Updates section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Atualizações</h3>
          <p className="text-sm text-gray-500 mb-6">
            Verifique e instale novas versões da aplicação.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">Versão atual:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">v{appVersion}</span>
              </div>
            </div>

            {updateStatus === 'not-available' && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                A aplicação está atualizada.
              </div>
            )}

            {updateStatus === 'downloading' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Nova versão {newVersion} encontrada. A transferir...
              </div>
            )}

            {updateStatus === 'downloaded' && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                <p className="font-medium">Versão {newVersion} pronta a instalar.</p>
                <p className="mt-1">A aplicação será reiniciada para aplicar a atualização.</p>
              </div>
            )}

            {updateStatus === 'error' && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                Erro ao verificar atualizações{updateError ? `: ${updateError}` : '.'}
              </div>
            )}

            <div className="flex items-center gap-3">
              {updateStatus === 'downloaded' ? (
                <Button onClick={handleInstallUpdate}>
                  Instalar e reiniciar
                </Button>
              ) : (
                <Button
                  onClick={handleCheckUpdates}
                  disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                >
                  {updateStatus === 'checking' ? 'A verificar...' : 'Verificar atualizações'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* AI section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Assistente IA</h3>
          <p className="text-sm text-gray-500 mb-6">
            Configure o provider de IA para gerar pedidos por comando de texto.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Provider</label>
              <div className="flex flex-wrap gap-2">
                {providers.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setProvider(p.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                      provider === p.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="API Key"
              type="password"
              placeholder={current.placeholder}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={!apiKey.trim()}>
                Guardar
              </Button>
              <Button onClick={handleTest} disabled={!apiKey.trim() || testing}>
                {testing ? 'A testar...' : 'Testar'}
              </Button>
              {saved && <span className="text-sm text-green-600 font-medium">Guardado!</span>}
              {testResult && (
                <span className={`text-sm font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.success ? 'Conexão OK!' : testResult.error || 'Erro na conexão'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
