import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePedidos } from '../hooks/usePedidos'
import { usePropostas } from '../hooks/usePropostas'
import { useClientes } from '../hooks/useClientes'
import { useFaturas } from '../hooks/useFaturas'
import type { PedidoStatus, PropostaStatus } from '../../shared/types'
import PageHeader from '../components/PageHeader'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const PEDIDO_STATUS: Record<PedidoStatus, { label: string; dot: string }> = {
  aberto: { label: 'Aberto', dot: 'bg-blue-500' },
  rejeitado: { label: 'Rejeitado', dot: 'bg-red-500' },
  faturado: { label: 'Faturado', dot: 'bg-green-500' }
}

const PROPOSTA_STATUS: Record<PropostaStatus, { label: string; dot: string }> = {
  pendente: { label: 'Pendente', dot: 'bg-amber-500' },
  aceita: { label: 'Aceita', dot: 'bg-green-500' },
  rejeitada: { label: 'Rejeitada', dot: 'bg-red-500' }
}

export default function OverviewPage() {
  const { data: pedidos, loading: loadingPedidos } = usePedidos()
  const { data: propostas, loading: loadingPropostas } = usePropostas()
  const { data: clientes, loading: loadingClientes } = useClientes()
  const { data: faturas, loading: loadingFaturas } = useFaturas()
  const navigate = useNavigate()

  const propostaStats = useMemo(() => {
    let pendentes = 0, aceitas = 0, rejeitadas = 0
    let valorPendente = 0, valorTotal = 0

    for (const p of propostas) {
      valorTotal += p.total_geral
      if (p.status === 'pendente') { pendentes++; valorPendente += p.total_geral }
      if (p.status === 'aceita') aceitas++
      if (p.status === 'rejeitada') rejeitadas++
    }

    const taxaConversao = propostas.length > 0
      ? Math.round((aceitas / propostas.length) * 100)
      : 0

    return { total: propostas.length, pendentes, aceitas, rejeitadas, valorPendente, valorTotal, taxaConversao }
  }, [propostas])

  const pedidoStats = useMemo(() => {
    let abertos = 0, faturados = 0
    let valorAberto = 0, valorTotal = 0

    for (const p of pedidos) {
      valorTotal += p.total_geral
      if (p.status === 'aberto') { abertos++; valorAberto += p.total_geral }
      if (p.status === 'faturado') faturados++
    }

    return { total: pedidos.length, abertos, faturados, valorAberto, valorTotal }
  }, [pedidos])

  const faturaStats = useMemo(() => {
    let valorPendente = 0, valorPago = 0, pendentes = 0, pagas = 0

    for (const f of faturas) {
      if (f.status === 'paga') { pagas++; valorPago += f.total }
      else { pendentes++; valorPendente += f.total }
    }

    return { total: faturas.length, pendentes, pagas, valorPendente, valorPago, valorTotal: valorPendente + valorPago }
  }, [faturas])

  const recentPropostas = useMemo(() => {
    return [...propostas]
      .sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
      .slice(0, 5)
  }, [propostas])

  const recentPedidos = useMemo(() => {
    return [...pedidos]
      .sort((a, b) => b.data_emissao.localeCompare(a.data_emissao))
      .slice(0, 5)
  }, [pedidos])

  const topClientes = useMemo(() => {
    const map = new Map<string, { nome: string; totalPropostas: number; totalPedidos: number; count: number }>()
    for (const p of propostas) {
      const existing = map.get(p.cliente.nome)
      if (existing) { existing.totalPropostas += p.total_geral; existing.count++ }
      else map.set(p.cliente.nome, { nome: p.cliente.nome, totalPropostas: p.total_geral, totalPedidos: 0, count: 1 })
    }
    for (const p of pedidos) {
      const existing = map.get(p.cliente.nome)
      if (existing) { existing.totalPedidos += p.total_geral; existing.count++ }
      else map.set(p.cliente.nome, { nome: p.cliente.nome, totalPropostas: 0, totalPedidos: p.total_geral, count: 1 })
    }
    return [...map.values()].sort((a, b) => (b.totalPropostas + b.totalPedidos) - (a.totalPropostas + a.totalPedidos)).slice(0, 5)
  }, [propostas, pedidos])

  const loading = loadingPedidos || loadingPropostas || loadingClientes || loadingFaturas

  if (loading) {
    return (
      <div>
        <PageHeader title="Overview" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Overview" />

      {/* Pipeline resumo - fluxo visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => navigate('/propostas')}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left transition-all hover:shadow-md hover:border-amber-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Propostas</span>
            <span className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{propostaStats.pendentes} <span className="text-sm font-normal text-gray-400">pendentes</span></p>
          <p className="text-sm text-amber-600 font-medium mt-1">{formatCurrency(propostaStats.valorPendente)}</p>
        </button>

        <button
          onClick={() => navigate('/pedidos')}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left transition-all hover:shadow-md hover:border-blue-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pedidos</span>
            <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pedidoStats.abertos} <span className="text-sm font-normal text-gray-400">abertos</span></p>
          <p className="text-sm text-blue-600 font-medium mt-1">{formatCurrency(pedidoStats.valorAberto)}</p>
        </button>

        <button
          onClick={() => navigate('/faturas')}
          className="bg-white rounded-xl border border-gray-200 p-5 text-left transition-all hover:shadow-md hover:border-violet-300 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Faturas</span>
            <span className="w-7 h-7 rounded-full bg-violet-50 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{faturaStats.pendentes} <span className="text-sm font-normal text-gray-400">pendentes</span></p>
          <p className="text-sm text-violet-600 font-medium mt-1">{formatCurrency(faturaStats.valorPendente)}</p>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Faturamento Total</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(faturaStats.valorTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recebido</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(faturaStats.valorPago)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{faturaStats.pagas} faturas pagas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Taxa de Conversao</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{propostaStats.taxaConversao}%</p>
          <p className="text-xs text-gray-400 mt-0.5">{propostaStats.aceitas} de {propostaStats.total} propostas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Clientes</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{clientes.length}</p>
        </div>
      </div>

      {/* Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Propostas Recentes */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Propostas Recentes</h3>
            <button
              onClick={() => navigate('/propostas')}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
            >
              Ver todas
            </button>
          </div>
          {recentPropostas.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Nenhuma proposta ainda
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPropostas.map((p) => {
                const st = PROPOSTA_STATUS[p.status]
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/propostas/${p.id}/editar`)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span className="text-sm font-medium text-gray-900">{p.numero}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate pl-4">
                        {p.cliente.nome} · {formatDate(p.data_emissao)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-4 shrink-0">
                      {formatCurrency(p.total_geral)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pedidos Recentes */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Pedidos Recentes</h3>
            <button
              onClick={() => navigate('/pedidos')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Ver todos
            </button>
          </div>
          {recentPedidos.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Nenhum pedido ainda
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPedidos.map((p) => {
                const st = PEDIDO_STATUS[p.status]
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/pedidos/${p.id}/editar`)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                        <span className="text-sm font-medium text-gray-900">{p.numero}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate pl-4">
                        {p.cliente.nome} · {formatDate(p.data_emissao)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-4 shrink-0">
                      {formatCurrency(p.total_geral)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Clientes */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Top Clientes</h3>
            <button
              onClick={() => navigate('/clientes')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Ver todos
            </button>
          </div>
          {topClientes.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Nenhum cliente com movimento
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topClientes.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.count} movimento{c.count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-4 shrink-0">
                    {formatCurrency(c.totalPropostas + c.totalPedidos)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
