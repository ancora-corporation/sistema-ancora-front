
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
import Contas from './pages/contas';
import Ocorrencias from './pages/ocorrencias';

import RotaProtegida from './components/RotaProtegida';

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
      <Route
        path="/contas"
        element={
          <RotaProtegida>
            <Contas />
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
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}
