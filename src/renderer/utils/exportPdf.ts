import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import PedidoPDF from '../components/PedidoPDF'
import FaturaPDF from '../components/FaturaPDF'
import PropostaPDF from '../components/PropostaPDF'
import type { Pedido, Fatura, Proposta } from '../../shared/types'

type ExportMode = 'save' | 'copy'

async function generatePdfData(doc: any): Promise<number[]> {
  const blob = await pdf(doc).toBlob()
  const arrayBuffer = await blob.arrayBuffer()
  return Array.from(new Uint8Array(arrayBuffer))
}

async function handleExport(fileName: string, data: number[], mode: ExportMode): Promise<void> {
  if (mode === 'copy') {
    await window.electronAPI.copyPdf(fileName, data)
  } else {
    await window.electronAPI.savePdf(fileName, data)
  }
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, '').trim()
}

export async function exportPedidoPdf(pedido: Pedido, mode: ExportMode = 'save'): Promise<void> {
  try {
    const doc = createElement(PedidoPDF, { pedido }) as any
    const data = await generatePdfData(doc)
    const fileName = `Pedido-${pedido.numero}-${sanitize(pedido.cliente.nome)}.pdf`
    await handleExport(fileName, data, mode)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw new Error('Falha ao gerar o PDF. Tente novamente.')
  }
}

export async function exportFaturaPdf(fatura: Fatura, mode: ExportMode = 'save'): Promise<void> {
  try {
    const doc = createElement(FaturaPDF, { fatura }) as any
    const data = await generatePdfData(doc)
    const fileName = `Fatura-${fatura.numero}-${sanitize(fatura.cliente.nome)}.pdf`
    await handleExport(fileName, data, mode)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw new Error('Falha ao gerar o PDF. Tente novamente.')
  }
}

export async function exportPropostaPdf(proposta: Proposta, mode: ExportMode = 'save'): Promise<void> {
  try {
    const doc = createElement(PropostaPDF, { proposta }) as any
    const data = await generatePdfData(doc)
    const fileName = `Proposta-${proposta.numero}-${sanitize(proposta.cliente.nome)}.pdf`
    await handleExport(fileName, data, mode)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw new Error('Falha ao gerar o PDF. Tente novamente.')
  }
}
