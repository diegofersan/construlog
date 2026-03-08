import { useCallback, useEffect, useState } from 'react'
import type { CrudAPI } from '../../shared/types'

export function useCrud<T extends { id: string }>(api: CrudAPI<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const items = await api.list()
      setData(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    function handleDataChanged() {
      refresh()
    }
    window.addEventListener('ai:data-changed', handleDataChanged)
    return () => window.removeEventListener('ai:data-changed', handleDataChanged)
  }, [refresh])

  const create = useCallback(
    async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await api.create(item)
      setData((prev) => [...prev, created])
      return created
    },
    [api]
  )

  const update = useCallback(
    async (id: string, item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const updated = await api.update(id, item)
      if (updated) {
        setData((prev) => prev.map((d) => (d.id === id ? updated : d)))
      }
      return updated
    },
    [api]
  )

  const remove = useCallback(
    async (id: string) => {
      await api.delete(id)
      setData((prev) => prev.filter((d) => d.id !== id))
    },
    [api]
  )

  const getById = useCallback(
    async (id: string) => {
      return api.get(id)
    },
    [api]
  )

  return { data, loading, error, refresh, create, update, remove, getById }
}
