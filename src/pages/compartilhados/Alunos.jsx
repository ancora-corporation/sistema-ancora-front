
import { useState } from "react";

function Alunos() {
  // Dados fictícios para visualizar a tabela durante o protótipo.
  // Eles deverão ser substituídos pelos dados reais quando houver integração.
  const alunosExemplo = [
    {
      id: 1,
      nome: "Aluno Exemplo A",
      matricula: "EXEMPLO-001",
      ano: "1º ano",
      turma: "A",
      turno: "Manhã",
      alerta: "Não definido",
    },
    {
      id: 2,
      nome: "Aluno Exemplo B",
      matricula: "EXEMPLO-002",
      ano: "2º ano",
      turma: "B",
      turno: "Tarde",
      alerta: "Não definido",
    },
    {
      id: 3,
      nome: "Aluno Exemplo C",
      matricula: "EXEMPLO-003",
      ano: "3º ano",
      turma: "A",
      turno: "Manhã",
      alerta: "Não definido",
    },
    {
      id: 4,
      nome: "Aluno Exemplo D",
      matricula: "EXEMPLO-004",
      ano: "1º ano",
      turma: "B",
      turno: "Noite",
      alerta: "Não definido",
    },
    {
      id: 5,
      nome: "Aluno Exemplo E",
      matricula: "EXEMPLO-005",
      ano: "2º ano",
      turma: "A",
      turno: "Manhã",
      alerta: "Não definido",
    },
  ];

  // Estados que guardam os valores digitados e selecionados.
  const [pesquisa, setPesquisa] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [turnoSelecionado, setTurnoSelecionado] = useState("");
  const [alertaSelecionado, setAlertaSelecionado] = useState("");

  // Filtra a lista de acordo com a pesquisa e os filtros escolhidos.
  const alunosFiltrados = alunosExemplo.filter((aluno) => {
    const termo = pesquisa.toLowerCase().trim();

    const correspondePesquisa =
      aluno.nome.toLowerCase().includes(termo) ||
      aluno.matricula.toLowerCase().includes(termo);

    const correspondeAno =
      anoSelecionado === "" || aluno.ano === anoSelecionado;

    const correspondeTurma =
      turmaSelecionada === "" || aluno.turma === turmaSelecionada;

    const correspondeTurno =
      turnoSelecionado === "" || aluno.turno === turnoSelecionado;

    const correspondeAlerta =
      alertaSelecionado === "" || aluno.alerta === alertaSelecionado;

    return (
      correspondePesquisa &&
      correspondeAno &&
      correspondeTurma &&
      correspondeTurno &&
      correspondeAlerta
    );
  });

  // Limpa a pesquisa e todos os filtros.
  function limparFiltros() {
    setPesquisa("");
    setAnoSelecionado("");
    setTurmaSelecionada("");
    setTurnoSelecionado("");
    setAlertaSelecionado("");
  }

  return (
    <main className="container py-4">
      {/* Cabeçalho da página */}
      <header className="mb-4">
        <h1 className="fw-bold mb-2">Alunos</h1>
        <p className="text-secondary mb-0">
          Consulte e localize os alunos da escola.
        </p>
      </header>

      {/* Área de pesquisa */}
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <label htmlFor="pesquisa-aluno" className="form-label fw-semibold">
            Pesquisar aluno
          </label>

          <input
            id="pesquisa-aluno"
            type="search"
            className="form-control"
            placeholder="Digite o nome ou a matrícula..."
            value={pesquisa}
            onChange={(evento) => setPesquisa(evento.target.value)}
          />

          {/* Filtros da listagem */}
          <div className="row g-3 mt-1">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filtro-ano" className="form-label">
                Ano escolar
              </label>
              <select
                id="filtro-ano"
                className="form-select"
                value={anoSelecionado}
                onChange={(evento) => setAnoSelecionado(evento.target.value)}
              >
                <option value="">Todos os anos</option>
                <option value="1º ano">1º ano</option>
                <option value="2º ano">2º ano</option>
                <option value="3º ano">3º ano</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filtro-turno" className="form-label">
                Turno
              </label>
              <select
                id="filtro-turno"
                className="form-select"
                value={turnoSelecionado}
                onChange={(evento) => setTurnoSelecionado(evento.target.value)}
              >
                <option value="">Todos os turnos</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filtro-turma" className="form-label">
                Turma
              </label>
              <select
                id="filtro-turma"
                className="form-select"
                value={turmaSelecionada}
                onChange={(evento) => setTurmaSelecionada(evento.target.value)}
              >
                <option value="">Todas as turmas</option>
                <option value="A">Turma A</option>
                <option value="B">Turma B</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="filtro-alerta" className="form-label">
                Nível de alerta
              </label>
              <select
                id="filtro-alerta"
                className="form-select"
                value={alertaSelecionado}
                onChange={(evento) => setAlertaSelecionado(evento.target.value)}
              >
                <option value="">Todos os níveis</option>
                <option value="Não definido">Não definido</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={limparFiltros}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </section>

      {/* Tabela com os resultados da pesquisa */}
      <section className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h2 className="h5 fw-bold mb-0">Lista de alunos</h2>

            <span className="text-secondary small">
              {alunosFiltrados.length} resultado(s)
            </span>
          </div>

          {/* A tabela permite rolagem horizontal em telas pequenas. */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Matrícula</th>
                  <th scope="col">Ano</th>
                  <th scope="col">Turma</th>
                  <th scope="col">Turno</th>
                  <th scope="col">Nível de alerta</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>

              <tbody>
                {alunosFiltrados.length > 0 ? (
                  alunosFiltrados.map((aluno) => (
                    <tr key={aluno.id}>
                      <td>{aluno.nome}</td>
                      <td>{aluno.matricula}</td>
                      <td>{aluno.ano}</td>
                      <td>{aluno.turma}</td>
                      <td>{aluno.turno}</td>
                      <td>{aluno.alerta}</td>
                      <td>
                        {/* A navegação será conectada após verificarmos as rotas. */}
                        
            <button
             type="button"
             className="btn btn-sm btn-outline-primary"
             onClick={() => {
             window.location.href = `/alunos/${aluno.id}`;
             }}
            >
            Detalhes
            </button>

                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-secondary">
                      Nenhum aluno encontrado com os critérios informados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-secondary small mt-3 mb-0">
            Protótipo: os registros acima são fictícios e não representam
            alunos reais da escola.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Alunos;
