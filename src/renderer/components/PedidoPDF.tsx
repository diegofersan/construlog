import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import type { Pedido, PedidoStatus } from '../../shared/types'
import { EMPRESA } from '../../shared/types'
import { pdfStyles, COLORS, formatCurrency, formatDate } from './pdfStyles'
import logotipo from '../assets/logotipoBase64'

const STATUS_COLORS: Record<PedidoStatus, { bg: string; text: string }> = {
  aberto: { bg: COLORS.statusAbertoBg, text: COLORS.statusAbertoText },
  rejeitado: { bg: COLORS.statusRejeitadoBg, text: COLORS.statusRejeitadoText },
  faturado: { bg: COLORS.statusFaturadoBg, text: COLORS.statusFaturadoText }
}

const STATUS_LABELS: Record<PedidoStatus, string> = {
  aberto: 'Aberto',
  rejeitado: 'Rejeitado',
  faturado: 'Faturado'
}

export default function PedidoPDF({ pedido }: { pedido: Pedido }) {
  const statusColor = STATUS_COLORS[pedido.status]

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header: logo left, company info right, thin separator below */}
        <View style={pdfStyles.header}>
          <Image src={logotipo} style={pdfStyles.headerLogo} />
          <View style={pdfStyles.headerText}>
            <Text style={pdfStyles.empresaInfo}>{EMPRESA.endereco}</Text>
            <Text style={pdfStyles.empresaInfo}>{EMPRESA.telefone}</Text>
            <Text style={pdfStyles.empresaInfo}>CNPJ: {EMPRESA.cnpj}</Text>
          </View>
        </View>

        {/* Document title */}
        <Text style={pdfStyles.documentTitle}>Pedido</Text>

        {/* Info grid */}
        <View style={pdfStyles.infoRow}>
          <View style={pdfStyles.infoBox}>
            <Text style={pdfStyles.infoLabel}>Pedido</Text>
            <Text style={pdfStyles.infoValue}>{pedido.numero}</Text>
          </View>
          <View style={pdfStyles.infoBox}>
            <Text style={pdfStyles.infoLabel}>Data de Emissao</Text>
            <Text style={pdfStyles.infoValue}>{formatDate(pedido.data_emissao)}</Text>
          </View>
          <View style={pdfStyles.infoBox}>
            <Text style={pdfStyles.infoLabel}>Cliente</Text>
            <Text style={pdfStyles.infoValue}>{pedido.cliente.nome}</Text>
          </View>
          <View style={pdfStyles.infoBox}>
            <Text style={pdfStyles.infoLabel}>Status</Text>
            <Text
              style={[
                pdfStyles.statusBadge,
                { backgroundColor: statusColor.bg, color: statusColor.text }
              ]}
            >
              {STATUS_LABELS[pedido.status]}
            </Text>
          </View>
        </View>

        {/* Items table */}
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colDescricao]}>Descricao</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colData]}>Data Serv.</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colUnidade]}>Unidade</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colQtd]}>Qtd</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colValorUnit]}>Valor Unit.</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colDesconto]}>Desc. (%)</Text>
            <Text style={[pdfStyles.tableHeaderText, pdfStyles.colTotal]}>Valor Total</Text>
          </View>

          {pedido.itens.map((item, idx) => (
            <View
              key={idx}
              style={[pdfStyles.tableRow, idx % 2 === 1 ? pdfStyles.tableRowAlt : {}]}
            >
              <Text style={pdfStyles.colDescricao}>{item.descricao}</Text>
              <Text style={pdfStyles.colData}>{formatDate(item.data_servico)}</Text>
              <Text style={pdfStyles.colUnidade}>{item.unidade}</Text>
              <Text style={pdfStyles.colQtd}>{String(item.quantidade)}</Text>
              <Text style={pdfStyles.colValorUnit}>{formatCurrency(item.valor_unitario)}</Text>
              <Text style={pdfStyles.colDesconto}>
                {item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-'}
              </Text>
              <Text style={pdfStyles.colTotal}>{formatCurrency(item.valor_total)}</Text>
            </View>
          ))}

          {/* Total row */}
          <View style={pdfStyles.totalRow}>
            <Text style={pdfStyles.totalLabel}>TOTAL GERAL</Text>
            <Text style={pdfStyles.totalValue}>{formatCurrency(pedido.total_geral)}</Text>
          </View>
        </View>

        {/* Observations */}
        {pedido.observacao ? (
          <View style={pdfStyles.obsSection}>
            <Text style={pdfStyles.obsLabel}>Observacao</Text>
            <Text style={pdfStyles.obsText}>{pedido.observacao}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
