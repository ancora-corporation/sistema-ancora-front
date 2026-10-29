
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
import DetalhesAluno from './pages/compartilhados/DetalhesAluno';
import PainelEscola from './pages/diretor/PainelEscola';
import Alunos from './pages/compartilhados/Alunos';
import BuscarAlunos from './pages/compartilhados/BuscarAlunos';
import PainelAlunos from './pages/social/PainelAlunos';
import Contas from './pages/diretor/Contas';
import Ocorrencias from './pages/diretor/Ocorrencias';
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

            {/* Tela Alunos (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/buscar-alunos"
        element={
          <RotaProtegida>
            <BuscarAlunos />
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
