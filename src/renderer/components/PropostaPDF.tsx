import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { Proposta } from '../../shared/types'
import { EMPRESA } from '../../shared/types'
import logotipo from '../assets/logotipoBase64'

const BLUE = '#1e3a5f'
const GRAY = '#6b7280'
const GRAY_LIGHT = '#d1d5db'
const BG_LIGHT = '#f7f7f8'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 50,
    paddingBottom: 80,
    color: '#1a1a1a'
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 24,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE
  },
  headerLogo: {
    height: 45
  },
  headerInfo: {
    textAlign: 'right'
  },
  headerInfoText: {
    fontSize: 7,
    color: GRAY,
    lineHeight: 1.6,
    textAlign: 'right'
  },

  // Title
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: BLUE,
    marginBottom: 20
  },

  // Client + Date row
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_LIGHT
  },
  clientLabel: {
    fontSize: 9,
    color: GRAY
  },
  clientName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a'
  },
  dateText: {
    fontSize: 9,
    color: GRAY
  },
  dateValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a'
  },

  // Service block
  serviceBlock: {
    marginBottom: 16
  },
  serviceTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: BLUE,
    marginBottom: 4
  },
  serviceDesc: {
    fontSize: 8.5,
    color: GRAY,
    lineHeight: 1.5,
    marginBottom: 6
  },
  serviceValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#1a1a1a',
    textAlign: 'right',
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_LIGHT
  },

  // Total
  totalBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: BG_LIGHT,
    borderTopWidth: 1.5,
    borderTopColor: BLUE,
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE
  },
  totalLabel: {
    fontSize: 10,
    color: GRAY
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: BLUE
  },

  // Observation
  obsText: {
    fontSize: 8,
    fontStyle: 'italic',
    color: GRAY,
    marginTop: 12
  },

  // Signature
  signatureSection: {
    marginTop: 50,
    alignItems: 'center'
  },
  signatureLine: {
    width: 200,
    borderBottomWidth: 0.5,
    borderBottomColor: GRAY_LIGHT,
    borderBottomStyle: 'dashed' as any,
    marginBottom: 6
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: BLUE
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: GRAY_LIGHT,
    paddingTop: 8,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 7,
    color: GRAY
  }
})

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function buildServiceDescription(item: Proposta['itens'][0]): string {
  if (item.descricao_detalhada) return item.descricao_detalhada

  const parts: string[] = []
  if (item.quantidade > 1) {
    parts.push(`${item.quantidade} ${item.unidade.toLowerCase()}`)
  } else {
    parts.push(`1 ${item.unidade.toLowerCase()}`)
  }
  parts.push(`a ${formatCurrency(item.valor_unitario)}/${item.unidade.toLowerCase()}`)
  if (item.desconto_percentual > 0) {
    parts.push(`com ${item.desconto_percentual}% de desconto`)
  }
  if (item.data_servico) {
    parts.push(`previsto para ${formatDate(item.data_servico)}`)
  }
  return parts.join(' — ')
}

export default function PropostaPDF({ proposta }: { proposta: Proposta }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Image src={logotipo} style={s.headerLogo} />
          <View style={s.headerInfo}>
            <Text style={s.headerInfoText}>{EMPRESA.endereco}</Text>
            <Text style={s.headerInfoText}>{EMPRESA.telefone}</Text>
            <Text style={s.headerInfoText}>CNPJ: {EMPRESA.cnpj}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>Proposta de Prestacao de Servicos</Text>

        {/* Client + Date */}
        <View style={s.clientRow}>
          <Text>
            <Text style={s.clientLabel}>Cliente: </Text>
            <Text style={s.clientName}>{proposta.cliente.nome}</Text>
          </Text>
          <Text>
            <Text style={s.dateText}>Data: </Text>
            <Text style={s.dateValue}>{formatDate(proposta.data_emissao)}</Text>
          </Text>
        </View>

        {/* Services */}
        {proposta.itens.map((item, idx) => (
          <View key={idx} style={s.serviceBlock}>
            <Text style={s.serviceTitle}>
              {`Servico ${idx + 1} \u2013 ${item.descricao}`}
            </Text>
            <Text style={s.serviceDesc}>
              {buildServiceDescription(item)}
            </Text>
            <Text style={s.serviceValue}>
              {formatCurrency(item.valor_total)}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={s.totalBlock}>
          <Text style={s.totalLabel}>Valor total dos servicos</Text>
          <Text style={s.totalValue}>{formatCurrency(proposta.total_geral)}</Text>
        </View>

        {/* Observation */}
        {proposta.observacao ? (
          <Text style={s.obsText}>{proposta.observacao}</Text>
        ) : (
          <Text style={s.obsText}>Prazo e forma de pagamento a combinar.</Text>
        )}

        {/* Signature */}
        <View style={s.signatureSection}>
          <View style={s.signatureLine} />
          <Text style={s.signatureName}>{EMPRESA.nome}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{EMPRESA.nome} | Materiais de Construcao</Text>
        </View>
      </Page>
    </Document>
  )
}
