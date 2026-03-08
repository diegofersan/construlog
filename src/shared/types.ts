// Empresa (dados fixos)
export const EMPRESA = {
  nome: 'CONSTRUMAR FRADE',
  endereco: 'Av. Carlos Borges, Nº 10 – Frade, Angra dos Reis/RJ',
  telefone: 'Loja: (24) 99852-3097 | Victor: (24) 9989-4458',
  cnpj: '35.431.867/0001-86'
} as const

// Tabela de Preços
export interface PriceTableItem {
  produto: string
  unidade: string
  preco: number | null
  obs?: string
}

export interface PriceTableCategory {
  nome: string
  itens: PriceTableItem[]
}

export interface PriceTable {
  id: string
  nome: string
  categorias: PriceTableCategory[]
  createdAt: string
  updatedAt: string
}

// Cliente
export type TipoDocumento = 'cpf' | 'cnpj'

export interface Cliente {
  id: string
  nome: string
  tipoDocumento: TipoDocumento
  documento: string        // CPF ou CNPJ
  inscricaoEstadual?: string
  inscricaoMunicipal?: string
  endereco: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  telefone?: string
  email?: string
  tabelaPrecoId: string
  createdAt: string
  updatedAt: string
}

// Item (shared by Pedido, Proposta, Fatura)
export interface PedidoItem {
  descricao: string
  descricao_detalhada?: string
  data_servico: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total_sem_desconto: number
  desconto_percentual: number
  desconto_valor: number
  valor_total: number
}

// Proposta
export type PropostaStatus = 'pendente' | 'aceita' | 'rejeitada'

export interface Proposta {
  id: string
  numero: string           // P-2026-001
  data_emissao: string
  cliente: {
    id: string
    nome: string
    endereco_entrega: string
  }
  itens: PedidoItem[]
  total_geral: number
  observacao: string
  status: PropostaStatus
  createdAt: string
  updatedAt: string
}

// Pedido
export type PedidoStatus = 'aberto' | 'rejeitado' | 'faturado'

export interface Pedido {
  id: string
  numero: string
  data_emissao: string
  cliente: {
    id: string
    nome: string
    endereco_entrega: string
  }
  itens: PedidoItem[]
  total_geral: number
  observacao: string
  status: PedidoStatus
  createdAt: string
  updatedAt: string
}

// Fatura
export type FaturaStatus = 'pendente' | 'paga'

export interface Fatura {
  id: string
  numero: string           // F-2026-001
  data_emissao: string
  pedido_id: string        // referência ao pedido
  pedido_numero: string    // numero do pedido para display
  cliente: {
    id: string
    nome: string
    endereco_entrega: string
  }
  itens: PedidoItem[]      // mesma estrutura que PedidoItem
  total: number
  observacao: string
  status: FaturaStatus
  createdAt: string
  updatedAt: string
}

// Settings
export type AIProvider = 'openai' | 'gemini' | 'anthropic'

export interface AISettings {
  provider: AIProvider
  apiKey: string
}

// AI Context
export interface AIContext {
  route: string
  pedido_id?: string
  proposta_id?: string
}

// AI Actions
export type AIAction =
  | { action: 'create_pedido'; cliente: { id: string; nome: string; endereco_entrega: string }; itens: PedidoItem[]; total_geral: number; observacao: string }
  | { action: 'add_items'; pedido_id: string; itens: PedidoItem[]; message: string }
  | { action: 'remove_items'; pedido_id: string; descricoes: string[]; message: string }
  | { action: 'update_items'; pedido_id: string; itens: PedidoItem[]; message: string }
  | { action: 'create_fatura'; pedido_id: string; descricoes: string[]; observacao: string; message: string }
  | { action: 'update_status'; pedido_id: string; status: PedidoStatus; message: string }
  | { action: 'create_cliente'; nome: string; endereco: string; message: string }
  | { action: 'duplicate_pedido'; pedido_id: string; cliente_id?: string; message: string }
  | { action: 'create_proposta'; cliente: { id: string; nome: string; endereco_entrega: string }; itens: PedidoItem[]; total_geral: number; observacao: string }
  | { action: 'add_proposta_items'; proposta_id: string; itens: PedidoItem[]; message: string }
  | { action: 'remove_proposta_items'; proposta_id: string; descricoes: string[]; message: string }
  | { action: 'update_proposta_items'; proposta_id: string; itens: PedidoItem[]; message: string }
  | { action: 'update_proposta_status'; proposta_id: string; status: PropostaStatus; message: string }
  | { action: 'duplicate_proposta'; proposta_id: string; cliente_id?: string; message: string }
  | { action: 'convert_proposta'; proposta_id: string; descricoes?: string[]; message: string }
  | { action: 'answer'; message: string }

export type AIResult =
  | { action: 'create_pedido'; pedido: Pedido }
  | { action: 'add_items' | 'remove_items' | 'update_items'; pedido: Pedido; message: string }
  | { action: 'create_fatura'; fatura: Fatura; message: string }
  | { action: 'update_status'; pedido: Pedido; message: string }
  | { action: 'create_cliente'; message: string }
  | { action: 'duplicate_pedido'; pedido: Pedido; message: string }
  | { action: 'create_proposta'; proposta: Proposta }
  | { action: 'add_proposta_items' | 'remove_proposta_items' | 'update_proposta_items'; proposta: Proposta; message: string }
  | { action: 'update_proposta_status'; proposta: Proposta; message: string }
  | { action: 'duplicate_proposta'; proposta: Proposta; message: string }
  | { action: 'convert_proposta'; pedido: Pedido; message: string }
  | { action: 'answer'; message: string }
  | { error: string }

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAPI {
  execute: (command: string, context?: AIContext, history?: AIMessage[]) => Promise<AIResult>
  testKey: (provider: AIProvider, apiKey: string) => Promise<{ success: boolean; error?: string }>
}

// Electron API
export interface CrudAPI<T> {
  list: () => Promise<T[]>
  get: (id: string) => Promise<T | null>
  create: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => Promise<T>
  update: (id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<T>
  delete: (id: string) => Promise<void>
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'not-authenticated'

export interface SyncAPI {
  start: () => Promise<void>
  status: () => Promise<SyncStatus>
  login: () => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: () => Promise<boolean>
}

export interface SettingsAPI {
  getAI: () => Promise<AISettings | null>
  saveAI: (settings: AISettings) => Promise<void>
}

export interface ElectronAPI {
  getVersion: () => Promise<string>
  checkForUpdates: () => Promise<void>
  installUpdate: () => Promise<void>
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateNotAvailable: (callback: () => void) => void
  onUpdateDownloaded: (callback: (version: string) => void) => void
  onUpdateError: (callback: (msg: string) => void) => void
  savePdf: (fileName: string, data: number[]) => Promise<boolean>
  pedidos: CrudAPI<Pedido>
  clientes: CrudAPI<Cliente>
  tabelasPrecos: CrudAPI<PriceTable>
  faturas: CrudAPI<Fatura>
  propostas: CrudAPI<Proposta>
  sync: SyncAPI
  settings: SettingsAPI
  ai: AIAPI

}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
