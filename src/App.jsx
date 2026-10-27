/*
- Arquivo: App.jsx
- Projeto: Sistema Âncora
 *
- Objetivo:
- Centralizar as rotas de navegação da aplicação.
 */

import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import DetalhesAluno from './pages/detalhesaluno';
import PainelEscola from './pages/painelescola';
import Alunos from './pages/alunos';
import Contas from './pages/contas';
import PainelRede from './pages/admin/PainelRede';

import RotaProtegida from './components/RotaProtegida';

// Importa o layout (menu superior) da área do administrador.
import AdminLayout from './components/AdminLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <RotaProtegida>
            <Dashboard />
          </RotaProtegida>
        }
      />

      <Route
        path="/alunos"
        element={
          <RotaProtegida>
            <Alunos />
          </RotaProtegida>
        }
      />

      <Route
        path="/alunos/:id"
        element={
          <RotaProtegida>
            <DetalhesAluno />
          </RotaProtegida>
        }
      />

      <Route
        path="/painel-escola"
        element={
          <RotaProtegida>
            <PainelEscola />
          </RotaProtegida>
        }
      />

      {/* Tela de contas */}
<Route
  path="/contas"
  element={
    <RotaProtegida>
      <Contas />
    </RotaProtegida>
  }
/>

{/* Área administrativa — nível 3 */}
      <Route
        path="/admin"
        element={
          <RotaProtegida niveis={[3]}>
            <AdminLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<PainelRede />} />

        {/* Futuras telas administrativas */}
        {/* alertas, escolas, alunos, usuarios, contas */}
      </Route>

      {/* Endereços não reconhecidos retornam para o login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
