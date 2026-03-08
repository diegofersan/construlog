import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { usePropostas } from '../hooks/usePropostas'
import type { Proposta, PropostaStatus } from '../../shared/types'
import { exportPropostaPdf } from '../utils/exportPdf'

const docIcon = (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_CONFIG: Record<PropostaStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  aceita: { label: 'Aceita', bg: 'bg-green-100', text: 'text-green-700' },
  rejeitada: { label: 'Rejeitada', bg: 'bg-red-100', text: 'text-red-700' }
}

function StatusBadge({ status }: { status: PropostaStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pendente
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

type FilterStatus = PropostaStatus | 'todos'

export default function PropostasPage() {
  const { data: propostas, loading, remove } = usePropostas()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [deleteProposta, setDeleteProposta] = useState<Proposta | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: propostas.length, pendente: 0, aceita: 0, rejeitada: 0 }
    for (const p of propostas) {
      counts[p.status] = (counts[p.status] || 0) + 1
    }
    return counts
  }, [propostas])

  const summaryCards = useMemo(() => {
    const totalValor = propostas.reduce((sum, p) => sum + p.total_geral, 0)
    const pendentes = propostas.filter((p) => p.status === 'pendente').length
    const aceitas = propostas.filter((p) => p.status === 'aceita').length
    const rejeitadas = propostas.filter((p) => p.status === 'rejeitada').length
    return { total: propostas.length, totalValor, pendentes, aceitas, rejeitadas }
  }, [propostas])

  const sorted = useMemo(() => {
    let list = [...propostas].sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
    if (filterStatus !== 'todos') {
      list = list.filter((p) => p.status === filterStatus)
    }
    if (!search.trim()) return list
    const term = search.toLowerCase()
    return list.filter(
      (p) =>
        p.numero.toLowerCase().includes(term) ||
        p.cliente.nome.toLowerCase().includes(term)
    )
  }, [propostas, search, filterStatus])

  async function handleDelete() {
    if (!deleteProposta) return
    try {
      await remove(deleteProposta.id)
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir proposta. Tente novamente.')
    }
    setDeleteProposta(null)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Propostas" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Propostas"
        actions={<Button onClick={() => navigate('/propostas/novo')}>+ Nova Proposta</Button>}
      />

      {propostas.length === 0 ? (
        <EmptyState
          icon={docIcon}
          title="Sem propostas"
          description="Crie a sua primeira proposta para comecar."
          action={<Button onClick={() => navigate('/propostas/novo')}>+ Nova Proposta</Button>}
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total de Propostas</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{summaryCards.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{summaryCards.pendentes}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Aceitas</p>
              <p className="text-2xl font-semibold text-green-600 mt-1">{summaryCards.aceitas}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Rejeitadas</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{summaryCards.rejeitadas}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['todos', 'pendente', 'aceita', 'rejeitada'] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  filterStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'todos' ? 'Todos' : STATUS_CONFIG[s].label} ({statusCounts[s] || 0})
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
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sorted.map((proposta) => (
                  <tr key={proposta.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">{proposta.numero}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">{formatDate(proposta.data_emissao)}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-600">{proposta.cliente.nome}</td>
                    <td className="px-3 sm:px-6 py-4 text-sm">
                      <StatusBadge status={proposta.status} />
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-900 text-right font-medium">{formatCurrency(proposta.total_geral)}</td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => navigate(`/propostas/${proposta.id}/editar`)}>
                          Editar
                        </Button>
                        <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={async () => {
                          try {
                            await exportPropostaPdf(proposta)
                          } catch (err) {
                            console.error('Erro ao exportar PDF:', err)
                            alert('Erro ao exportar PDF. Tente novamente.')
                          }
                        }}>
                          PDF
                        </Button>
                        <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => setDeleteProposta(proposta)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 py-8 text-center text-sm text-gray-500">
                      Nenhuma proposta encontrada para "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={!!deleteProposta} onClose={() => setDeleteProposta(null)} title="Excluir Proposta">
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir a proposta <strong>{deleteProposta?.numero}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteProposta(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
