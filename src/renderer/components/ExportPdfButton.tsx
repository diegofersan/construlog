import { useState, useRef, useEffect } from 'react'
import Button from './Button'

interface ExportPdfButtonProps {
  onExport: (mode: 'save' | 'copy') => Promise<void>
}

export default function ExportPdfButton({ onExport }: ExportPdfButtonProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handle(mode: 'save' | 'copy') {
    setBusy(true)
    setOpen(false)
    try {
      await onExport(mode)
      if (mode === 'copy') {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // errors handled by caller
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <div className="flex">
        <Button
          variant="secondary"
          onClick={() => handle('save')}
          disabled={busy}
          className="!rounded-r-none !border-r-0"
        >
          {busy ? 'Gerando...' : copied ? 'Copiado!' : 'Exportar PDF'}
        </Button>
        <button
          onClick={() => setOpen((p) => !p)}
          disabled={busy}
          className="px-2 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-r-lg text-gray-600 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={() => handle('save')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Salvar como...
          </button>
          <button
            onClick={() => handle('copy')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
            </svg>
            Copiar para transferencia
          </button>
        </div>
      )}
    </div>
  )
}
