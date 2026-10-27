/*
 * Arquivo: App.jsx
 * Projeto: Sistema Âncora
 *
 * Objetivo:
 * Centralizar as rotas de navegação da aplicação.
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// Importa as páginas existentes do sistema.
import Login from './pages/Login';
import Dashboard from './pages/dashboard';
import DetalhesAluno from './pages/detalhesaluno';
import PainelEscola from './pages/painelescola';
import Alunos from './pages/alunos';
import PainelRede from './pages/admin/PainelRede';

// Importa o componente responsável por proteger as rotas.
import RotaProtegida from './components/RotaProtegida';

// Importa o layout (menu superior) da área do administrador.
import AdminLayout from './components/AdminLayout';

export default function App() {
  return (
    <Routes>
      {/* Página de acesso ao sistema */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard: exige que o usuário passe pela proteção existente */}
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

      {/* Página de detalhes de um aluno */}
      {/* Exemplo de endereço: /alunos/123 */}
      <Route
        path="/alunos/:id"
        element={
          <RotaProtegida>
            <DetalhesAluno />
          </RotaProtegida>
        }
      />

      {/* Painel geral da escola */}
      <Route
        path="/painel-escola"
        element={
          <RotaProtegida>
            <PainelEscola />
          </RotaProtegida>
        }
      />

      {/* Área do administrador (nível 3): todas as telas ficam sob /admin */}
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
        {/* Próximas telas: alertas, escolas, escolas/:escolaId, alunos/:alunoId, usuarios, contas */}
      </Route>

      {/* Endereços não reconhecidos retornam para o login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}