import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import type { Fatura } from '../../shared/types'
import { EMPRESA } from '../../shared/types'
import { pdfStyles, formatCurrency, formatDate } from './pdfStyles'
import logotipo from '../assets/logotipoBase64'

const s = pdfStyles

export default function FaturaPDF({ fatura }: { fatura: Fatura }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header — logo left, company info right, thin separator */}
        <View style={s.header}>
          <Image src={logotipo} style={s.headerLogo} />
          <View style={s.headerText}>
            <Text style={s.empresaInfo}>{EMPRESA.endereco}</Text>
            <Text style={s.empresaInfo}>{EMPRESA.telefone}</Text>
            <Text style={s.empresaInfo}>CNPJ: {EMPRESA.cnpj}</Text>
          </View>
        </View>

        {/* Document title */}
        <Text style={s.documentTitle}>Fatura</Text>

        {/* Info grid */}
        <View style={s.infoRow}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Fatura</Text>
            <Text style={s.infoValue}>{fatura.numero}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Data de Emissao</Text>
            <Text style={s.infoValue}>{formatDate(fatura.data_emissao)}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Pedido Ref.</Text>
            <Text style={s.infoValue}>{fatura.pedido_numero}</Text>
          </View>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Cliente</Text>
            <Text style={s.infoValue}>{fatura.cliente.nome}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={s.table}>
          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colDescricao]}>Descricao</Text>
            <Text style={[s.tableHeaderText, s.colData]}>Data Serv.</Text>
            <Text style={[s.tableHeaderText, s.colUnidade]}>Unidade</Text>
            <Text style={[s.tableHeaderText, s.colQtd]}>Qtd</Text>
            <Text style={[s.tableHeaderText, s.colValorUnit]}>Valor Unit.</Text>
            <Text style={[s.tableHeaderText, s.colDesconto]}>Desc. (%)</Text>
            <Text style={[s.tableHeaderText, s.colTotal]}>Valor Total</Text>
          </View>

          {/* Table rows */}
          {fatura.itens.map((item, idx) => (
            <View
              key={idx}
              style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <Text style={s.colDescricao}>{item.descricao}</Text>
              <Text style={s.colData}>{formatDate(item.data_servico)}</Text>
              <Text style={s.colUnidade}>{item.unidade}</Text>
              <Text style={s.colQtd}>{String(item.quantidade)}</Text>
              <Text style={s.colValorUnit}>{formatCurrency(item.valor_unitario)}</Text>
              <Text style={s.colDesconto}>
                {item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-'}
              </Text>
              <Text style={s.colTotal}>{formatCurrency(item.valor_total)}</Text>
            </View>
          ))}

          {/* Total row */}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL</Text>
            <Text style={s.totalValue}>{formatCurrency(fatura.total)}</Text>
          </View>
        </View>

        {/* Observations */}
        {fatura.observacao ? (
          <View style={s.obsSection}>
            <Text style={s.obsLabel}>Observacao</Text>
            <Text style={s.obsText}>{fatura.observacao}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
