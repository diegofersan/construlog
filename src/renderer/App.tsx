import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ClientesPage from './pages/ClientesPage'
import TabelaPrecosPage from './pages/TabelaPrecosPage'
import TabelaPrecosEditorPage from './pages/TabelaPrecosEditorPage'
import OverviewPage from './pages/OverviewPage'
import PedidosPage from './pages/PedidosPage'
import PedidoEditorPage from './pages/PedidoEditorPage'
import FaturasPage from './pages/FaturasPage'
import FaturaViewPage from './pages/FaturaViewPage'
import PropostasPage from './pages/PropostasPage'
import PropostaEditorPage from './pages/PropostaEditorPage'
import ClienteDetailPage from './pages/ClienteDetailPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/propostas" element={<PropostasPage />} />
        <Route path="/propostas/novo" element={<PropostaEditorPage />} />
        <Route path="/propostas/:id/editar" element={<PropostaEditorPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/pedidos/novo" element={<PedidoEditorPage />} />
        <Route path="/pedidos/:id/editar" element={<PedidoEditorPage />} />
        <Route path="/faturas" element={<FaturasPage />} />
        <Route path="/faturas/:id" element={<FaturaViewPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/:id" element={<ClienteDetailPage />} />
        <Route path="/tabelas-precos" element={<TabelaPrecosPage />} />
        <Route path="/tabelas-precos/nova" element={<TabelaPrecosEditorPage />} />
        <Route path="/tabelas-precos/:id/editar" element={<TabelaPrecosEditorPage />} />
        <Route path="/definicoes" element={<SettingsPage />} />
      </Routes>
    </Layout>
  )
}
