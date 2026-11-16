import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import { useApiResource } from '../../services/useApiResource';
import iconeAncora from '../../assets/icone-sistema.png';

/*
 * Arquivo: buscaralunos.jsx
 * Projeto: Sistema Âncora
 *
 * Objetivo:
 * Tela Alunos do nível de acesso 1 (Assistência Social): lista de alunos
 * com barra de pesquisa, filtros e link para o perfil de cada aluno.
 */

const TURNO = { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' };
const NIVEL = { high: 'Alto', medium: 'Médio', low: 'Baixo' };
const niveisAlerta = ['Alto', 'Médio', 'Baixo', 'Não definido'];

const corDoAlerta = {
  Alto: 'text-bg-danger',
  Médio: 'text-bg-warning',
  Baixo: 'text-bg-success',
  'Não definido': 'text-bg-secondary',
};

// Ignora maiúsculas e acentos para a pesquisa ficar mais simples de usar.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const filtrosVazios = {
  nome: '',
  matricula: '',
  turma: '',
  turno: '',
  alerta: '',
};

export default function BuscarAlunos() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState(filtrosVazios);
  const { data: registros, loading, error } = useApiResource('/students', 'alunos');
  const alunosExemplo = useMemo(() => registros.map((aluno) => ({
    id: aluno.id,
    nome: aluno.name,
    matricula: aluno.enrollment,
    turma: aluno.class_names,
    turno: (aluno.shifts || '').split(', ').map((turno) => TURNO[turno] || turno).join(', '),
    alerta: NIVEL[aluno.latest_risk_level] || 'Não definido',
  })), [registros]);
  const turmas = useMemo(() => [...new Set(alunosExemplo.map((aluno) => aluno.turma))], [alunosExemplo]);
  const turnos = useMemo(() => [...new Set(alunosExemplo.map((aluno) => aluno.turno))], [alunosExemplo]);

  function atualizarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  function sair() {
    Auth.sair();
    navigate('/login');
  }

  const alunosFiltrados = alunosExemplo.filter(
    (aluno) =>
      normalizar(aluno.nome).includes(normalizar(filtros.nome)) &&
      normalizar(aluno.matricula).includes(normalizar(filtros.matricula)) &&
      (filtros.turma === '' || aluno.turma === filtros.turma) &&
      (filtros.turno === '' || aluno.turno === filtros.turno) &&
      (filtros.alerta === '' || aluno.alerta === filtros.alerta)
  );

  return (
    <main className="container-fluid py-4 px-3 px-md-4">
      {/* Cabeçalho com a identidade do sistema */}
      <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <img src={iconeAncora} alt="" width={64} height={64} />
          <div>
            <div className="logo-sistema">SISTEMA</div>
            <div className="logo-ancora">ÂNCORA</div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/painel-alunos"
            className="btn btn-primary rounded-pill px-4 fw-bold"
          >
            Painel Alunos
          </Link>
          <button
            type="button"
            className="btn btn-outline-primary rounded-pill px-4"
            onClick={sair}
          >
            Sair
          </button>
        </div>
      </header>

      <div className="d-flex align-items-center gap-2 mb-4">
        <h1 className="fw-bold mb-0">Alunos</h1>
        <span className="badge text-bg-secondary">Dados de exemplo</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Barra de pesquisa e filtros */}
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 fw-bold mb-3">Buscar aluno</h2>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="filtro-nome" className="form-label fw-semibold">
                Nome
              </label>
              <input
                id="filtro-nome"
                type="search"
                className="form-control rounded-pill"
                placeholder="Digite o nome do aluno..."
                value={filtros.nome}
                onChange={(e) => atualizarFiltro('nome', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="filtro-matricula" className="form-label fw-semibold">
                Matrícula
              </label>
              <input
                id="filtro-matricula"
                type="search"
                className="form-control rounded-pill"
                placeholder="Digite a matrícula..."
                value={filtros.matricula}
                onChange={(e) => atualizarFiltro('matricula', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="filtro-turma" className="form-label fw-semibold">
                Turma
              </label>
              <select
                id="filtro-turma"
                className="form-select rounded-pill"
                value={filtros.turma}
                onChange={(e) => atualizarFiltro('turma', e.target.value)}
              >
                <option value="">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma} value={turma}>
                    {turma}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="filtro-turno" className="form-label fw-semibold">
                Turno
              </label>
              <select
                id="filtro-turno"
                className="form-select rounded-pill"
                value={filtros.turno}
                onChange={(e) => atualizarFiltro('turno', e.target.value)}
              >
                <option value="">Todos os turnos</option>
                {turnos.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label htmlFor="filtro-alerta" className="form-label fw-semibold">
                Nível de alerta
              </label>
              <select
                id="filtro-alerta"
                className="form-select rounded-pill"
                value={filtros.alerta}
                onChange={(e) => atualizarFiltro('alerta', e.target.value)}
              >
                <option value="">Todos os níveis</option>
                {niveisAlerta.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-primary rounded-pill px-4 mt-3"
            onClick={() => setFiltros(filtrosVazios)}
          >
            Limpar filtros
          </button>
        </div>
      </section>

      {/* Tabela de resultados */}
      <section className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 fw-bold mb-3">
            {loading ? 'Carregando alunos...' : `Resultados (${alunosFiltrados.length})`}
          </h2>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Matrícula</th>
                  <th scope="col">Turma</th>
                  <th scope="col">Turno</th>
                  <th scope="col">Nível de alerta</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-4">
                      Nenhum aluno encontrado com os filtros escolhidos.
                    </td>
                  </tr>
                ) : (
                  alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      <td>{aluno.matricula}</td>
                      <td>{aluno.turma}</td>
                      <td>{aluno.turno}</td>
                      <td>
                        <span className={`badge ${corDoAlerta[aluno.alerta]}`}>
                          {aluno.alerta}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/alunos/${aluno.id}`}
                          className="btn btn-sm btn-outline-primary rounded-pill"
                        >
                          Ver perfil
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
