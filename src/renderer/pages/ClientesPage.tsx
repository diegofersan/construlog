import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { useClientes } from '../hooks/useClientes'
import { useTabelasPrecos } from '../hooks/useTabelasPrecos'
import type { Cliente, TipoDocumento } from '../../shared/types'

const peopleIcon = (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

function formatDocumento(tipo: TipoDocumento | undefined, doc: string | undefined): string {
  if (!doc) return '-'
  const digits = doc.replace(/\D/g, '')
  if (tipo === 'cpf' && digits.length === 11) {
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`
  }
  if (tipo === 'cnpj' && digits.length === 14) {
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`
  }
  return doc
}

export default function ClientesPage() {
  const { data: clientes, loading, create, update, remove } = useClientes()
  const { data: tabelas } = useTabelasPrecos()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [deleteCliente, setDeleteCliente] = useState<Cliente | null>(null)

  // Form fields
  const [nome, setNome] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cnpj')
  const [documento, setDocumento] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [cep, setCep] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [tabelaPrecoId, setTabelaPrecoId] = useState('')

  const [nomeError, setNomeError] = useState(false)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return clientes
    const term = search.toLowerCase()
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(term) || c.documento?.includes(term)
    )
  }, [clientes, search])

  const tabelaMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tabelas) map.set(t.id, t.nome)
    return map
  }, [tabelas])

  function resetForm() {
    setNome('')
    setTipoDocumento('cnpj')
    setDocumento('')
    setInscricaoEstadual('')
    setInscricaoMunicipal('')
    setEndereco('')
    setBairro('')
    setCidade('')
    setUf('')
    setCep('')
    setTelefone('')
    setEmail('')
    setTabelaPrecoId(tabelas[0]?.id ?? '')
    setNomeError(false)
  }

  function openCreate() {
    setEditingCliente(null)
    resetForm()
    setFormOpen(true)
  }

  function openEdit(cliente: Cliente) {
    setEditingCliente(cliente)
    setNome(cliente.nome)
    setTipoDocumento(cliente.tipoDocumento || 'cnpj')
    setDocumento(cliente.documento || '')
    setInscricaoEstadual(cliente.inscricaoEstadual || '')
    setInscricaoMunicipal(cliente.inscricaoMunicipal || '')
    setEndereco(cliente.endereco)
    setBairro(cliente.bairro || '')
    setCidade(cliente.cidade || '')
    setUf(cliente.uf || '')
    setCep(cliente.cep || '')
    setTelefone(cliente.telefone || '')
    setEmail(cliente.email || '')
    setTabelaPrecoId(cliente.tabelaPrecoId)
    setNomeError(false)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingCliente(null)
  }

  async function handleSave() {
    const trimmedNome = nome.trim()
    if (!trimmedNome) {
      setNomeError(true)
      return
    }
    setSaving(true)
    try {
      const payload = {
        nome: trimmedNome,
        tipoDocumento,
        documento: documento.trim(),
        inscricaoEstadual: inscricaoEstadual.trim(),
        inscricaoMunicipal: inscricaoMunicipal.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        cep: cep.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        tabelaPrecoId
      }
      if (editingCliente) {
        await update(editingCliente.id, payload)
      } else {
        await create(payload)
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteCliente) return
    await remove(deleteCliente.id)
    setDeleteCliente(null)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Clientes" />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        actions={<Button onClick={openCreate}>+ Novo Cliente</Button>}
      />

      {clientes.length === 0 ? (
        <EmptyState
          icon={peopleIcon}
          title="Sem clientes"
          description="Adicione o seu primeiro cliente para comecar."
          action={<Button onClick={openCreate}>+ Novo Cliente</Button>}
        />
      ) : (
        <>
          <div className="mb-4 w-full sm:max-w-sm">
            <Input
              placeholder="Buscar por nome ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade/UF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabela de Precos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <Link to={`/clientes/${cliente.id}`} className="hover:text-blue-600 hover:underline transition-colors">
                        {cliente.nome}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDocumento(cliente.tipoDocumento, cliente.documento)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {[cliente.cidade, cliente.uf].filter(Boolean).join('/') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tabelaMap.get(cliente.tabelaPrecoId) || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" className="!px-3 !py-1.5 text-xs" onClick={() => openEdit(cliente)}>
                          Editar
                        </Button>
                        <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => setDeleteCliente(cliente)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Nenhum cliente encontrado para "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Form Modal */}
      <Modal open={formOpen} onClose={closeForm} title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'} wide>
        <div className="flex flex-col gap-4">
          <div>
            <Input
              label="Nome / Razão Social *"
              id="cliente-nome"
              placeholder="Nome completo ou razão social"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setNomeError(false) }}
            />
            {nomeError && <p className="text-red-500 text-xs mt-1">Nome e obrigatorio</p>}
          </div>

          {/* Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Tipo de Documento</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTipoDocumento('cnpj')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    tipoDocumento === 'cnpj'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  CNPJ
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDocumento('cpf')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    tipoDocumento === 'cpf'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  CPF
                </button>
              </div>
            </div>
            <Input
              label={tipoDocumento === 'cnpj' ? 'CNPJ' : 'CPF'}
              placeholder={tipoDocumento === 'cnpj' ? '00.000.000/0000-00' : '000.000.000-00'}
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />
          </div>

          {/* Inscrições (só para CNPJ) */}
          {tipoDocumento === 'cnpj' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Inscricão Estadual"
                placeholder="Isento ou numero"
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
              />
              <Input
                label="Inscricão Municipal"
                placeholder="Numero"
                value={inscricaoMunicipal}
                onChange={(e) => setInscricaoMunicipal(e.target.value)}
              />
            </div>
          )}

          {/* Endereço */}
          <Input
            label="Endereco"
            placeholder="Rua, numero, complemento"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Bairro"
              placeholder="Bairro"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
            <Input
              label="Cidade"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <Input
              label="UF"
              placeholder="RJ"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="uppercase"
            />
            <Input
              label="CEP"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
            />
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Tabela de Preços */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cliente-tabela" className="text-sm font-medium text-gray-700">
              Tabela de Precos
            </label>
            <select
              id="cliente-tabela"
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
            <Button variant="secondary" onClick={closeForm}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteCliente} onClose={() => setDeleteCliente(null)} title="Excluir Cliente">
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir o cliente <strong>{deleteCliente?.nome}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteCliente(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  )
}
