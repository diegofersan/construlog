import { StyleSheet } from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Color palette — professional, restrained, construction-industry appropriate
// ---------------------------------------------------------------------------
export const COLORS = {
  // Primary text
  black: '#1a1a1a',
  darkGray: '#2d2d2d',
  mediumGray: '#6b7280',
  lightGray: '#9ca3af',

  // Backgrounds & lines
  white: '#ffffff',
  offWhite: '#fafafa', // subtle alternating row
  borderLight: '#d4d4d4', // thin table lines
  borderMedium: '#9ca3af', // header separator
  sectionBg: '#f5f5f5', // observations background

  // Accent — a single, muted charcoal tone used sparingly
  accent: '#2d2d2d',
  accentLight: '#4a4a4a',

  // Status colors (pedido-specific, kept for compatibility)
  statusAbertoBg: '#f0f4f8',
  statusAbertoText: '#3b5998',
  statusRejeitadoBg: '#fef2f2',
  statusRejeitadoText: '#b91c1c',
  statusFaturadoBg: '#ecfdf5',
  statusFaturadoText: '#047857'
} as const

// ---------------------------------------------------------------------------
// Shared stylesheet for PedidoPDF and FaturaPDF
// ---------------------------------------------------------------------------
export const pdfStyles = StyleSheet.create({
  // -- Page ------------------------------------------------------------------
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 40,
    color: COLORS.black
  },

  // -- Company header --------------------------------------------------------
  // White background, logo left, company info right, thin line below
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight
  },
  headerLogo: {
    height: 50
  },
  headerText: {
    textAlign: 'right' as const
  },
  empresaInfo: {
    fontSize: 7.5,
    color: COLORS.mediumGray,
    lineHeight: 1.5,
    textAlign: 'right' as const
  },

  // -- Document title (PEDIDO / FATURA) --------------------------------------
  documentTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16
  },

  // -- Info grid (client, dates, etc.) ---------------------------------------
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12
  },
  infoBox: {
    flex: 1
  },
  infoLabel: {
    fontSize: 6.5,
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3
  },
  infoValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.black
  },

  // -- Status badge (pedido only) --------------------------------------------
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'flex-start',
    marginTop: 1
  },

  // -- Table -----------------------------------------------------------------
  table: {
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.accent
  },
  tableHeaderText: {
    color: COLORS.darkGray,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight
  },
  tableRowAlt: {
    backgroundColor: COLORS.offWhite
  },

  // Column widths — shared between header and body
  colDescricao: { width: '28%' },
  colData: { width: '12%' },
  colUnidade: { width: '10%' },
  colQtd: { width: '8%', textAlign: 'right' as const },
  colValorUnit: { width: '14%', textAlign: 'right' as const },
  colDesconto: { width: '10%', textAlign: 'right' as const },
  colTotal: { width: '18%', textAlign: 'right' as const },

  // -- Totals row ------------------------------------------------------------
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.accent,
    marginTop: 2
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: COLORS.black,
    flex: 1
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: COLORS.black,
    width: '18%',
    textAlign: 'right' as const
  },

  // -- Observations ----------------------------------------------------------
  obsSection: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight
  },
  obsLabel: {
    fontSize: 6.5,
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5
  },
  obsText: {
    fontSize: 9,
    color: COLORS.darkGray,
    lineHeight: 1.6
  },

  // -- Footer (optional, for future use) -------------------------------------
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  footerText: {
    fontSize: 6.5,
    color: COLORS.lightGray
  }
})

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
