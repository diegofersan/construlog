import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { PriceTableCategory, PriceTableItem } from '../../shared/types'
import { useTabelasPrecos } from '../hooks/useTabelasPrecos'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'

const categoryColors = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-rose-50 border-rose-200 text-rose-800',
  'bg-cyan-50 border-cyan-200 text-cyan-800',
  'bg-orange-50 border-orange-200 text-orange-800',
  'bg-indigo-50 border-indigo-200 text-indigo-800'
]

function emptyItem(): PriceTableItem {
  return { produto: '', unidade: 'un', preco: null }
}

export default function TabelaPrecosEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { create, update, getById } = useTabelasPrecos()

  const [nome, setNome] = useState('')
  const [categorias, setCategorias] = useState<PriceTableCategory[]>([])
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(!!id)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getById(id).then((table) => {
      if (cancelled || !table) return
      setNome(table.nome)
      setCategorias(table.categorias)
      setLoadingData(false)
    })
    return () => { cancelled = true }
  }, [id, getById])

  const toggleCollapse = (idx: number) => {
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const addCategory = () => {
    setCategorias((prev) => [...prev, { nome: '', itens: [emptyItem()] }])
  }

  const removeCategory = (idx: number) => {
    setCategorias((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateCategoryName = (idx: number, name: string) => {
    setCategorias((prev) => prev.map((c, i) => (i === idx ? { ...c, nome: name } : c)))
  }

  const addItem = (catIdx: number) => {
    setCategorias((prev) =>
      prev.map((c, i) => (i === catIdx ? { ...c, itens: [...c.itens, emptyItem()] } : c))
    )
  }

  const removeItem = (catIdx: number, itemIdx: number) => {
    setCategorias((prev) =>
      prev.map((c, i) =>
        i === catIdx ? { ...c, itens: c.itens.filter((_, j) => j !== itemIdx) } : c
      )
    )
  }

  const updateItem = (catIdx: number, itemIdx: number, field: keyof PriceTableItem, value: string) => {
    setCategorias((prev) =>
      prev.map((c, i) => {
        if (i !== catIdx) return c
        const newItens = c.itens.map((item, j) => {
          if (j !== itemIdx) return item
          if (field === 'preco') {
            const num = value === '' ? null : parseFloat(value)
            return { ...item, preco: num !== null && isNaN(num) ? item.preco : num }
          }
          return { ...item, [field]: value }
        })
        return { ...c, itens: newItens }
      })
    )
  }

  const handleSave = useCallback(async () => {
    if (!nome.trim()) return
    setSaving(true)
    try {
      if (isNew) {
        await create({ nome: nome.trim(), categorias })
      } else {
        await update(id, { nome: nome.trim(), categorias })
      }
      navigate('/tabelas-precos')
    } finally {
      setSaving(false)
    }
  }, [nome, categorias, isNew, id, create, update, navigate])

  if (loadingData) {
    return (
      <div>
        <PageHeader title="Carregando..." />
        <p className="text-sm text-gray-500">Carregando tabela...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'Nova Tabela de Precos' : 'Editar Tabela de Precos'}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/tabelas-precos')}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !nome.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      />

      <div className="mb-6 max-w-md">
        <Input
          label="Nome da Tabela"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Tabela Padrao"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
        <Button variant="secondary" onClick={addCategory}>
          + Adicionar Categoria
        </Button>
      </div>

      {categorias.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhuma categoria. Clique em "Adicionar Categoria" para comecar.
        </p>
      ) : (
        <div className="space-y-4">
          {categorias.map((cat, catIdx) => {
            const colorClass = categoryColors[catIdx % categoryColors.length]
            const isCollapsed = collapsed[catIdx]
            return (
              <div key={catIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b cursor-pointer select-none ${colorClass}`}
                  onClick={() => toggleCollapse(catIdx)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg
                      className={`w-4 h-4 shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <input
                      className="bg-transparent font-medium text-sm border-none outline-none flex-1 min-w-0 placeholder-gray-400"
                      value={cat.nome}
                      onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Nome da categoria"
                    />
                    <span className="text-xs opacity-60 shrink-0">
                      {cat.itens.length} ite{cat.itens.length !== 1 ? 'ns' : 'm'}
                    </span>
                  </div>
                  <button
                    className="ml-3 text-red-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeCategory(catIdx)
                    }}
                    title="Remover categoria"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {!isCollapsed && (
                  <div className="p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-100">
                          <th className="pb-2 font-medium">Produto</th>
                          <th className="pb-2 font-medium w-24">Unidade</th>
                          <th className="pb-2 font-medium w-32">Preco (R$)</th>
                          <th className="pb-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.itens.map((item, itemIdx) => (
                          <tr key={itemIdx} className="border-b border-gray-50">
                            <td className="py-1.5 pr-2">
                              <input
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={item.produto}
                                onChange={(e) => updateItem(catIdx, itemIdx, 'produto', e.target.value)}
                                placeholder="Nome do produto"
                              />
                            </td>
                            <td className="py-1.5 pr-2">
                              <input
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={item.unidade}
                                onChange={(e) => updateItem(catIdx, itemIdx, 'unidade', e.target.value)}
                                placeholder="un"
                              />
                            </td>
                            <td className="py-1.5 pr-2">
                              <input
                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                                type="number"
                                step="0.01"
                                value={item.preco === null ? '' : item.preco}
                                onChange={(e) => updateItem(catIdx, itemIdx, 'preco', e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-1.5 text-center">
                              <button
                                className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                onClick={() => removeItem(catIdx, itemIdx)}
                                title="Remover item"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                      onClick={() => addItem(catIdx)}
                    >
                      + Adicionar Item
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
