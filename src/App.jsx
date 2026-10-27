
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
import PainelAlunos from './pages/painelalunos';

// Importa o componente responsável por proteger as rotas.
import RotaProtegida from './components/RotaProtegida';

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

            {/* Painel Alunos (nível de acesso 1 - Assistência Social) */}
      <Route
        path="/painel-alunos"
        element={
          <RotaProtegida>
            <PainelAlunos />
          </RotaProtegida>
        }
      />

      {/* Endereços não reconhecidos retornam para o login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
