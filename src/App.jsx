
/*
 * Arquivo: App.jsx
 * Projeto: Sistema Âncora
 *
 * Objetivo:
 * Centralizar as rotas de navegação da aplicação.
 */

import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import DetalhesAluno from './pages/detalhesaluno';
import PainelEscola from './pages/painelescola';
import Alunos from './pages/alunos';
import PainelAlunos from './pages/painelalunos';
import Contas from './pages/contas';
import Ocorrencias from './pages/ocorrencias';
import PainelRede from './pages/admin/PainelRede';

import RotaProtegida from './components/RotaProtegida';

// Importa o layout (menu superior) da área do administrador.
import AdminLayout from './components/AdminLayout';

export default function App() {
  return (
    <Routes>
      {/* Página de login */}
      <Route path="/login" element={<Login />} />

      {/* Painel principal */}
      <Route
        path="/dashboard"
        element={
          <RotaProtegida>
            <Dashboard />
          </RotaProtegida>
        }
      />

      {/* Listagem de alunos */}
      <Route
        path="/alunos"
        element={
          <RotaProtegida>
            <Alunos />
          </RotaProtegida>
        }
      />

      {/* Detalhes de um aluno */}
      <Route
        path="/alunos/:id"
        element={
          <RotaProtegida>
            <DetalhesAluno />
          </RotaProtegida>
        }
      />

      {/* Painel da escola */}
      <Route
        path="/painel-escola"
        element={
          <RotaProtegida>
            <PainelEscola />
          </RotaProtegida>
        }
      />

      {/* Gerenciamento de contas */}
      {/* Painel Alunos (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/painel-alunos"
        element={
          <RotaProtegida>
            <PainelAlunos />
          </RotaProtegida>
        }
      />

      {/* Acompanhamento de ocorrências */}
      <Route
        path="/ocorrencias"
        element={
          <RotaProtegida>
            <Ocorrencias />
          </RotaProtegida>
        }
      />

      {/* Redireciona rotas desconhecidas para o login */}
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
