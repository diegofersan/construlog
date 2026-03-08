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

export default function SettingsPage() {
  const [provider, setProvider] = useState<AIProvider>('openai')
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  useEffect(() => {
    window.electronAPI.settings.getAI().then((settings) => {
      if (settings) {
        setProvider(settings.provider)
        setApiKey(settings.apiKey)
      }
      setLoading(false)
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

      <div className="max-w-lg">
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
