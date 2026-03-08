import * as storage from './storage'
import type { AISettings, AIAction, AIContext, AIResult, Cliente, PriceTable, Pedido, Fatura, Proposta, PedidoItem, PropostaStatus } from '../../shared/types'

const MAX_RECENT = 20

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function generateNumero(pedidos: Pedido[]): string {
  const year = new Date().getFullYear()
  const prefix = `${year}-`
  let max = 0
  for (const p of pedidos) {
    if (p.numero.startsWith(prefix)) {
      const num = parseInt(p.numero.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }
  return `${year}-${String(max + 1).padStart(3, '0')}`
}

function generatePropostaNumero(propostas: Proposta[]): string {
  const year = new Date().getFullYear()
  const prefix = `P-${year}-`
  let max = 0
  for (const p of propostas) {
    if (p.numero.startsWith(prefix)) {
      const num = parseInt(p.numero.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }
  return `P-${year}-${String(max + 1).padStart(3, '0')}`
}

function generateFaturaNumero(faturas: Fatura[]): string {
  const year = new Date().getFullYear()
  const prefix = `F-${year}-`
  let max = 0
  for (const f of faturas) {
    if (f.numero.startsWith(prefix)) {
      const num = parseInt(f.numero.slice(prefix.length), 10)
      if (!isNaN(num) && num > max) max = num
    }
  }
  return `F-${year}-${String(max + 1).padStart(3, '0')}`
}

function recalcTotal(itens: PedidoItem[]): number {
  return itens.reduce((sum, i) => sum + i.valor_total, 0)
}

// ---------------------------------------------------------------------------
// Compact summaries — only send what the AI needs, not everything
// ---------------------------------------------------------------------------

function summarizeProposta(p: Proposta) {
  return {
    id: p.id,
    numero: p.numero,
    data_emissao: p.data_emissao,
    status: p.status,
    cliente_nome: p.cliente.nome,
    total_geral: p.total_geral,
    itens_count: p.itens.length
  }
}

function detailProposta(p: Proposta) {
  return {
    id: p.id,
    numero: p.numero,
    data_emissao: p.data_emissao,
    status: p.status,
    cliente: p.cliente,
    itens: p.itens.map((i) => ({
      descricao: i.descricao,
      descricao_detalhada: i.descricao_detalhada,
      quantidade: i.quantidade,
      unidade: i.unidade,
      valor_unitario: i.valor_unitario,
      desconto_percentual: i.desconto_percentual,
      valor_total: i.valor_total
    })),
    total_geral: p.total_geral,
    observacao: p.observacao
  }
}

function summarizePedido(p: Pedido) {
  return {
    id: p.id,
    numero: p.numero,
    data_emissao: p.data_emissao,
    status: p.status,
    cliente_nome: p.cliente.nome,
    total_geral: p.total_geral,
    itens_count: p.itens.length
  }
}

function detailPedido(p: Pedido) {
  return {
    id: p.id,
    numero: p.numero,
    data_emissao: p.data_emissao,
    status: p.status,
    cliente: p.cliente,
    itens: p.itens.map((i) => ({
      descricao: i.descricao,
      quantidade: i.quantidade,
      unidade: i.unidade,
      valor_unitario: i.valor_unitario,
      desconto_percentual: i.desconto_percentual,
      valor_total: i.valor_total
    })),
    total_geral: p.total_geral,
    observacao: p.observacao
  }
}

function summarizeFatura(f: Fatura) {
  return {
    id: f.id,
    numero: f.numero,
    pedido_numero: f.pedido_numero,
    cliente_nome: f.cliente.nome,
    total: f.total,
    status: f.status
  }
}

// Sort by most recent first
function sortByDate<T extends { createdAt?: string; updatedAt?: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const da = a.updatedAt || a.createdAt || ''
    const db = b.updatedAt || b.createdAt || ''
    return db.localeCompare(da)
  })
}

// ---------------------------------------------------------------------------
// Search: find records matching a user query (name, number, etc.)
// ---------------------------------------------------------------------------

function searchRecords(command: string, propostas: Proposta[], pedidos: Pedido[], faturas: Fatura[], clientes: Cliente[]) {
  const cmd = command.toLowerCase()
  const mentioned: { propostas: Proposta[]; pedidos: Pedido[]; faturas: Fatura[] } = {
    propostas: [],
    pedidos: [],
    faturas: []
  }

  // Search by numero
  for (const p of propostas) {
    if (cmd.includes(p.numero.toLowerCase()) || cmd.includes(p.numero.replace('P-', '').toLowerCase())) {
      mentioned.propostas.push(p)
    }
  }
  for (const p of pedidos) {
    if (cmd.includes(p.numero.toLowerCase())) {
      mentioned.pedidos.push(p)
    }
  }
  for (const f of faturas) {
    if (cmd.includes(f.numero.toLowerCase())) {
      mentioned.faturas.push(f)
    }
  }

  // Search by client name
  for (const c of clientes) {
    const cname = c.nome.toLowerCase()
    if (cmd.includes(cname) || cname.split(' ').some(w => w.length > 3 && cmd.includes(w))) {
      // Include records from this client (limited)
      for (const p of propostas) {
        if (p.cliente.id === c.id && !mentioned.propostas.includes(p)) {
          mentioned.propostas.push(p)
        }
      }
      for (const p of pedidos) {
        if (p.cliente.id === c.id && !mentioned.pedidos.includes(p)) {
          mentioned.pedidos.push(p)
        }
      }
    }
  }

  return mentioned
}

// ---------------------------------------------------------------------------
// Build system prompt — scalable version
// ---------------------------------------------------------------------------

interface PromptData {
  clientes: Cliente[]
  tabelas: PriceTable[]
  pedidos: Pedido[]
  faturas: Fatura[]
  propostas: Proposta[]
}

function buildSystemPrompt(data: PromptData, command: string, context?: AIContext): string {
  const { clientes, tabelas, pedidos, faturas, propostas } = data
  const d = today()

  // Clientes — always send all (usually < 100)
  const clientesInfo = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    endereco: c.endereco,
    tabelaPrecoId: c.tabelaPrecoId
  }))

  // Tabelas — always send all (usually < 10)
  const tabelasInfo = tabelas.map((t) => ({
    id: t.id,
    nome: t.nome,
    categorias: t.categorias.map((cat) => ({
      nome: cat.nome,
      itens: cat.itens.map((item) => ({
        produto: item.produto,
        unidade: item.unidade,
        preco: item.preco
      }))
    }))
  }))

  // Statistics
  const stats = {
    propostas: {
      total: propostas.length,
      pendentes: propostas.filter((p) => p.status === 'pendente').length,
      aceitas: propostas.filter((p) => p.status === 'aceita').length,
      rejeitadas: propostas.filter((p) => p.status === 'rejeitada').length,
      valor_total: propostas.reduce((s, p) => s + p.total_geral, 0)
    },
    pedidos: {
      total: pedidos.length,
      abertos: pedidos.filter((p) => p.status === 'aberto').length,
      rejeitados: pedidos.filter((p) => p.status === 'rejeitado').length,
      faturados: pedidos.filter((p) => p.status === 'faturado').length,
      valor_total: pedidos.reduce((s, p) => s + p.total_geral, 0)
    },
    faturas: {
      total: faturas.length,
      pendentes: faturas.filter((f) => f.status === 'pendente').length,
      pendentes_valor: faturas.filter((f) => f.status === 'pendente').reduce((s, f) => s + f.total, 0),
      pagas: faturas.filter((f) => f.status === 'paga').length,
      pagas_valor: faturas.filter((f) => f.status === 'paga').reduce((s, f) => s + f.total, 0),
      valor_total: faturas.reduce((s, f) => s + f.total, 0)
    }
  }

  // Active context — full detail for the record being viewed
  let contextSection = ''
  let activePropostaId: string | undefined
  let activePedidoId: string | undefined

  if (context?.proposta_id) {
    const proposta = propostas.find((p) => p.id === context.proposta_id)
    if (proposta) {
      activePropostaId = proposta.id
      contextSection = `
CONTEXTO ACTUAL (REGISTO ACTIVO):
O utilizador esta a ver a proposta ${proposta.numero} (id: ${proposta.id}) do cliente ${proposta.cliente.nome}.
${JSON.stringify(detailProposta(proposta), null, 2)}

Quando o utilizador diz "esta proposta", "converte isto", "estes itens", etc., refere-se a ESTA proposta.
Se o utilizador nao especificar a proposta, usa esta como contexto.
Usa acoes _proposta (add_proposta_items, update_proposta_items, etc), NAO as acoes de pedido.
`
    }
  } else if (context?.pedido_id) {
    const pedido = pedidos.find((p) => p.id === context.pedido_id)
    if (pedido) {
      activePedidoId = pedido.id
      contextSection = `
CONTEXTO ACTUAL (REGISTO ACTIVO):
O utilizador esta a ver o pedido ${pedido.numero} (id: ${pedido.id}) do cliente ${pedido.cliente.nome}.
${JSON.stringify(detailPedido(pedido), null, 2)}

Quando o utilizador diz "este pedido", "fatura isto", "estes itens", etc., refere-se a ESTE pedido.
Se o utilizador nao especificar o pedido, usa este como contexto.
`
    }
  } else if (context?.route === '/propostas') {
    contextSection = '\nCONTEXTO ACTUAL:\nO utilizador esta na lista de propostas. Se pedir para criar, usa create_proposta.\n'
  } else if (context?.route === '/pedidos') {
    contextSection = '\nCONTEXTO ACTUAL:\nO utilizador esta na lista de pedidos.\n'
  } else if (context?.route === '/faturas') {
    contextSection = '\nCONTEXTO ACTUAL:\nO utilizador esta na lista de faturas.\n'
  } else if (context?.route === '/overview') {
    contextSection = '\nCONTEXTO ACTUAL:\nO utilizador esta no dashboard/overview.\n'
  }

  // Recent records — compact summaries only
  const recentPropostas = sortByDate(propostas)
    .filter((p) => p.id !== activePropostaId)
    .slice(0, MAX_RECENT)
    .map(summarizeProposta)

  const recentPedidos = sortByDate(pedidos)
    .filter((p) => p.id !== activePedidoId)
    .slice(0, MAX_RECENT)
    .map(summarizePedido)

  const recentFaturas = sortByDate(faturas)
    .slice(0, MAX_RECENT)
    .map(summarizeFatura)

  // Mentioned records — full detail for records referenced in the command
  const mentioned = searchRecords(command, propostas, pedidos, faturas, clientes)
  const mentionedPropostas = mentioned.propostas
    .filter((p) => p.id !== activePropostaId)
    .slice(0, 5)
    .map(detailProposta)
  const mentionedPedidos = mentioned.pedidos
    .filter((p) => p.id !== activePedidoId)
    .slice(0, 5)
    .map(detailPedido)

  // Build mentioned section only if there are results
  let mentionedSection = ''
  if (mentionedPropostas.length > 0 || mentionedPedidos.length > 0) {
    mentionedSection = '\nREGISTOS MENCIONADOS NO COMANDO (detalhe completo):\n'
    if (mentionedPropostas.length > 0) {
      mentionedSection += `Propostas: ${JSON.stringify(mentionedPropostas, null, 2)}\n`
    }
    if (mentionedPedidos.length > 0) {
      mentionedSection += `Pedidos: ${JSON.stringify(mentionedPedidos, null, 2)}\n`
    }
  }

  return `Tu es um assistente inteligente para gestao de propostas, pedidos e faturas de construcao civil.
Respondes APENAS com JSON valido, sem markdown, sem code blocks, sem texto adicional.

FLUXO: Proposta (orcamento) -> Pedido (encomenda confirmada) -> Fatura (cobranca)

Data de hoje: ${d}
${contextSection}
CLIENTES DISPONIVEIS:
${JSON.stringify(clientesInfo, null, 2)}

TABELAS DE PRECOS:
${JSON.stringify(tabelasInfo, null, 2)}

ESTATISTICAS GERAIS:
${JSON.stringify(stats, null, 2)}

PROPOSTAS RECENTES (${propostas.length} total, mostrando ${recentPropostas.length} mais recentes):
${JSON.stringify(recentPropostas, null, 2)}

PEDIDOS RECENTES (${pedidos.length} total, mostrando ${recentPedidos.length} mais recentes):
${JSON.stringify(recentPedidos, null, 2)}

FATURAS RECENTES (${faturas.length} total, mostrando ${recentFaturas.length} mais recentes):
${JSON.stringify(recentFaturas, null, 2)}
${mentionedSection}
NOTA: Os registos acima sao resumos. O registo activo (CONTEXTO ACTUAL) tem detalhe completo com todos os itens.
Se precisares de detalhes de um registo que nao esta no contexto, pede ao utilizador para abrir esse registo.

ACOES DISPONIVEIS:

=== PROPOSTAS ===

1. CRIAR PROPOSTA - quando o utilizador quer criar uma proposta/orcamento
{
  "action": "create_proposta",
  "cliente": { "id": "...", "nome": "...", "endereco_entrega": "..." },
  "itens": [
    {
      "descricao": "NOME DO SERVICO",
      "descricao_detalhada": "descricao detalhada do servico (opcional mas recomendada)",
      "data_servico": "${d}",
      "unidade": "unidade da tabela",
      "quantidade": 0,
      "valor_unitario": 0,
      "valor_total_sem_desconto": 0,
      "desconto_percentual": 0,
      "desconto_valor": 0,
      "valor_total": 0
    }
  ],
  "total_geral": 0,
  "observacao": ""
}

2. ADICIONAR ITENS A PROPOSTA
{ "action": "add_proposta_items", "proposta_id": "...", "itens": [...], "message": "..." }

3. REMOVER ITENS DA PROPOSTA
{ "action": "remove_proposta_items", "proposta_id": "...", "descricoes": ["..."], "message": "..." }

4. ALTERAR ITENS DA PROPOSTA (retorna TODOS os itens, alterados + inalterados)
{ "action": "update_proposta_items", "proposta_id": "...", "itens": [...], "message": "..." }

5. ALTERAR STATUS DA PROPOSTA
{ "action": "update_proposta_status", "proposta_id": "...", "status": "pendente"|"aceita"|"rejeitada", "message": "..." }

6. DUPLICAR PROPOSTA
{ "action": "duplicate_proposta", "proposta_id": "...", "cliente_id": "...(opcional)", "message": "..." }

7. CONVERTER PROPOSTA EM PEDIDO
{ "action": "convert_proposta", "proposta_id": "...", "descricoes": ["...(opcional, se vazio converte todos)"], "message": "..." }

=== PEDIDOS ===

8. CRIAR PEDIDO
{
  "action": "create_pedido",
  "cliente": { "id": "...", "nome": "...", "endereco_entrega": "..." },
  "itens": [{ "descricao": "...", "data_servico": "${d}", "unidade": "...", "quantidade": 0, "valor_unitario": 0, "valor_total_sem_desconto": 0, "desconto_percentual": 0, "desconto_valor": 0, "valor_total": 0 }],
  "total_geral": 0,
  "observacao": ""
}

9. ADICIONAR ITENS AO PEDIDO
{ "action": "add_items", "pedido_id": "...", "itens": [...], "message": "..." }

10. REMOVER ITENS DO PEDIDO
{ "action": "remove_items", "pedido_id": "...", "descricoes": ["..."], "message": "..." }

11. ALTERAR ITENS DO PEDIDO (retorna TODOS os itens)
{ "action": "update_items", "pedido_id": "...", "itens": [...], "message": "..." }

12. ALTERAR STATUS DO PEDIDO
{ "action": "update_status", "pedido_id": "...", "status": "aberto"|"rejeitado"|"faturado", "message": "..." }

13. DUPLICAR PEDIDO
{ "action": "duplicate_pedido", "pedido_id": "...", "cliente_id": "...(opcional)", "message": "..." }

=== FATURAS ===

14. GERAR FATURA a partir de pedido (parcial ou total)
{ "action": "create_fatura", "pedido_id": "...", "descricoes": ["..."], "observacao": "...", "message": "..." }

=== OUTROS ===

15. CRIAR CLIENTE
{ "action": "create_cliente", "nome": "...", "endereco": "...", "message": "..." }

16. RESPONDER (perguntas, informacoes)
{ "action": "answer", "message": "..." }

INSTRUCOES CRITICAS:
- PROPOSTA vs PEDIDO: "proposta", "orcamento", "orcar" = create_proposta. "pedido", "encomenda" = create_pedido.
- No contexto de proposta, usa acoes _proposta. No contexto de pedido, usa acoes de pedido.
- Se o utilizador diz "criar" sem especificar, usa o contexto da pagina actual.

INSTRUCOES GERAIS:
- Identifica o cliente pelo nome (fuzzy match)
- Identifica propostas pelo numero (P-2026-001) ou pelo nome do cliente
- Identifica pedidos pelo numero (2026-001) ou pelo nome do cliente
- Usa a tabela de precos associada ao cliente para encontrar produtos e precos
- Calcula: valor_total_sem_desconto = quantidade * valor_unitario
- Calcula: desconto_valor = valor_total_sem_desconto * desconto_percentual / 100
- Calcula: valor_total = valor_total_sem_desconto - desconto_valor
- Calcula: total_geral = soma de todos os valor_total dos itens
- Usa "${d}" como data_servico para novos itens
- Para propostas, gera descricao_detalhada profissional
- Retorna APENAS JSON valido`
}

// ---------------------------------------------------------------------------
// Extract JSON from AI response
// ---------------------------------------------------------------------------

function extractJSON(text: string): unknown {
  const trimmed = text.trim()

  try {
    return JSON.parse(trimmed)
  } catch {
    // fallback
  }

  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) {
    return JSON.parse(match[1].trim())
  }

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1))
  }

  throw new Error('Nao foi possivel extrair JSON da resposta da IA')
}

// ---------------------------------------------------------------------------
// Call AI provider
// ---------------------------------------------------------------------------

async function callProvider(apiKey: string, provider: string, systemPrompt: string, userMessage: string, history?: { role: string; content: string }[]): Promise<string> {
  const prev = history ?? []
  switch (provider) {
    case 'openai': {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...prev.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ]
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.2 })
      })
      if (!res.ok) throw new Error(`OpenAI API error (${res.status}): ${await res.text()}`)
      const data = (await res.json()) as { choices: { message: { content: string } }[] }
      return data.choices[0].message.content
    }
    case 'anthropic': {
      const messages = [
        ...prev.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ]
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: systemPrompt,
          messages
        })
      })
      if (!res.ok) throw new Error(`Anthropic API error (${res.status}): ${await res.text()}`)
      const data = (await res.json()) as { content: { type: string; text: string }[] }
      const textBlock = data.content.find((b) => b.type === 'text')
      if (!textBlock) throw new Error('Resposta da Anthropic sem conteudo de texto')
      return textBlock.text
    }
    case 'gemini': {
      const contents = [
        ...prev.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: userMessage }] }
      ]
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.2 }
        })
      })
      if (!res.ok) throw new Error(`Gemini API error (${res.status}): ${await res.text()}`)
      const data = (await res.json()) as { candidates: { content: { parts: { text: string }[] } }[] }
      return data.candidates[0].content.parts[0].text
    }
    default:
      throw new Error(`Provider desconhecido: ${provider}`)
  }
}

// ---------------------------------------------------------------------------
// Execute AI command
// ---------------------------------------------------------------------------

export async function executeAI(command: string, context?: AIContext, history?: { role: string; content: string }[]): Promise<AIResult> {
  const settings = storage.getSettings<AISettings>('ai')
  if (!settings || !settings.apiKey) {
    return { error: 'Configuracoes de IA nao definidas. Vai a pagina de Definicoes para configurar o provider e a API key.' }
  }

  const clientes = storage.list<Cliente>('clientes')
  const tabelas = storage.list<PriceTable>('tabelas-precos')
  const pedidos = storage.list<Pedido>('pedidos')
  const faturas = storage.list<Fatura>('faturas')
  const propostas = storage.list<Proposta>('propostas')

  const data: PromptData = { clientes, tabelas, pedidos, faturas, propostas }
  const systemPrompt = buildSystemPrompt(data, command, context)

  // Prepend context directly into the user message so the model can't miss it
  let userMessage = command
  if (context?.proposta_id) {
    const ctxProposta = propostas.find((p) => p.id === context.proposta_id)
    if (ctxProposta) {
      userMessage = `[CONTEXTO: Estou a ver a proposta ${ctxProposta.numero} (id: ${ctxProposta.id}) do cliente ${ctxProposta.cliente.nome}. Itens: ${ctxProposta.itens.map((i) => i.descricao).join(', ')}. Usa acoes _proposta, NAO acoes de pedido.]\n\n${command}`
    }
  } else if (context?.pedido_id) {
    const ctxPedido = pedidos.find((p) => p.id === context.pedido_id)
    if (ctxPedido) {
      userMessage = `[CONTEXTO: Estou a ver o pedido ${ctxPedido.numero} (id: ${ctxPedido.id}) do cliente ${ctxPedido.cliente.nome}. Itens: ${ctxPedido.itens.map((i) => i.descricao).join(', ')}. Usa este pedido como referencia.]\n\n${command}`
    }
  } else if (context?.route === '/propostas' || context?.route === '/propostas/novo') {
    userMessage = `[CONTEXTO: Estou na pagina de PROPOSTAS. Se eu pedir para criar algo, usa create_proposta, NAO create_pedido.]\n\n${command}`
  }

  let parsed: AIAction
  try {
    const responseText = await callProvider(settings.apiKey, settings.provider, systemPrompt, userMessage, history)
    parsed = extractJSON(responseText) as AIAction
  } catch {
    try {
      const retryText = await callProvider(settings.apiKey, settings.provider, systemPrompt, userMessage + '\n\nIMPORTANTE: Responde APENAS com JSON valido, sem texto adicional.', history)
      parsed = extractJSON(retryText) as AIAction
    } catch {
      return { error: 'Nao foi possivel interpretar a resposta da IA. Tenta reformular o comando.' }
    }
  }

  if (!parsed.action) {
    return { error: 'Resposta da IA com formato invalido: falta campo "action"' }
  }

  switch (parsed.action) {
    case 'create_pedido': {
      if (!parsed.cliente || !Array.isArray(parsed.itens)) {
        return { error: 'Resposta da IA invalida: falta cliente ou itens' }
      }
      const pedido = storage.create<Pedido>('pedidos', {
        numero: generateNumero(pedidos),
        data_emissao: today(),
        cliente: parsed.cliente,
        itens: parsed.itens,
        total_geral: parsed.total_geral ?? recalcTotal(parsed.itens),
        observacao: parsed.observacao ?? '',
        status: 'aberto'
      })
      return { action: 'create_pedido', pedido }
    }

    case 'add_items': {
      const existing = storage.getById<Pedido>('pedidos', parsed.pedido_id)
      if (!existing) {
        const available = pedidos.map(p => p.numero).join(', ')
        return { error: `Pedido não encontrado. Pedidos disponíveis: ${available}` }
      }
      const newItens = [...existing.itens, ...parsed.itens]
      const updated = storage.update<Pedido>('pedidos', existing.id, {
        itens: newItens,
        total_geral: recalcTotal(newItens)
      })
      return { action: 'add_items', pedido: updated!, message: parsed.message }
    }

    case 'remove_items': {
      const existing = storage.getById<Pedido>('pedidos', parsed.pedido_id)
      if (!existing) {
        const available = pedidos.map(p => p.numero).join(', ')
        return { error: `Pedido não encontrado. Pedidos disponíveis: ${available}` }
      }
      const lowered = parsed.descricoes.map((d) => d.toLowerCase())
      const filtered = existing.itens.filter(
        (i) => !lowered.some((desc) => i.descricao.toLowerCase().includes(desc))
      )
      const updated = storage.update<Pedido>('pedidos', existing.id, {
        itens: filtered,
        total_geral: recalcTotal(filtered)
      })
      return { action: 'remove_items', pedido: updated!, message: parsed.message }
    }

    case 'update_items': {
      const existing = storage.getById<Pedido>('pedidos', parsed.pedido_id)
      if (!existing) {
        const available = pedidos.map(p => p.numero).join(', ')
        return { error: `Pedido não encontrado. Pedidos disponíveis: ${available}` }
      }
      const updated = storage.update<Pedido>('pedidos', existing.id, {
        itens: parsed.itens,
        total_geral: recalcTotal(parsed.itens)
      })
      return { action: 'update_items', pedido: updated!, message: parsed.message }
    }

    case 'create_fatura': {
      const existing = storage.getById<Pedido>('pedidos', parsed.pedido_id)
      if (!existing) {
        const available = pedidos.map(p => p.numero).join(', ')
        return { error: `Pedido não encontrado. Pedidos disponíveis: ${available}` }
      }
      const lowered = parsed.descricoes.map((d) => d.toLowerCase())
      const selectedItens = existing.itens.filter(
        (i) => lowered.some((desc) => i.descricao.toLowerCase().includes(desc))
      )
      if (selectedItens.length === 0) {
        return { error: 'Nenhum item encontrado com as descricoes indicadas' }
      }
      const total = recalcTotal(selectedItens)
      const fatura = storage.create<Fatura>('faturas', {
        numero: generateFaturaNumero(faturas),
        data_emissao: today(),
        pedido_id: existing.id,
        pedido_numero: existing.numero,
        cliente: existing.cliente,
        itens: selectedItens,
        total,
        observacao: parsed.observacao ?? '',
        status: 'pendente'
      })
      const remainingItens = existing.itens.filter(
        (i) => !lowered.some((desc) => i.descricao.toLowerCase().includes(desc))
      )
      const newStatus = remainingItens.length === 0 ? 'faturado' : existing.status
      storage.update<Pedido>('pedidos', existing.id, {
        itens: remainingItens,
        total_geral: recalcTotal(remainingItens),
        status: newStatus
      })
      return { action: 'create_fatura', fatura, message: parsed.message }
    }

    case 'update_status': {
      const existing = storage.getById<Pedido>('pedidos', parsed.pedido_id)
      if (!existing) {
        const available = pedidos.map(p => p.numero).join(', ')
        return { error: `Pedido não encontrado. Pedidos disponíveis: ${available}` }
      }
      const updated = storage.update<Pedido>('pedidos', existing.id, {
        status: parsed.status
      })
      return { action: 'update_status', pedido: updated!, message: parsed.message }
    }

    case 'create_cliente': {
      const defaultTabela = tabelas.length > 0 ? tabelas[0].id : ''
      const cliente = storage.create<Cliente>('clientes', {
        nome: parsed.nome,
        endereco: parsed.endereco,
        tabelaPrecoId: defaultTabela
      })
      return { action: 'create_cliente', message: parsed.message || `Cliente ${cliente.nome} criado com sucesso` }
    }

    case 'duplicate_pedido': {
      const source = storage.getById<Pedido>('pedidos', parsed.pedido_id)
      if (!source) {
        const available = pedidos.map(p => p.numero).join(', ')
        return { error: `Pedido não encontrado. Pedidos disponíveis: ${available}` }
      }
      let clienteInfo = source.cliente
      if (parsed.cliente_id) {
        const newCliente = storage.getById<Cliente>('clientes', parsed.cliente_id)
        if (newCliente) {
          clienteInfo = { id: newCliente.id, nome: newCliente.nome, endereco_entrega: newCliente.endereco }
        }
      }
      const newPedido = storage.create<Pedido>('pedidos', {
        numero: generateNumero(pedidos),
        data_emissao: today(),
        cliente: clienteInfo,
        itens: source.itens,
        total_geral: source.total_geral,
        observacao: source.observacao,
        status: 'aberto'
      })
      return { action: 'duplicate_pedido', pedido: newPedido, message: parsed.message || `Pedido ${source.numero} duplicado como ${newPedido.numero}` }
    }

    case 'create_proposta': {
      if (!parsed.cliente || !Array.isArray(parsed.itens)) {
        return { error: 'Resposta da IA invalida: falta cliente ou itens' }
      }
      const proposta = storage.create<Proposta>('propostas', {
        numero: generatePropostaNumero(propostas),
        data_emissao: today(),
        cliente: parsed.cliente,
        itens: parsed.itens,
        total_geral: parsed.total_geral ?? recalcTotal(parsed.itens),
        observacao: parsed.observacao ?? '',
        status: 'pendente'
      })
      return { action: 'create_proposta', proposta }
    }

    case 'add_proposta_items': {
      const existing = storage.getById<Proposta>('propostas', parsed.proposta_id)
      if (!existing) {
        const available = propostas.map(p => p.numero).join(', ')
        return { error: `Proposta não encontrada. Propostas disponíveis: ${available}` }
      }
      const newItens = [...existing.itens, ...parsed.itens]
      const updated = storage.update<Proposta>('propostas', existing.id, {
        itens: newItens,
        total_geral: recalcTotal(newItens)
      })
      return { action: 'add_proposta_items', proposta: updated!, message: parsed.message }
    }

    case 'remove_proposta_items': {
      const existing = storage.getById<Proposta>('propostas', parsed.proposta_id)
      if (!existing) {
        const available = propostas.map(p => p.numero).join(', ')
        return { error: `Proposta não encontrada. Propostas disponíveis: ${available}` }
      }
      const lowered = parsed.descricoes.map((d) => d.toLowerCase())
      const filtered = existing.itens.filter(
        (i) => !lowered.some((desc) => i.descricao.toLowerCase().includes(desc))
      )
      const updated = storage.update<Proposta>('propostas', existing.id, {
        itens: filtered,
        total_geral: recalcTotal(filtered)
      })
      return { action: 'remove_proposta_items', proposta: updated!, message: parsed.message }
    }

    case 'update_proposta_items': {
      const existing = storage.getById<Proposta>('propostas', parsed.proposta_id)
      if (!existing) {
        const available = propostas.map(p => p.numero).join(', ')
        return { error: `Proposta não encontrada. Propostas disponíveis: ${available}` }
      }
      const updated = storage.update<Proposta>('propostas', existing.id, {
        itens: parsed.itens,
        total_geral: recalcTotal(parsed.itens)
      })
      return { action: 'update_proposta_items', proposta: updated!, message: parsed.message }
    }

    case 'update_proposta_status': {
      const existing = storage.getById<Proposta>('propostas', parsed.proposta_id)
      if (!existing) {
        const available = propostas.map(p => p.numero).join(', ')
        return { error: `Proposta não encontrada. Propostas disponíveis: ${available}` }
      }
      const updated = storage.update<Proposta>('propostas', existing.id, {
        status: parsed.status as PropostaStatus
      })
      return { action: 'update_proposta_status', proposta: updated!, message: parsed.message }
    }

    case 'duplicate_proposta': {
      const source = storage.getById<Proposta>('propostas', parsed.proposta_id)
      if (!source) {
        const available = propostas.map(p => p.numero).join(', ')
        return { error: `Proposta não encontrada. Propostas disponíveis: ${available}` }
      }
      let clienteInfo = source.cliente
      if (parsed.cliente_id) {
        const newCliente = storage.getById<Cliente>('clientes', parsed.cliente_id)
        if (newCliente) {
          clienteInfo = { id: newCliente.id, nome: newCliente.nome, endereco_entrega: newCliente.endereco }
        }
      }
      const newProposta = storage.create<Proposta>('propostas', {
        numero: generatePropostaNumero(propostas),
        data_emissao: today(),
        cliente: clienteInfo,
        itens: source.itens,
        total_geral: source.total_geral,
        observacao: source.observacao,
        status: 'pendente'
      })
      return { action: 'duplicate_proposta', proposta: newProposta, message: parsed.message || `Proposta ${source.numero} duplicada como ${newProposta.numero}` }
    }

    case 'convert_proposta': {
      const source = storage.getById<Proposta>('propostas', parsed.proposta_id)
      if (!source) {
        const available = propostas.map(p => p.numero).join(', ')
        return { error: `Proposta não encontrada. Propostas disponíveis: ${available}` }
      }
      let selectedItens = source.itens
      if (parsed.descricoes && parsed.descricoes.length > 0) {
        const lowered = parsed.descricoes.map((d) => d.toLowerCase())
        selectedItens = source.itens.filter(
          (i) => lowered.some((desc) => i.descricao.toLowerCase().includes(desc))
        )
      }
      if (selectedItens.length === 0) {
        return { error: 'Nenhum item encontrado com as descricoes indicadas' }
      }
      const newPedido = storage.create<Pedido>('pedidos', {
        numero: generateNumero(pedidos),
        data_emissao: today(),
        cliente: source.cliente,
        itens: selectedItens,
        total_geral: recalcTotal(selectedItens),
        observacao: source.observacao,
        status: 'aberto'
      })
      storage.update<Proposta>('propostas', source.id, { status: 'aceita' })
      return { action: 'convert_proposta', pedido: newPedido, message: parsed.message || `Proposta ${source.numero} convertida no pedido ${newPedido.numero}` }
    }

    case 'answer': {
      return { action: 'answer', message: parsed.message }
    }

    default:
      return { error: `Acao desconhecida: ${(parsed as { action: string }).action}` }
  }
}

export async function testAIKey(provider: string, apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    await callProvider(apiKey, provider, 'Responde apenas: OK', 'teste')
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
