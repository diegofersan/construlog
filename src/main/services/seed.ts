import * as storage from './storage'
import type { PriceTable, PriceTableCategory } from '../../shared/types'
import tabelaRaw from '../../../tabela_de_precos.json'

export function seedAll(): void {
  seedTabelaPrecos()
}

function seedTabelaPrecos(): void {
  const existing = storage.list<PriceTable>('tabelas-precos')
  if (existing.length > 0) return

  const tabela = (tabelaRaw as any).tabela_de_precos
  if (!tabela) return

  const categorias: PriceTableCategory[] = []

  // Simple array categories
  const simpleCategories: Record<string, string> = {
    blocos: 'Blocos',
    laje: 'Laje',
    isopor: 'Isopor',
    terra: 'Terra',
    tampa_de_concreto: 'Tampa de Concreto'
  }

  for (const [key, nome] of Object.entries(simpleCategories)) {
    if (Array.isArray(tabela[key])) {
      categorias.push({ nome, itens: tabela[key] })
    }
  }

  // Terra condominios (nested)
  if (tabela.terra_condominios?.itens) {
    categorias.push({
      nome: `Terra - Condomínios (${tabela.terra_condominios.locais})`,
      itens: tabela.terra_condominios.itens
    })
  }

  // Aneis (nested by size)
  if (tabela.aneis) {
    for (const [size, items] of Object.entries(tabela.aneis)) {
      if (Array.isArray(items)) {
        categorias.push({ nome: `Anéis ${size}`, itens: items })
      }
    }
  }

  storage.create('tabelas-precos', {
    nome: 'Tabela Padrão Construmar',
    categorias
  })
}
