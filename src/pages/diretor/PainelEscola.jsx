
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import { useApiResource } from '../../services/useApiResource';

export default function PainelEscola() {
  const navigate = useNavigate();
  const usuario = Auth.usuarioAtual();
  const { data: alunos, error: erroAlunos } = useApiResource('/students', 'alunos');
  const { data: alertas, error: erroAlertas } = useApiResource('/alerts', 'alertas');
  const { data: intervencoes, error: erroIntervencoes } = useApiResource('/interventions', 'intervencoes');
  const metricas = {
    alertasAResponder: alertas.filter((alerta) => ['new', 'in_progress'].includes(alerta.status)).length,
    alertasEmAtraso: alertas.filter((alerta) => alerta.status === 'overdue').length,
    intervencoes: intervencoes.length,
    alunos: alunos.length,
  };

  function sair() {
    Auth.sair();
    navigate('/login');
  }

  // Indicadores da escola.
  // Os dados serão preenchidos futuramente pela API.
  const indicadores = [
    {
      titulo: 'Alertas a responder',
      descricao: 'Alertas que precisam de atenção.',
      cor: 'primary',
    },
    {
      titulo: 'Alertas em atraso',
      descricao: 'Alertas pendentes fora do prazo.',
      cor: 'danger',
    },
    {
      titulo: 'Intervenções feitas',
      descricao: 'Ações de acompanhamento realizadas.',
      cor: 'primary',
    },
    {
      titulo: 'Quantidade de alunos',
      descricao: 'Total de alunos da escola.',
      cor: 'primary',
    },
  ];

  return (
    <main className="container-fluid py-4 px-3 px-md-4">
      <header className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <span className="small text-primary fw-bold text-uppercase">Área da direção</span>
          <div className="text-secondary small">{usuario?.nome} · {usuario?.escola}</div>
        </div>
        <nav className="d-flex flex-wrap align-items-center gap-2" aria-label="Navegação da direção">
          <Link to="/alunos" className="btn btn-outline-primary btn-sm">Alunos</Link>
          <Link to="/ocorrencias" className="btn btn-outline-primary btn-sm">Ocorrências</Link>
          <Link to="/contas" className="btn btn-outline-primary btn-sm">Contas</Link>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={sair}>Sair</button>
        </nav>
      </header>
      {(erroAlunos || erroAlertas || erroIntervencoes) && <div className="alert alert-danger">{erroAlunos || erroAlertas || erroIntervencoes}</div>}
      {/* Cabeçalho da página */}
      <header className="mb-4">
        <h1 className="fw-bold mb-2">
          Painel da Escola
        </h1>

        <p className="text-secondary mb-0">
          Acompanhe os indicadores e o desempenho geral da escola.
        </p>
      </header>

      {/* Cartões com os indicadores */}
      <section className="row g-3 mb-4">
        {indicadores.map((indicador) => (
          <div
            className="col-12 col-sm-6 col-xl-3"
            key={indicador.titulo}
          >
            <article
              className={`card h-100 border-0 border-start border-4 border-${indicador.cor} shadow-sm`}
            >
              <div className="card-body p-4">
                <h2 className="fs-6 fw-bold mb-3">
                  {indicador.titulo}
                </h2>

                <p className="text-secondary small mb-3">
                  {indicador.descricao}
                </p>

                <p className="fw-semibold mb-0">{({ 'Alertas a responder': metricas.alertasAResponder, 'Alertas em atraso': metricas.alertasEmAtraso, 'Intervenções feitas': metricas.intervencoes, 'Quantidade de alunos': metricas.alunos })[indicador.titulo]}</p>
              </div>
            </article>
          </div>
        ))}
      </section>

      {/* Área de desempenho geral */}
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 fw-bold mb-3">
            Desempenho geral da escola
          </h2>

          <p className="text-secondary mb-0">
            Sem dados disponíveis para apresentar o desempenho
            geral da escola.
          </p>
        </div>
      </section>

      {/* Área de geração do relatório */}
      <section className="card border-0 shadow-sm">
        <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h2 className="h5 fw-bold mb-2">
              Relatório da escola
            </h2>

            <p className="text-secondary mb-0">
              Gere um relatório com os indicadores da escola.
            </p>
          </div>

          {/* O botão ficará desabilitado até definirmos a geração do relatório */}
          <button
            type="button"
            className="btn btn-primary"
            disabled
          >
            Gerar relatório
          </button>
        </div>
      </section>
    </main>
  );
}
