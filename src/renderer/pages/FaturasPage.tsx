import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useFaturas } from '../hooks/useFaturas'
import type { Fatura, FaturaStatus } from '../../shared/types'
import { exportFaturaPdf } from '../utils/exportPdf'

const receiptIcon = (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
)

const FATURA_STATUS_CONFIG: Record<FaturaStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  paga: { label: 'Paga', bg: 'bg-green-100', text: 'text-green-700' }
}

function FaturaStatusBadge({ status }: { status: FaturaStatus }) {
  const s = status || 'pendente'
  const config = FATURA_STATUS_CONFIG[s]
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type FilterStatus = FaturaStatus | 'todas'

export default function FaturasPage() {
  const { data: faturas, loading, remove } = useFaturas()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [deleteFatura, setDeleteFatura] = useState<Fatura | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas')

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: faturas.length, pendente: 0, paga: 0 }
    for (const f of faturas) {
      const s = f.status || 'pendente'
      counts[s] = (counts[s] || 0) + 1
    }
    return counts
  }, [faturas])

  const sorted = useMemo(() => {
    let list = [...faturas].sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
    if (filterStatus !== 'todas') {
      list = list.filter((f) => (f.status || 'pendente') === filterStatus)
    }
    if (!search.trim()) return list
    const term = search.toLowerCase()
    return list.filter(
      (f) =>
        f.numero.toLowerCase().includes(term) ||
        f.cliente.nome.toLowerCase().includes(term)
    )
  }, [faturas, search, filterStatus])

  const summaryCards = useMemo(() => {
    const totalValor = faturas.reduce((sum, f) => sum + f.total, 0)
    const pendentes = faturas.filter((f) => (f.status || 'pendente') === 'pendente')
    const valorPendente = pendentes.reduce((sum, f) => sum + f.total, 0)
    const pagas = faturas.filter((f) => f.status === 'paga')
    const valorPago = pagas.reduce((sum, f) => sum + f.total, 0)
    return { total: faturas.length, totalValor, pendentes: pendentes.length, valorPendente, pagas: pagas.length, valorPago }
  }, [faturas])

  async function handleDelete() {
    if (!deleteFatura) return
    try {
      await remove(deleteFatura.id)
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir fatura. Tente novamente.')
    }
    setDeleteFatura(null)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Faturas" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-violet-600" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Faturas" />

      {faturas.length === 0 ? (
        <EmptyState
          icon={receiptIcon}
          title="Sem faturas"
          description="As faturas sao geradas a partir dos pedidos."
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total de Faturas</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{summaryCards.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Valor Total</p>
              <p className="text-2xl font-semibold text-violet-600 mt-1">{formatCurrency(summaryCards.totalValor)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{formatCurrency(summaryCards.valorPendente)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pagas</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{formatCurrency(summaryCards.valorPago)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['todas', 'pendente', 'paga'] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  filterStatus === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'todas' ? 'Todas' : FATURA_STATUS_CONFIG[s].label} ({statusCounts[s] || 0})
              </button>
            ))}
          </div>

          <div className="mb-4 max-w-sm">
            <Input
              placeholder="Buscar por cliente ou numero..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numero</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorted.map((fatura) => (
                  <tr key={fatura.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                        {fatura.numero}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">{formatDate(fatura.data_emissao)}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">{fatura.pedido_numero}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">{fatura.cliente.nome}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm">
                      <FaturaStatusBadge status={fatura.status} />
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 text-right font-medium">{formatCurrency(fatura.total)}</td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => navigate(`/faturas/${fatura.id}`)}>
                          Ver
                        </Button>
                        <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={async () => {
                          try {
                            await exportFaturaPdf(fatura)
                          } catch (err) {
                            console.error('Erro ao exportar PDF:', err)
                            alert('Erro ao exportar PDF. Tente novamente.')
                          }
                        }}>
                          PDF
                        </Button>
                        <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => setDeleteFatura(fatura)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 sm:px-6 py-8 text-center text-sm text-gray-500">
                      Nenhuma fatura encontrada para "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={!!deleteFatura} onClose={() => setDeleteFatura(null)} title="Excluir Fatura">
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir a fatura <strong>{deleteFatura?.numero}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteFatura(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
