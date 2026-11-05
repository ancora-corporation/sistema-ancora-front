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
import Intervencoes from './pages/social/Intervencoes';
import Contas from './pages/diretor/Contas';
import Ocorrencias from './pages/diretor/Ocorrencias';
import PainelRede from './pages/admin/PainelRede';
import AlertasRede from './pages/admin/AlertasRede';
import UsuariosRede from './pages/admin/UsuariosRede';

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

      {/* Gerenciamento de contas */}
      <Route
        path="/contas"
        element={
          <RotaProtegida>
            <Contas />
          </RotaProtegida>
        }
      />

      {/* Intervenções (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/intervencoes"
        element={
          <RotaProtegida>
            <Intervencoes />
          </RotaProtegida>
        }
      />

      {/* Área administrativa (nível 3): todas as telas ficam sob /admin */}
      {/* O AdminLayout mantém o menu fixo e mostra cada tela no <Outlet /> */}
      <Route
        path="/admin"
        element={
          <RotaProtegida niveis={[3]}>
            <AdminLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<PainelRede />} />
        <Route path="alertas" element={<AlertasRede />} />
        <Route path="usuarios" element={<UsuariosRede />} />

        {/* Próximas telas: escolas, escolas/:escolaId, alunos/:alunoId, usuarios, contas */}
      </Route>

      {/* Endereços não reconhecidos retornam para o login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}