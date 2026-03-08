import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useClientes } from '../hooks/useClientes'
import { usePropostas } from '../hooks/usePropostas'
import { usePedidos } from '../hooks/usePedidos'
import { useFaturas } from '../hooks/useFaturas'
import { useTabelasPrecos } from '../hooks/useTabelasPrecos'
import type { Cliente, PropostaStatus, PedidoStatus, FaturaStatus } from '../../shared/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const PROPOSTA_STATUS: Record<PropostaStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  aceita: { label: 'Aceita', bg: 'bg-green-100', text: 'text-green-700' },
  rejeitada: { label: 'Rejeitada', bg: 'bg-red-100', text: 'text-red-700' }
}

const PEDIDO_STATUS: Record<PedidoStatus, { label: string; bg: string; text: string }> = {
  aberto: { label: 'Aberto', bg: 'bg-blue-100', text: 'text-blue-700' },
  rejeitado: { label: 'Rejeitado', bg: 'bg-red-100', text: 'text-red-700' },
  faturado: { label: 'Faturado', bg: 'bg-green-100', text: 'text-green-700' }
}

const FATURA_STATUS: Record<FaturaStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  paga: { label: 'Paga', bg: 'bg-green-100', text: 'text-green-700' }
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getById, update } = useClientes()
  const { data: propostas } = usePropostas()
  const { data: pedidos } = usePedidos()
  const { data: faturas } = useFaturas()
  const { data: tabelas } = useTabelasPrecos()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [tabelaPrecoId, setTabelaPrecoId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    getById(id).then((c) => {
      if (!c) {
        setLoading(false)
        navigate('/clientes')
        return
      }
      setCliente(c)
      setLoading(false)
    })
  }, [id, getById, navigate])

  const clientePropostas = useMemo(() => {
    if (!id) return []
    return propostas
      .filter((p) => p.cliente.id === id || p.cliente.nome === cliente?.nome)
      .sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
  }, [id, propostas, cliente])

  const clientePedidos = useMemo(() => {
    if (!id) return []
    return pedidos
      .filter((p) => p.cliente.id === id || p.cliente.nome === cliente?.nome)
      .sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
  }, [id, pedidos, cliente])

  const clienteFaturas = useMemo(() => {
    if (!id) return []
    return faturas
      .filter((f) => f.cliente.id === id || f.cliente.nome === cliente?.nome)
      .sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
  }, [id, faturas, cliente])

  const stats = useMemo(() => {
    const totalPropostas = clientePropostas.reduce((s, p) => s + p.total_geral, 0)
    const totalPedidos = clientePedidos.reduce((s, p) => s + p.total_geral, 0)
    const totalFaturas = clienteFaturas.reduce((s, f) => s + f.total, 0)
    const totalPago = clienteFaturas.filter((f) => f.status === 'paga').reduce((s, f) => s + f.total, 0)
    const totalPendente = clienteFaturas.filter((f) => f.status === 'pendente').reduce((s, f) => s + f.total, 0)
    return { totalPropostas, totalPedidos, totalFaturas, totalPago, totalPendente }
  }, [clientePropostas, clientePedidos, clienteFaturas])

  function openEdit() {
    if (!cliente) return
    setNome(cliente.nome)
    setEndereco(cliente.endereco)
    setTabelaPrecoId(cliente.tabelaPrecoId)
    setEditOpen(true)
  }

  async function handleSave() {
    if (!id || !nome.trim()) return
    setSaving(true)
    try {
      const updated = await update(id, { nome: nome.trim(), endereco: endereco.trim(), tabelaPrecoId })
      if (updated) setCliente(updated)
      setEditOpen(false)
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const tabelaNome = useMemo(() => {
    if (!cliente?.tabelaPrecoId) return null
    return tabelas.find((t) => t.id === cliente.tabelaPrecoId)?.nome || null
  }, [cliente, tabelas])

  if (loading) {
    return (
      <div>
        <PageHeader title="Carregando..." />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  if (!cliente) return null

  return (
    <div>
      <PageHeader
        title={cliente.nome}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/clientes')}>Voltar</Button>
            <Button onClick={openEdit}>Editar</Button>
          </div>
        }
      />

      {/* Info + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Client Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Informacoes</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Endereco</p>
              <p className="text-sm font-medium text-gray-900">{cliente.endereco || 'Nao informado'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tabela de Precos</p>
              <p className="text-sm font-medium text-gray-900">{tabelaNome || 'Nenhuma'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cliente desde</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(cliente.createdAt.slice(0, 10))}</p>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Resumo Financeiro</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Propostas</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(stats.totalPropostas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Pedidos</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(stats.totalPedidos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Faturado</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(stats.totalFaturas)}</span>
            </div>
          </div>
        </div>

        {/* Counts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Movimento</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{clientePropostas.length}</p>
              <p className="text-xs text-gray-500">Propostas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{clientePedidos.length}</p>
              <p className="text-xs text-gray-500">Pedidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-600">{clienteFaturas.length}</p>
              <p className="text-xs text-gray-500">Faturas</p>
            </div>
          </div>
          {stats.totalPendente > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-xs text-amber-600 font-medium">Pendente</span>
              <span className="text-xs text-amber-600 font-bold">{formatCurrency(stats.totalPendente)}</span>
            </div>
          )}
          {stats.totalPago > 0 && (
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-green-600 font-medium">Recebido</span>
              <span className="text-xs text-green-600 font-bold">{formatCurrency(stats.totalPago)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Propostas */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Propostas ({clientePropostas.length})</h3>
          <Link to="/propostas/novo" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
            + Nova Proposta
          </Link>
        </div>
        {clientePropostas.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">Nenhuma proposta</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clientePropostas.map((p) => {
              const st = PROPOSTA_STATUS[p.status]
              return (
                <Link
                  key={p.id}
                  to={`/propostas/${p.id}/editar`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{p.numero}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{formatDate(p.data_emissao)}</span>
                    <span className="text-sm font-semibold text-gray-900 w-28 text-right">{formatCurrency(p.total_geral)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Pedidos */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Pedidos ({clientePedidos.length})</h3>
          <Link to="/pedidos/novo" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            + Novo Pedido
          </Link>
        </div>
        {clientePedidos.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">Nenhum pedido</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clientePedidos.map((p) => {
              const st = PEDIDO_STATUS[p.status]
              return (
                <Link
                  key={p.id}
                  to={`/pedidos/${p.id}/editar`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{p.numero}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{formatDate(p.data_emissao)}</span>
                    <span className="text-sm font-semibold text-gray-900 w-28 text-right">{formatCurrency(p.total_geral)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Faturas */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Faturas ({clienteFaturas.length})</h3>
        </div>
        {clienteFaturas.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">Nenhuma fatura</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clienteFaturas.map((f) => {
              const st = FATURA_STATUS[f.status]
              return (
                <Link
                  key={f.id}
                  to={`/faturas/${f.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{f.numero}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{formatDate(f.data_emissao)}</span>
                    <span className="text-sm font-semibold text-gray-900 w-28 text-right">{formatCurrency(f.total)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Cliente">
        <div className="flex flex-col gap-4">
          <Input
            label="Nome *"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do cliente"
          />
          <Input
            label="Endereco"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereco"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tabela de Precos</label>
            <select
              value={tabelaPrecoId}
              onChange={(e) => setTabelaPrecoId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Sem tabela</option>
              {tabelas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !nome.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
