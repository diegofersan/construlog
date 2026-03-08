/**
 * Seed script — populates the app with sample data.
 * Run: npx electron-vite build && npx tsx scripts/seed.ts
 * (needs ELECTRON_RUN_AS_NODE=1 so we can resolve userData path)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { homedir } from 'os'

// Resolve userData path (same as Electron's app.getPath('userData'))
const platform = process.platform
const appName = 'construlog'
let userDataPath: string
if (platform === 'darwin') {
  userDataPath = join(homedir(), 'Library', 'Application Support', appName)
} else if (platform === 'win32') {
  userDataPath = join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), appName)
} else {
  userDataPath = join(homedir(), '.config', appName)
}

const dataPath = join(userDataPath, 'data')

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function save(entity: string, record: Record<string, unknown>) {
  const dir = join(dataPath, entity)
  ensureDir(dir)
  writeFileSync(join(dir, `${record.id}.json`), JSON.stringify(record, null, 2))
}

const now = new Date().toISOString()

// --- Tabela de Preços ---
const tabelaId = randomUUID()
const tabela = {
  id: tabelaId,
  nome: 'Tabela Geral 2026',
  categorias: [
    {
      nome: 'Blocos',
      itens: [
        { produto: 'Bloco Cimento 10x20x30', unidade: 'un', preco: 3.5 },
        { produto: 'Bloco Cimento 15x20x40', unidade: 'un', preco: 4.0 },
        { produto: 'Bloco Cimento 20x20x40', unidade: 'un', preco: 5.8 },
        { produto: 'Bloquete 6 CM (18 unidades)', unidade: 'pct', preco: 53.6 },
        { produto: 'Bloquete 8 CM (18 unidades)', unidade: 'pct', preco: 62.0 }
      ]
    },
    {
      nome: 'Laje',
      itens: [
        { produto: 'Laje Isopor Reforçado', unidade: 'un', preco: 79.0 },
        { produto: 'Vigas de Laje', unidade: 'un', preco: 69.0 }
      ]
    },
    {
      nome: 'Terra',
      itens: [
        { produto: 'Composto Orgânico', unidade: 'm³', preco: 420.0 },
        { produto: 'Composto Orgânico Ensacado', unidade: 'm³', preco: 823.0 },
        { produto: 'Adubada Saco Grande', unidade: 'saco', preco: 19.9 },
        { produto: 'Barro Vermelho', unidade: 'm³', preco: 190.0 },
        { produto: 'Aterro', unidade: 'm³', preco: 350.0 },
        { produto: 'Saibro Vermelho', unidade: 'm³', preco: 195.0 },
        { produto: 'Areia Suja', unidade: 'm³', preco: 150.0 },
        { produto: 'Terra Arenosa', unidade: 'm³', preco: 190.0 }
      ]
    },
    {
      nome: 'Tampas de Concreto',
      itens: [
        { produto: 'Tampa 60', unidade: 'un', preco: 93.0 },
        { produto: 'Tampa 60 C/Vigia', unidade: 'un', preco: 110.68 },
        { produto: 'Tampa 80', unidade: 'un', preco: 149.8 },
        { produto: 'Tampa 80 C/Vigia', unidade: 'un', preco: 170.0 },
        { produto: 'Tampa 1,00', unidade: 'un', preco: 198.39 },
        { produto: 'Tampa 1,00 C/Vigia', unidade: 'un', preco: 290.0 },
        { produto: 'Tampa 1,20', unidade: 'un', preco: 271.0 },
        { produto: 'Tampa 1,20 C/Vigia', unidade: 'un', preco: 300.0 },
        { produto: 'Tampa 1,50', unidade: 'un', preco: 457.0 },
        { produto: 'Tampa 1,50 C/Vigia', unidade: 'un', preco: 470.0 }
      ]
    },
    {
      nome: 'Anéis 1,20x50',
      itens: [
        { produto: 'Anel 1,20x50', unidade: 'un', preco: 230.0 },
        { produto: 'Anel 1,20x50 C/2 Furos', unidade: 'un', preco: 289.8 },
        { produto: 'Anel 1,20x50 C/ Fundo', unidade: 'un', preco: 352.3 },
        { produto: 'Anel 1,20x50 C/ Dreno', unidade: 'un', preco: 295.0 }
      ]
    },
    {
      nome: 'Anéis 1,50x50',
      itens: [
        { produto: 'Anel 1,50x50', unidade: 'un', preco: 458.0 },
        { produto: 'Anel 1,50x50 C/2 Furos', unidade: 'un', preco: 460.05 },
        { produto: 'Anel 1,50x50 C/ Fundo', unidade: 'un', preco: 639.0 },
        { produto: 'Anel 1,50x50 C/ Dreno', unidade: 'un', preco: 518.3 }
      ]
    }
  ],
  createdAt: now,
  updatedAt: now
}
save('tabelas-precos', tabela)

// --- Clientes ---
const clienteIds = {
  casaNoya: randomUUID(),
  condBracui: randomUUID(),
  srJorge: randomUUID()
}

const clientes = [
  {
    id: clienteIds.casaNoya,
    nome: 'CASA NOYA',
    endereco: 'Rua das Palmeiras, 120 - Frade - Angra dos Reis/RJ',
    tabelaPrecoId: tabelaId,
    createdAt: now,
    updatedAt: now
  },
  {
    id: clienteIds.condBracui,
    nome: 'CONDOMÍNIO BRACUÍ',
    endereco: 'Estrada do Bracuí, 500 - Bracuí - Angra dos Reis/RJ',
    tabelaPrecoId: tabelaId,
    createdAt: now,
    updatedAt: now
  },
  {
    id: clienteIds.srJorge,
    nome: 'SR. JORGE ALMEIDA',
    endereco: 'Av. Julio Maria, 85 - Centro - Angra dos Reis/RJ',
    tabelaPrecoId: tabelaId,
    createdAt: now,
    updatedAt: now
  }
]

for (const c of clientes) save('clientes', c)

// --- Pedidos (saved as 'propostas' for storage compatibility) ---
const propostas = [
  {
    id: randomUUID(),
    numero: 'P-2026-001',
    data_emissao: '2026-01-20',
    status: 'faturado' as const,
    cliente: {
      id: clienteIds.casaNoya,
      nome: 'CASA NOYA',
      endereco_entrega: 'Rua das Palmeiras, 120 - Frade - Angra dos Reis/RJ'
    },
    itens: [
      {
        descricao: 'DIÁRIA DE CAMINHÃO TRUCADO',
        data_servico: '2026-01-08',
        unidade: 'DIÁRIA',
        quantidade: 1,
        valor_unitario: 1500.0,
        valor_total_sem_desconto: 1500.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 1500.0
      },
      {
        descricao: 'DIÁRIA DE MÁQUINA',
        data_servico: '2026-01-13',
        unidade: 'DIÁRIA',
        quantidade: 1,
        valor_unitario: 1950.0,
        valor_total_sem_desconto: 1950.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 1950.0
      },
      {
        descricao: 'CAMINHÃO DE AREIA MÉDIA',
        data_servico: '2026-01-14',
        unidade: 'MT',
        quantidade: 6,
        valor_unitario: 160.0,
        valor_total_sem_desconto: 960.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 960.0
      },
      {
        descricao: 'PEDRA RACHÃO',
        data_servico: '2026-01-14',
        unidade: 'MT',
        quantidade: 9,
        valor_unitario: 350.0,
        valor_total_sem_desconto: 3150.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 3150.0
      },
      {
        descricao: 'CAMINHÃO DE ATERRO',
        data_servico: '2026-01-16',
        unidade: 'MT',
        quantidade: 8,
        valor_unitario: 70.0,
        valor_total_sem_desconto: 560.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 560.0
      }
    ],
    total_geral: 8120.0,
    observacao: 'OBRIGADO PELA PREFERÊNCIA E PARCERIA!!!',
    createdAt: now,
    updatedAt: now
  },
  {
    id: randomUUID(),
    numero: 'P-2026-002',
    data_emissao: '2026-02-05',
    status: 'aberto' as const,
    cliente: {
      id: clienteIds.condBracui,
      nome: 'CONDOMÍNIO BRACUÍ',
      endereco_entrega: 'Estrada do Bracuí, 500 - Bracuí - Angra dos Reis/RJ'
    },
    itens: [
      {
        descricao: 'COMPOSTO ORGÂNICO',
        data_servico: '2026-02-03',
        unidade: 'M³',
        quantidade: 4,
        valor_unitario: 250.0,
        valor_total_sem_desconto: 1000.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 1000.0
      },
      {
        descricao: 'TERRA ARENOSA',
        data_servico: '2026-02-03',
        unidade: 'M³',
        quantidade: 6,
        valor_unitario: 150.0,
        valor_total_sem_desconto: 900.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 900.0
      },
      {
        descricao: 'TAMPA 1,20 C/VIGIA',
        data_servico: '2026-02-04',
        unidade: 'UN',
        quantidade: 2,
        valor_unitario: 300.0,
        valor_total_sem_desconto: 600.0,
        desconto_percentual: 10,
        desconto_valor: 60.0,
        valor_total: 540.0
      },
      {
        descricao: 'ANEL 1,20x50 C/ FUNDO',
        data_servico: '2026-02-04',
        unidade: 'UN',
        quantidade: 3,
        valor_unitario: 352.3,
        valor_total_sem_desconto: 1056.9,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 1056.9
      }
    ],
    total_geral: 3496.9,
    observacao: 'Entrega inclusa no valor. Prazo: 3 dias úteis.',
    createdAt: now,
    updatedAt: now
  },
  {
    id: randomUUID(),
    numero: 'P-2026-003',
    data_emissao: '2026-03-01',
    status: 'aberto' as const,
    cliente: {
      id: clienteIds.srJorge,
      nome: 'SR. JORGE ALMEIDA',
      endereco_entrega: 'Av. Julio Maria, 85 - Centro - Angra dos Reis/RJ'
    },
    itens: [
      {
        descricao: 'BLOCO CIMENTO 15x20x40',
        data_servico: '2026-02-28',
        unidade: 'UN',
        quantidade: 500,
        valor_unitario: 4.0,
        valor_total_sem_desconto: 2000.0,
        desconto_percentual: 5,
        desconto_valor: 100.0,
        valor_total: 1900.0
      },
      {
        descricao: 'LAJE ISOPOR REFORÇADO',
        data_servico: '2026-02-28',
        unidade: 'UN',
        quantidade: 30,
        valor_unitario: 79.0,
        valor_total_sem_desconto: 2370.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 2370.0
      },
      {
        descricao: 'VIGAS DE LAJE',
        data_servico: '2026-02-28',
        unidade: 'UN',
        quantidade: 25,
        valor_unitario: 69.0,
        valor_total_sem_desconto: 1725.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 1725.0
      },
      {
        descricao: 'DIÁRIA DE CAMINHÃO TOCO 8M',
        data_servico: '2026-03-01',
        unidade: 'DIÁRIA',
        quantidade: 2,
        valor_unitario: 1450.0,
        valor_total_sem_desconto: 2900.0,
        desconto_percentual: 0,
        desconto_valor: 0,
        valor_total: 2900.0
      }
    ],
    total_geral: 8895.0,
    observacao: 'Material para obra residencial. Pagamento em 2x.',
    createdAt: now,
    updatedAt: now
  }
]

for (const p of propostas) save('propostas', p)

// --- Faturas ---
const pedidoFaturar = propostas[1] // P-2026-002, status 'faturar'
const fatura = {
  id: randomUUID(),
  numero: 'F-2026-001',
  data_emissao: '2026-02-10',
  pedido_id: pedidoFaturar.id,
  pedido_numero: pedidoFaturar.numero,
  cliente: { ...pedidoFaturar.cliente },
  itens: [pedidoFaturar.itens[0], pedidoFaturar.itens[1]], // 2 dos 4 itens (faturamento parcial)
  total: pedidoFaturar.itens[0].valor_total + pedidoFaturar.itens[1].valor_total,
  observacao: 'Fatura parcial - primeira entrega.',
  status: 'pendente' as const,
  createdAt: now,
  updatedAt: now
}
save('faturas', fatura)

console.log(`Seed concluído em: ${dataPath}`)
console.log(`  - 1 tabela de preços (${tabela.categorias.length} categorias)`)
console.log(`  - ${clientes.length} clientes`)
console.log(`  - ${propostas.length} pedidos`)
console.log(`  - 1 fatura (parcial de ${pedidoFaturar.numero})`)
