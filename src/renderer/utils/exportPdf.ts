import { pdf } from '@react-pdf/renderer'
import { createElement } from 'react'
import PedidoPDF from '../components/PedidoPDF'
import FaturaPDF from '../components/FaturaPDF'
import PropostaPDF from '../components/PropostaPDF'
import type { Pedido, Fatura, Proposta } from '../../shared/types'

export async function exportPedidoPdf(pedido: Pedido): Promise<void> {
  try {
    const doc = createElement(PedidoPDF, { pedido }) as any
    const blob = await pdf(doc).toBlob()
    const arrayBuffer = await blob.arrayBuffer()
    const data = Array.from(new Uint8Array(arrayBuffer))

    const sanitizedCliente = pedido.cliente.nome.replace(/[^a-zA-Z0-9\s-]/g, '').trim()
    const fileName = `Pedido-${pedido.numero}-${sanitizedCliente}.pdf`

    await window.electronAPI.savePdf(fileName, data)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw new Error('Falha ao gerar o PDF. Tente novamente.')
  }
}

export async function exportFaturaPdf(fatura: Fatura): Promise<void> {
  try {
    const doc = createElement(FaturaPDF, { fatura }) as any
    const blob = await pdf(doc).toBlob()
    const arrayBuffer = await blob.arrayBuffer()
    const data = Array.from(new Uint8Array(arrayBuffer))

    const sanitizedCliente = fatura.cliente.nome.replace(/[^a-zA-Z0-9\s-]/g, '').trim()
    const fileName = `Fatura-${fatura.numero}-${sanitizedCliente}.pdf`

    await window.electronAPI.savePdf(fileName, data)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw new Error('Falha ao gerar o PDF. Tente novamente.')
  }
}

export async function exportPropostaPdf(proposta: Proposta): Promise<void> {
  try {
    const doc = createElement(PropostaPDF, { proposta }) as any
    const blob = await pdf(doc).toBlob()
    const arrayBuffer = await blob.arrayBuffer()
    const data = Array.from(new Uint8Array(arrayBuffer))

    const sanitizedCliente = proposta.cliente.nome.replace(/[^a-zA-Z0-9\s-]/g, '').trim()
    const fileName = `Proposta-${proposta.numero}-${sanitizedCliente}.pdf`

    await window.electronAPI.savePdf(fileName, data)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    throw new Error('Falha ao gerar o PDF. Tente novamente.')
  }
}
