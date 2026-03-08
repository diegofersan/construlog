import type { Pedido } from '../../shared/types'
import { useCrud } from './useCrud'

export function usePedidos() {
  return useCrud<Pedido>(window.electronAPI.pedidos)
}
