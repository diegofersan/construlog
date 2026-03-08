import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PriceTable } from '../../shared/types'
import { useTabelasPrecos } from '../hooks/useTabelasPrecos'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'

const tableIcon = (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0-2.25c.621 0 1.125.504 1.125 1.125M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0-2.25c-.621 0-1.125.504-1.125 1.125m0 0v1.5c0 .621.504 1.125 1.125 1.125m-1.125-2.625c.621 0 1.125.504 1.125 1.125m1.125 1.125v-1.5c0-.621.504-1.125 1.125-1.125m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125" />
  </svg>
)

function countItems(table: PriceTable): number {
  return table.categorias.reduce((sum, cat) => sum + cat.itens.length, 0)
}

export default function TabelaPrecosPage() {
  const { data: tabelas, loading, remove } = useTabelasPrecos()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<PriceTable | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Tabelas de Precos" />
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Tabelas de Precos"
        actions={
          <Button onClick={() => navigate('/tabelas-precos/nova')}>
            + Nova Tabela
          </Button>
        }
      />

      {tabelas.length === 0 ? (
        <EmptyState
          icon={tableIcon}
          title="Sem tabelas de precos"
          description="Crie a sua primeira tabela de precos."
          action={
            <Button onClick={() => navigate('/tabelas-precos/nova')}>
              + Nova Tabela
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tabelas.map((tabela) => (
            <div
              key={tabela.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => navigate(`/tabelas-precos/${tabela.id}/editar`)}
            >
              <div>
                <h3 className="font-medium text-gray-900">{tabela.nome}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {tabela.categorias.length} categoria{tabela.categorias.length !== 1 ? 's' : ''}
                  {' / '}
                  {countItems(tabela)} ite{countItems(tabela) !== 1 ? 'ns' : 'm'}
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => navigate(`/tabelas-precos/${tabela.id}/editar`)}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  className="!px-3 !py-1.5 text-xs"
                  onClick={() => setDeleteTarget(tabela)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir tabela"
      >
        <p className="text-sm text-gray-600 mb-6">
          Tem certeza que deseja excluir a tabela <strong>{deleteTarget?.nome}</strong>? Esta acao nao pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
