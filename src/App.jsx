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
import EscolasRede from './pages/admin/EscolasRede';
import ContasRede from './pages/admin/ContasRede';
import PainelProfessor from './pages/professor/PainelProfessor';

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
          <RotaProtegida niveis={[1, 2]}>
            <Dashboard />
          </RotaProtegida>
        }
      />

      {/* Listagem de alunos */}
      <Route
        path="/alunos"
        element={
          <RotaProtegida niveis={[1, 2]}>
            <Alunos />
          </RotaProtegida>
        }
      />

      {/* Detalhes de um aluno */}
      <Route
        path="/alunos/:id"
        element={
          <RotaProtegida niveis={[1, 2]}>
            <DetalhesAluno />
          </RotaProtegida>
        }
      />

      {/* Painel da escola */}
      <Route
        path="/painel-escola"
        element={
          <RotaProtegida niveis={[2]}>
            <PainelEscola />
          </RotaProtegida>
        }
      />

      {/* Tela Alunos (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/buscar-alunos"
        element={
          <RotaProtegida niveis={[1]}>
            <BuscarAlunos />
          </RotaProtegida>
        }
      />

      {/* Painel Alunos (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/painel-alunos"
        element={
          <RotaProtegida niveis={[1]}>
            <PainelAlunos />
          </RotaProtegida>
        }
      />

      {/* Acompanhamento de ocorrências */}
      <Route
        path="/ocorrencias"
        element={
          <RotaProtegida niveis={[2]}>
            <Ocorrencias />
          </RotaProtegida>
        }
      />

      {/* Gerenciamento de contas */}
      <Route
        path="/contas"
        element={
          <RotaProtegida niveis={[2]}>
            <Contas />
          </RotaProtegida>
        }
      />

      {/* Intervenções (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/intervencoes"
        element={
          <RotaProtegida niveis={[1]}>
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
        <Route path="escolas" element={<EscolasRede />} />
        <Route path="escolas/:escolaId" element={<EscolasRede />} />
        <Route path="usuarios" element={<UsuariosRede />} />
        <Route path="contas" element={<ContasRede />} />
      </Route>

      <Route path="/professor" element={<RotaProtegida niveis={[4]}><PainelProfessor /></RotaProtegida>} />

      {/* Endereços não reconhecidos retornam para o login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
