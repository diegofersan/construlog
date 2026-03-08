import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { AIResult, AIContext, AIMessage } from '../../shared/types'

type Status = 'idle' | 'loading' | 'error' | 'confirming'

const DESTRUCTIVE_PATTERN = /remov|apag|delet|fatur|convert|rejeit/i
const MAX_HISTORY_PAIRS = 5

function useAIContext(): AIContext {
  const location = useLocation()
  const path = location.pathname
  const pedidoMatch = path.match(/^\/pedidos\/([^/]+)\/editar$/)
  const propostaMatch = path.match(/^\/propostas\/([^/]+)\/editar$/)
  return {
    route: path,
    pedido_id: pedidoMatch?.[1],
    proposta_id: propostaMatch?.[1]
  }
}

function getQuickActions(context: AIContext): string[] {
  if (context.proposta_id) {
    return ['Converter em pedido', 'Alterar status', 'Adicionar itens']
  }
  if (context.pedido_id) {
    return ['Faturar tudo', 'Alterar status', 'Adicionar itens']
  }
  if (context.route === '/propostas') {
    return ['Propostas pendentes', 'Criar proposta']
  }
  if (context.route === '/pedidos') {
    return ['Pedidos abertos', 'Criar pedido']
  }
  if (context.route === '/faturas') {
    return ['Faturas pendentes', 'Total faturado']
  }
  if (context.route === '/overview') {
    return ['Resumo geral', 'Propostas pendentes']
  }
  return ['Ajuda']
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((item, i) => (
            <li key={i}><InlineMarkdown text={item} /></li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const listMatch = line.match(/^[\-\*•]\s+(.+)/)
    if (listMatch) {
      listItems.push(listMatch[1])
    } else {
      flushList()
      if (line.trim() === '') {
        elements.push(<div key={`br-${i}`} className="h-1" />)
      } else {
        elements.push(<p key={`p-${i}`}><InlineMarkdown text={line} /></p>)
      }
    }
  }
  flushList()

  return <div className="space-y-0.5">{elements}</div>
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  pedidoId?: string
  faturaId?: string
  propostaId?: string
}

interface AIAssistantProps {
  open: boolean
  onClose: () => void
}

export default function AIAssistant({ open, onClose }: AIAssistantProps) {
  const [command, setCommand] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [pendingCommand, setPendingCommand] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const aiContext = useAIContext()

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  function getHistory(): AIMessage[] {
    const pairs = messages.slice(-(MAX_HISTORY_PAIRS * 2))
    return pairs.map((m) => ({ role: m.role, content: m.content }))
  }

  function notifyDataChanged() {
    window.dispatchEvent(new CustomEvent('ai:data-changed'))
  }

  async function handleExecute(overrideCommand?: string) {
    const cmd = overrideCommand ?? command
    if (!cmd.trim()) return

    if (status !== 'confirming' && DESTRUCTIVE_PATTERN.test(cmd)) {
      setPendingCommand(cmd)
      setStatus('confirming')
      return
    }

    const cmdToExecute = status === 'confirming' ? pendingCommand : cmd
    setStatus('loading')
    setCommand('')
    setErrorMsg('')
    setPendingCommand('')

    setMessages((prev) => [...prev, { role: 'user', content: cmdToExecute }])

    try {
      const history = getHistory()
      const result: AIResult = await window.electronAPI.ai.execute(cmdToExecute, aiContext, history)

      if ('error' in result) {
        setStatus('error')
        setErrorMsg(result.error)
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      let msg = ''
      let pedidoId: string | undefined
      let faturaId: string | undefined
      let propostaId: string | undefined
      let navigateTo: string | undefined

      switch (result.action) {
        case 'create_proposta':
          msg = `Proposta ${result.proposta.numero} criada!`
          propostaId = result.proposta.id
          navigateTo = `/propostas/${result.proposta.id}/editar`
          break
        case 'add_proposta_items':
        case 'remove_proposta_items':
        case 'update_proposta_items':
          msg = result.message
          propostaId = result.proposta.id
          navigateTo = `/propostas/${result.proposta.id}/editar`
          break
        case 'update_proposta_status':
          msg = result.message
          propostaId = result.proposta.id
          break
        case 'duplicate_proposta':
          msg = result.message
          propostaId = result.proposta.id
          navigateTo = `/propostas/${result.proposta.id}/editar`
          break
        case 'convert_proposta':
          msg = result.message
          pedidoId = result.pedido.id
          navigateTo = `/pedidos/${result.pedido.id}/editar`
          break
        case 'create_pedido':
          msg = `Pedido ${result.pedido.numero} criado!`
          pedidoId = result.pedido.id
          navigateTo = `/pedidos/${result.pedido.id}/editar`
          break
        case 'add_items':
        case 'remove_items':
        case 'update_items':
          msg = result.message
          pedidoId = result.pedido.id
          navigateTo = `/pedidos/${result.pedido.id}/editar`
          break
        case 'update_status':
          msg = result.message
          pedidoId = result.pedido.id
          break
        case 'create_cliente':
          msg = result.message
          navigateTo = '/clientes'
          break
        case 'duplicate_pedido':
          msg = result.message
          pedidoId = result.pedido.id
          navigateTo = `/pedidos/${result.pedido.id}/editar`
          break
        case 'create_fatura':
          msg = result.message
          faturaId = result.fatura.id
          navigateTo = `/faturas/${result.fatura.id}`
          break
        case 'answer':
          msg = result.message
          break
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: msg, pedidoId, faturaId, propostaId }])
      setStatus('idle')

      // Notify data hooks to refresh
      if (result.action !== 'answer') {
        notifyDataChanged()
      }

      // Auto-navigate after a brief delay so user sees the response
      if (navigateTo) {
        setTimeout(() => {
          navigate(navigateTo!)
        }, 800)
      }
    } catch (err: unknown) {
      setStatus('error')
      const msg = err instanceof Error ? err.message : 'Erro ao processar comando'
      setErrorMsg(msg)
      setMessages((prev) => prev.slice(0, -1))
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleExecute()
    }
  }

  function handleNewConversation() {
    setStatus('idle')
    setErrorMsg('')
    setMessages([])
    setPendingCommand('')
    setCommand('')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleCancelConfirm() {
    setStatus('idle')
    setPendingCommand('')
  }

  function handleNavigateProposta(id: string) {
    navigate(`/propostas/${id}/editar`)
  }

  function handleNavigatePedido(id: string) {
    navigate(`/pedidos/${id}/editar`)
  }

  function handleNavigateFatura(id: string) {
    navigate(`/faturas/${id}`)
  }

  return (
    <aside
      className={`flex flex-col bg-white border-l border-gray-200 transition-all duration-200 overflow-hidden ${
        open ? 'w-[380px]' : 'w-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          <span className="text-sm font-semibold text-gray-900">Assistente IA</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Context indicator */}
      {(aiContext.proposta_id || aiContext.pedido_id) && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
          <p className="text-xs text-blue-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contexto: {aiContext.proposta_id ? 'proposta actual' : 'pedido actual'}
          </p>
        </div>
      )}

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && status !== 'loading' && (
          <div className="text-center py-8">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            <p className="text-sm text-gray-400 mb-4">Como posso ajudar?</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {getQuickActions(aiContext).map((label) => (
                <button
                  key={label}
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-full px-3 py-1 cursor-pointer transition-colors"
                  onClick={() => handleExecute(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.role === 'assistant' ? (
                <SimpleMarkdown text={msg.content} />
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              {msg.propostaId && (
                <button
                  onClick={() => handleNavigateProposta(msg.propostaId!)}
                  className={`mt-1 text-xs font-medium underline cursor-pointer ${
                    msg.role === 'user' ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Ver Proposta
                </button>
              )}
              {msg.pedidoId && (
                <button
                  onClick={() => handleNavigatePedido(msg.pedidoId!)}
                  className={`mt-1 text-xs font-medium underline cursor-pointer ${
                    msg.role === 'user' ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Ver Pedido
                </button>
              )}
              {msg.faturaId && (
                <button
                  onClick={() => handleNavigateFatura(msg.faturaId!)}
                  className={`mt-1 text-xs font-medium underline cursor-pointer ${
                    msg.role === 'user' ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Ver Fatura
                </button>
              )}
            </div>
          </div>
        ))}

        {status === 'loading' && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">A pensar...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 border border-red-200 p-3 shrink-0">
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Confirmation */}
      {status === 'confirming' && (
        <div className="mx-4 mb-2 rounded-lg bg-amber-50 border border-amber-300 p-3 space-y-2 shrink-0">
          <p className="text-sm text-amber-800 font-medium">
            Esta acao pode remover ou alterar itens. Continuar?
          </p>
          <p className="text-xs text-amber-700 truncate">{pendingCommand}</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleExecute()}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 cursor-pointer transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={handleCancelConfirm}
              className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 shrink-0">
        {messages.length > 0 && (
          <button
            onClick={handleNewConversation}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer mb-2"
          >
            Nova conversa
          </button>
        )}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            placeholder={messages.length > 0
              ? 'Continuar conversa...'
              : aiContext.proposta_id
                ? 'Ex: Converte em pedido, Adiciona um item'
                : aiContext.pedido_id
                  ? 'Ex: Fatura os dois primeiros itens'
                  : 'Ex: Cria proposta para Casa Noya'}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={status === 'loading' || status === 'confirming'}
          />
          <button
            onClick={() => handleExecute()}
            disabled={status === 'loading' || status === 'confirming' || !command.trim()}
            className="self-end px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
