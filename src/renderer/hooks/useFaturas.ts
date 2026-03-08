import type { Fatura } from '../../shared/types'
import { useCrud } from './useCrud'

export function useFaturas() {
  return useCrud<Fatura>(window.electronAPI.faturas)
}
