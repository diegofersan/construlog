import type { PriceTable } from '../../shared/types'
import { useCrud } from './useCrud'

export function useTabelasPrecos() {
  return useCrud<PriceTable>(window.electronAPI.tabelasPrecos)
}
