import type { Proposta } from '../../shared/types'
import { useCrud } from './useCrud'

export function usePropostas() {
  return useCrud<Proposta>(window.electronAPI.propostas)
}
