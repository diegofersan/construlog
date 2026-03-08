import type { Cliente } from '../../shared/types'
import { useCrud } from './useCrud'

export function useClientes() {
  return useCrud<Cliente>(window.electronAPI.clientes)
}
