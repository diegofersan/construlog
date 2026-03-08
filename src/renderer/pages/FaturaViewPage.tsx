import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import { useFaturas } from '../hooks/useFaturas'
import type { Fatura, FaturaStatus } from '../../shared/types'
import { exportFaturaPdf } from '../utils/exportPdf'
import ExportPdfButton from '../components/ExportPdfButton'

const FATURA_STATUS_CONFIG: Record<FaturaStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  paga: { label: 'Paga', bg: 'bg-green-100', text: 'text-green-700' }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FaturaViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById, update } = useFaturas()
  const [fatura, setFatura] = useState<Fatura | null>(null)
  const [loading, setLoading] = useState(true)

  async function toggleStatus() {
    if (!fatura) return
    const newStatus: FaturaStatus = (fatura.status || 'pendente') === 'pendente' ? 'paga' : 'pendente'
    const updated = await update(fatura.id, { status: newStatus })
    if (updated) setFatura(updated)
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getById(id).then((f) => {
      if (cancelled) return
      setFatura(f ?? null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, getById])

  if (loading) {
    return (
      <div>
        <PageHeader title="Carregando..." />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-violet-600" />
        </div>
      </div>
    )
  }

  if (!fatura) {
    return (
      <div>
        <PageHeader title="Fatura nao encontrada" />
        <p className="text-sm text-gray-500">A fatura solicitada nao existe.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/faturas')}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Fatura {fatura.numero}
            {(() => {
              const s = fatura.status || 'pendente'
              const cfg = FATURA_STATUS_CONFIG[s]
              return (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                  {cfg.label}
                </span>
              )
            })()}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/faturas')}>
              Voltar
            </Button>
            <Button
              variant="secondary"
              onClick={toggleStatus}
            >
              {(fatura.status || 'pendente') === 'pendente' ? 'Marcar como Paga' : 'Marcar como Pendente'}
            </Button>
            <ExportPdfButton onExport={(mode) => exportFaturaPdf(fatura, mode)} />
          </div>
        }
      />

      {/* Dados da Fatura */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Dados da Fatura</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Numero</p>
            <p className="text-sm font-medium text-gray-900">{fatura.numero}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Data de Emissao</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(fatura.data_emissao)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Pedido</p>
            <button
              onClick={() => navigate(`/pedidos/${fatura.pedido_id}/editar`)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {fatura.pedido_numero}
            </button>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase">Nome</p>
            <p className="text-sm font-medium text-gray-900">{fatura.cliente.nome}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Endereco de Entrega</p>
            <p className="text-sm font-medium text-gray-900">{fatura.cliente.endereco_entrega}</p>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Itens</h2>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descricao</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Servico</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Desc. (%)</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {fatura.itens.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-gray-900">{item.descricao}</td>
                  <td className="px-4 py-2 text-gray-600">{formatDate(item.data_servico)}</td>
                  <td className="px-4 py-2 text-gray-600">{item.unidade}</td>
                  <td className="px-4 py-2 text-gray-900 text-right">{item.quantidade}</td>
                  <td className="px-4 py-2 text-gray-900 text-right">{formatCurrency(item.valor_unitario)}</td>
                  <td className="px-4 py-2 text-gray-600 text-right">{item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-'}</td>
                  <td className="px-4 py-2 text-gray-900 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="mb-6 flex justify-end">
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-6 py-3">
          <span className="text-sm text-violet-600 mr-4">Total:</span>
          <span className="text-lg font-bold text-violet-900">
            {formatCurrency(fatura.total)}
          </span>
        </div>
      </div>

      {/* Observacao */}
      {fatura.observacao && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-xs text-gray-500 uppercase mb-2">Observacao</h2>
          <p className="text-sm text-gray-900">{fatura.observacao}</p>
        </div>
      )}
    </div>
  )
}
