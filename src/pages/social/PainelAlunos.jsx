import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import iconeAncora from '../../assets/icone-sistema.png';

/*
 * Arquivo: painelalunos.jsx
 * Projeto: Sistema Âncora
 *
 * Objetivo:
 * Painel inicial do nível de acesso 1 (Assistência Social), com os
 * indicadores dos alunos, o aviso de ocorrências não respondidas e os
 * alertas mais recentes.
 */

export default function PainelAlunos() {
  const navigate = useNavigate();

  // Dados fictícios para visualizar a tela durante o protótipo.
  // Serão substituídos pelos dados reais quando houver integração com a API.
  const dados = {
    alunosComAlerta: 12,
    intervencoesRealizadas: 8,
    alertasEmAtraso: 3,
    ocorrenciasNaoRespondidas: 3,
  };

  const alertasRecentes = [
    { id: 1, nome: 'Aluno Exemplo A', turma: '1º ano A', tipo: 'Frequência', situacao: 'Não respondida' },
    { id: 2, nome: 'Aluno Exemplo B', turma: '2º ano B', tipo: 'Notas', situacao: 'Em andamento' },
    { id: 3, nome: 'Aluno Exemplo C', turma: '3º ano A', tipo: 'Frequência', situacao: 'Não respondida' },
    { id: 4, nome: 'Aluno Exemplo D', turma: '1º ano B', tipo: 'Notas', situacao: 'Respondida' },
  ];

  const indicadores = [
    {
      titulo: 'Alunos com alerta',
      descricao: 'Alunos com algum alerta ativo.',
      valor: dados.alunosComAlerta,
      cor: 'warning',
    },
    {
      titulo: 'Intervenções realizadas',
      descricao: 'Ações de acompanhamento já realizadas.',
      valor: dados.intervencoesRealizadas,
      cor: 'primary',
    },
    {
      titulo: 'Alertas em atraso',
      descricao: 'Alertas pendentes fora do prazo.',
      valor: dados.alertasEmAtraso,
      cor: 'danger',
    },
  ];

  const temOcorrencias = dados.ocorrenciasNaoRespondidas > 0;

  function sair() {
    Auth.sair();
    navigate('/login');
  }

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
          <Link to="/alunos" className="btn btn-primary rounded-pill px-4 fw-bold">
            Alunos
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
        <h1 className="fw-bold mb-0">Painel Alunos</h1>
        <span className="badge text-bg-secondary">Dados de exemplo</span>
      </div>

      {/* Aviso de ocorrências não respondidas, com atalho para Intervenções */}
      <section
        className={`card border-0 shadow-sm mb-4 ${
          temOcorrencias ? 'border-start border-4 border-danger' : ''
        }`}
      >
        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="h5 fw-bold mb-2">
              {temOcorrencias ? 'Atenção: há ocorrências sem resposta' : 'Intervenções'}
            </h2>
            <p className="text-secondary mb-0">
              {temOcorrencias
                ? `${dados.ocorrenciasNaoRespondidas} ocorrência(s) aguardando resposta da Assistência Social.`
                : 'Nenhuma ocorrência pendente no momento.'}
            </p>
          </div>

          <Link
            to="/intervencoes"
            className={`btn rounded-pill px-4 fw-bold ${
              temOcorrencias ? 'btn-danger' : 'btn-primary'
            }`}
          >
            Ver intervenções
          </Link>
        </div>
      </section>

      {/* Cartões com os indicadores */}
      <section className="row g-3 mb-4">
        {indicadores.map((indicador) => (
          <div className="col-12 col-md-6 col-xl-4" key={indicador.titulo}>
            <article
              className={`card h-100 border-0 border-start border-4 border-${indicador.cor} shadow-sm`}
            >
              <div className="card-body p-4">
                <h2 className="fs-6 fw-bold mb-1">{indicador.titulo}</h2>
                <p className="text-secondary small mb-3">{indicador.descricao}</p>
                <p className="display-5 fw-bold mb-0">{indicador.valor}</p>
              </div>
            </article>
          </div>
        ))}
      </section>

      {/* Alertas mais recentes */}
      <section className="card border-0 shadow-sm">
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 fw-bold mb-3">Alertas recentes</h2>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Aluno</th>
                  <th scope="col">Turma</th>
                  <th scope="col">Tipo de alerta</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alertasRecentes.map((alerta) => (
                  <tr key={alerta.id}>
                    <td>{alerta.nome}</td>
                    <td>{alerta.turma}</td>
                    <td>
                      <span
                        className={`badge ${
                          alerta.tipo === 'Frequência'
                            ? 'text-bg-danger'
                            : 'text-bg-warning'
                        }`}
                      >
                        {alerta.tipo}
                      </span>
                    </td>
                    <td>{alerta.situacao}</td>
                    <td>
                      <Link
                        to={`/alunos/${alerta.id}`}
                        className="btn btn-sm btn-outline-primary rounded-pill"
                      >
                        Ver aluno
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}