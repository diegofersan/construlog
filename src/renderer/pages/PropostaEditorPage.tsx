import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import type { PedidoItem, Proposta, Pedido, PriceTable, PropostaStatus } from '../../shared/types'
import { usePropostas } from '../hooks/usePropostas'
import { usePedidos } from '../hooks/usePedidos'
import { useClientes } from '../hooks/useClientes'
import { useTabelasPrecos } from '../hooks/useTabelasPrecos'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import { exportPropostaPdf } from '../utils/exportPdf'
import ExportPdfButton from '../components/ExportPdfButton'

const STATUS_CONFIG: Record<PropostaStatus, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-700' },
  aceita: { label: 'Aceita', bg: 'bg-green-100', text: 'text-green-700' },
  rejeitada: { label: 'Rejeitada', bg: 'bg-red-100', text: 'text-red-700' }
}

const ALL_STATUSES: PropostaStatus[] = ['pendente', 'aceita', 'rejeitada']

function emptyItem(): PedidoItem {
  return {
    descricao: '',
    data_servico: '',
    unidade: '',
    quantidade: 1,
    valor_unitario: 0,
    valor_total_sem_desconto: 0,
    desconto_percentual: 0,
    desconto_valor: 0,
    valor_total: 0
  }
}

function calcItem(item: PedidoItem): PedidoItem {
  const subtotal = item.quantidade * item.valor_unitario
  const descontoValor = subtotal * (item.desconto_percentual / 100)
  return {
    ...item,
    valor_total_sem_desconto: subtotal,
    desconto_valor: descontoValor,
    valor_total: subtotal - descontoValor
  }
}

function generateNumero(existingNumeros: string[]): string {
  const year = new Date().getFullYear()
  const prefix = `P-${year}-`
  let max = 0
  for (const n of existingNumeros) {
    if (n.startsWith(prefix)) {
      const num = parseInt(n.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }
  return `P-${year}-${String(max + 1).padStart(3, '0')}`
}

function generatePedidoNumero(existingNumeros: string[]): string {
  const year = new Date().getFullYear()
  const prefix = `${year}-`
  let max = 0
  for (const n of existingNumeros) {
    if (n.startsWith(prefix)) {
      const num = parseInt(n.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }
  return `${year}-${String(max + 1).padStart(3, '0')}`
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function PropostaEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { data: propostas, create, update, getById } = usePropostas()
  const { data: pedidos, create: createPedido } = usePedidos()
  const { data: clientes } = useClientes()
  const { data: tabelas, getById: getTabelaById } = useTabelasPrecos()

  const [numero, setNumero] = useState('')
  const [dataEmissao, setDataEmissao] = useState(todayStr())
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteEndereco, setClienteEndereco] = useState('')
  const [itens, setItens] = useState<PedidoItem[]>([])
  const [observacao, setObservacao] = useState('')
  const [status, setStatus] = useState<PropostaStatus>('pendente')
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(!!id)
  const [tabelaPrecos, setTabelaPrecos] = useState<PriceTable | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [manualItems, setManualItems] = useState<Set<number>>(new Set())
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState<Pedido | null>(null)

  useEffect(() => {
    if (isNew && numero === '') {
      setNumero(generateNumero(propostas.map((p) => p.numero)))
    }
  }, [isNew, propostas])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getById(id).then((proposta) => {
      if (cancelled) return
      if (!proposta) {
        setLoadingData(false)
        navigate('/propostas')
        return
      }
      setNumero(proposta.numero)
      setDataEmissao(proposta.data_emissao)
      setClienteId(proposta.cliente.id)
      setClienteNome(proposta.cliente.nome)
      setClienteEndereco(proposta.cliente.endereco_entrega)
      setItens(proposta.itens)
      setObservacao(proposta.observacao)
      setStatus(proposta.status)
      setLoadingData(false)
    })
    return () => { cancelled = true }
  }, [id, getById])

  useEffect(() => {
    if (!id || !clienteId || clientes.length === 0) return
    const cliente = clientes.find((c) => c.id === clienteId)
    if (cliente?.tabelaPrecoId) {
      getTabelaById(cliente.tabelaPrecoId).then((t) => {
        if (t) setTabelaPrecos(t)
      })
    }
  }, [id, clienteId, clientes, getTabelaById])

  const totalGeral = useMemo(() => {
    return itens.reduce((sum, item) => sum + item.valor_total, 0)
  }, [itens])

  const priceTableItems = useMemo(() => {
    if (!tabelaPrecos) return []
    const items: { produto: string; unidade: string; preco: number }[] = []
    for (const cat of tabelaPrecos.categorias) {
      for (const item of cat.itens) {
        if (item.produto && item.preco !== null) {
          items.push({ produto: item.produto, unidade: item.unidade, preco: item.preco })
        }
      }
    }
    return items
  }, [tabelaPrecos])

  const selectedTotal = useMemo(() => {
    return itens
      .filter((_, idx) => selectedItems.has(idx))
      .reduce((sum, item) => sum + item.valor_total, 0)
  }, [itens, selectedItems])

  function toggleItemSelection(idx: number) {
    setSelectedItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleAllItems() {
    if (selectedItems.size === itens.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(itens.map((_, i) => i)))
    }
  }

  async function handleConverterEmPedido() {
    if (!id || selectedItems.size === 0) return
    try {
      const selectedItens = itens.filter((_, idx) => selectedItems.has(idx))
      const total = selectedItens.reduce((sum, item) => sum + item.valor_total, 0)

      const pedido = await createPedido({
        numero: generatePedidoNumero(pedidos.map((p) => p.numero)),
        data_emissao: todayStr(),
        cliente: {
          id: clienteId,
          nome: clienteNome,
          endereco_entrega: clienteEndereco
        },
        itens: selectedItens,
        total_geral: total,
        observacao,
        status: 'aberto'
      })

      // Remove converted items from proposta
      const remainingItens = itens.filter((_, idx) => !selectedItems.has(idx))
      const newTotal = remainingItens.reduce((sum, item) => sum + item.valor_total, 0)
      const newStatus: PropostaStatus = remainingItens.length === 0 ? 'aceita' : 'pendente'
      await update(id, {
        itens: remainingItens,
        total_geral: newTotal,
        status: newStatus
      })
      setItens(remainingItens)
      if (remainingItens.length === 0) setStatus('aceita')

      setConvertModalOpen(false)
      setSelectedItems(new Set())
      setConvertSuccess(pedido)
    } catch (err) {
      console.error('Erro ao converter em pedido:', err)
      alert('Erro ao converter proposta em pedido. Tente novamente.')
    }
  }

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  async function handleClienteChange(selectedId: string) {
    setClienteId(selectedId)
    const cliente = clientes.find((c) => c.id === selectedId)
    if (cliente) {
      setClienteNome(cliente.nome)
      setClienteEndereco(cliente.endereco)
      if (cliente.tabelaPrecoId) {
        const t = await getTabelaById(cliente.tabelaPrecoId)
        setTabelaPrecos(t)
      } else {
        setTabelaPrecos(null)
      }
    } else {
      setClienteNome('')
      setClienteEndereco('')
      setTabelaPrecos(null)
    }
  }

  function addItem() {
    setItens((prev) => [...prev, emptyItem()])
  }

  function duplicateItem(idx: number) {
    setItens((prev) => {
      const copy = [...prev]
      copy.splice(idx + 1, 0, { ...prev[idx] })
      return copy
    })
    setSelectedItems(new Set())
  }

  function moveItem(idx: number, direction: 'up' | 'down') {
    setItens((prev) => {
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
    setSelectedItems(new Set())
    setManualItems((prev) => {
      const next = new Set<number>()
      for (const i of prev) {
        const newIdx = direction === 'up' ? idx - 1 : idx + 1
        if (i === idx) next.add(newIdx)
        else if (i === newIdx) next.add(idx)
        else next.add(i)
      }
      return next
    })
  }

  function removeItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx))
    setSelectedItems(new Set())
    setManualItems((prev) => {
      const next = new Set<number>()
      for (const i of prev) {
        if (i === idx) continue
        next.add(i > idx ? i - 1 : i)
      }
      return next
    })
  }

  function updateItemField(idx: number, field: keyof PedidoItem, value: string | number) {
    setItens((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        const updated = { ...item, [field]: value }
        return calcItem(updated)
      })
    )
  }

  function selectFromPriceTable(idx: number, produtoName: string) {
    const ptItem = priceTableItems.find((p) => p.produto === produtoName)
    if (!ptItem) return
    setItens((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        return calcItem({
          ...item,
          descricao: ptItem.produto,
          unidade: ptItem.unidade,
          valor_unitario: ptItem.preco
        })
      })
    )
  }

  const handleSave = useCallback(async () => {
    if (!clienteId || !numero.trim()) return
    setSaving(true)
    try {
      const payload = {
        numero,
        data_emissao: dataEmissao,
        cliente: {
          id: clienteId,
          nome: clienteNome,
          endereco_entrega: clienteEndereco
        },
        itens,
        total_geral: totalGeral,
        observacao,
        status
      }
      if (isNew) {
        await create(payload)
      } else {
        await update(id, payload)
      }
      navigate('/propostas')
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar proposta. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [numero, dataEmissao, clienteId, clienteNome, clienteEndereco, itens, totalGeral, observacao, status, isNew, id, create, update, navigate])

  if (loadingData) {
    return (
      <div>
        <PageHeader title="Carregando..." />
        <p className="text-sm text-gray-500">Carregando proposta...</p>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[status]

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {isNew ? 'Nova Proposta' : `Editar Proposta #${numero}`}
            {!isNew && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.label}
              </span>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/propostas')}>
              Cancelar
            </Button>
            {!isNew && (
              <ExportPdfButton
                onExport={(mode) => {
                  const proposta: Proposta = {
                    id: id!,
                    numero,
                    data_emissao: dataEmissao,
                    cliente: { id: clienteId, nome: clienteNome, endereco_entrega: clienteEndereco },
                    itens,
                    total_geral: totalGeral,
                    observacao,
                    status,
                    createdAt: '',
                    updatedAt: ''
                  }
                  return exportPropostaPdf(proposta, mode)
                }}
              />
            )}
            <Button onClick={handleSave} disabled={saving || !clienteId || !numero.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      />

      {/* Status + Header: Numero + Data */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Dados da Proposta</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="P-2026-001"
          />
          <Input
            label="Data de Emissao"
            type="date"
            value={dataEmissao}
            onChange={(e) => setDataEmissao(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <div className="flex flex-wrap items-center gap-1">
              {ALL_STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer border ${
                      status === s
                        ? `${cfg.bg} ${cfg.text} border-current`
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cliente */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proposta-cliente" className="text-sm font-medium text-gray-700">
              Selecionar Cliente *
            </label>
            <select
              id="proposta-cliente"
              value={clienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <Input
            label="Endereco de Entrega"
            value={clienteEndereco}
            onChange={(e) => setClienteEndereco(e.target.value)}
            placeholder="Endereco"
          />
        </div>
        {tabelaPrecos && (
          <p className="text-xs text-gray-500 mt-2">
            Tabela de precos: <strong>{tabelaPrecos.nome}</strong> ({priceTableItems.length} itens)
          </p>
        )}
      </div>

      {/* Itens */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Itens da Proposta
            {itens.length > 0 && <span className="ml-2 text-gray-400 font-normal">({itens.length})</span>}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && itens.length > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={itens.length > 0 && selectedItems.size === itens.length}
                  onChange={toggleAllItems}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                Selecionar todos
              </label>
            )}
            {!isNew && selectedItems.size > 0 && (
              <Button
                className="!bg-violet-600 hover:!bg-violet-700 !text-white"
                onClick={() => setConvertModalOpen(true)}
              >
                Converter em Pedido ({selectedItems.size})
              </Button>
            )}
            <Button variant="secondary" onClick={addItem}>+ Adicionar Item</Button>
          </div>
        </div>

        {itens.length === 0 ? (
          <div
            className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            onClick={addItem}
          >
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-sm text-gray-500">Clique para adicionar o primeiro item</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map((item, idx) => (
              <div
                key={idx}
                className={`border rounded-lg transition-colors ${
                  selectedItems.has(idx)
                    ? 'border-violet-300 bg-violet-50/30'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {!isNew && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(idx)}
                        onChange={() => toggleItemSelection(idx)}
                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                      />
                    )}
                    <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
                    {item.descricao && (
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{item.descricao}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      title="Mover para cima"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === itens.length - 1}
                      title="Mover para baixo"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                      onClick={() => duplicateItem(idx)}
                      title="Duplicar item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                      onClick={() => removeItem(idx)}
                      title="Remover item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-3">
                  {/* Row 1: Description */}
                  <div>
                    {priceTableItems.length > 0 && !manualItems.has(idx) && (!item.descricao || priceTableItems.some((pt) => pt.produto === item.descricao)) ? (
                      <select
                        value={item.descricao}
                        onChange={(e) => {
                          if (e.target.value === '__manual__') {
                            setManualItems((prev) => new Set(prev).add(idx))
                            updateItemField(idx, 'descricao', '')
                          } else {
                            selectFromPriceTable(idx, e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Selecionar item da tabela de precos...</option>
                        <option value="__manual__">-- Digitar manualmente --</option>
                        {priceTableItems.map((pt, i) => (
                          <option key={i} value={pt.produto}>
                            {pt.produto} ({pt.unidade} - R$ {pt.preco.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={item.descricao}
                          onChange={(e) => updateItemField(idx, 'descricao', e.target.value)}
                          placeholder="Descricao do item"
                        />
                        {priceTableItems.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setManualItems((prev) => { const n = new Set(prev); n.delete(idx); return n })
                              updateItemField(idx, 'descricao', '')
                            }}
                            className="shrink-0 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium cursor-pointer rounded-lg border border-blue-200 transition-colors"
                            title="Selecionar da tabela de precos"
                          >
                            Tabela
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detailed description */}
                  <textarea
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-gray-600"
                    value={item.descricao_detalhada || ''}
                    onChange={(e) => updateItemField(idx, 'descricao_detalhada', e.target.value)}
                    placeholder="Descricao detalhada do servico (aparece no PDF da proposta)"
                    rows={2}
                  />

                  {/* Row 2: Fields grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Data Servico</label>
                      <input
                        type="date"
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.data_servico}
                        onChange={(e) => updateItemField(idx, 'data_servico', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Unidade</label>
                      <input
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.unidade}
                        onChange={(e) => updateItemField(idx, 'unidade', e.target.value)}
                        placeholder="un"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Quantidade</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        value={item.quantidade}
                        onChange={(e) => updateItemField(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Valor Unit.</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        value={item.valor_unitario}
                        onChange={(e) => updateItemField(idx, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Desc. (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                        value={item.desconto_percentual}
                        onChange={(e) => updateItemField(idx, 'desconto_percentual', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Total</label>
                      <div className="px-2 py-1.5 text-sm font-semibold text-gray-900 bg-gray-50 rounded-lg border border-gray-200 text-right">
                        {item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add item button at bottom */}
            <button
              onClick={addItem}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
              + Adicionar Item
            </button>
          </div>
        )}
      </div>

      {/* Total */}
      {itens.length > 0 && (
        <div className="mb-6 flex justify-end">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3">
            <span className="text-sm text-gray-600 mr-4">Total Geral:</span>
            <span className="text-lg font-bold text-gray-900">
              {totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      )}

      {/* Observacao */}
      <div className="mb-6">
        <label htmlFor="proposta-obs" className="text-sm font-medium text-gray-700 block mb-1.5">
          Observacao
        </label>
        <textarea
          id="proposta-obs"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
          rows={3}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Observacoes da proposta..."
        />
      </div>

      {/* Modal: Converter em Pedido */}
      <Modal open={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Converter em Pedido">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sera criado um pedido com os seguintes itens:
          </p>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {itens
                  .filter((_, idx) => selectedItems.has(idx))
                  .map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-gray-900">{item.descricao}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{item.quantidade} {item.unidade}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.valor_total)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2">
              <span className="text-sm text-violet-600 mr-2">Total:</span>
              <span className="text-base font-bold text-violet-900">{formatCurrency(selectedTotal)}</span>
            </div>
          </div>
          {selectedItems.size === itens.length && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Todos os itens serao convertidos. O status da proposta sera alterado para "Aceita".
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConvertModalOpen(false)}>Cancelar</Button>
            <Button className="!bg-violet-600 hover:!bg-violet-700 !text-white" onClick={handleConverterEmPedido}>
              Confirmar Pedido
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Pedido Criado */}
      <Modal
        open={!!convertSuccess}
        onClose={() => setConvertSuccess(null)}
        title="Pedido Criado"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700">
              Pedido <strong>{convertSuccess?.numero}</strong> criado com sucesso!
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConvertSuccess(null)}>Fechar</Button>
            <Link to={`/pedidos/${convertSuccess?.id}/editar`}>
              <Button className="!bg-violet-600 hover:!bg-violet-700 !text-white">
                Ver Pedido
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}
