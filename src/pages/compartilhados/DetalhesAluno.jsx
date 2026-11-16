// Importa o hook que permite ler parâmetros da URL.
// Exemplo de URL: /alunos/123
import { useParams } from 'react-router-dom';
import { useApiResource } from '../../services/useApiResource';

export default function DetalhesAluno() {
  // Recupera o identificador do aluno informado na URL.
  const { id } = useParams();
  const { data: aluno, loading, error } = useApiResource(`/students/${id}`, 'aluno', null);
  const { data: frequencia } = useApiResource(`/students/${id}/attendance`, 'frequencia');
  const { data: notas } = useApiResource(`/students/${id}/grades`, 'notas');
  const { data: alertas } = useApiResource(`/alerts?studentId=${encodeURIComponent(id)}`, 'alertas');
  const faltas = frequencia.filter((registro) => registro.status === 'absent');
  const presencas = frequencia.filter((registro) => registro.status === 'present');
  const percentualFrequencia = frequencia.length ? Math.round((presencas.length / frequencia.length) * 100) : null;
  const mediaNotas = notas.length ? (notas.reduce((total, nota) => total + Number(nota.value), 0) / notas.length).toFixed(1) : '—';
  const nivelRisco = alertas[0]?.risk_level;

  /*
   * Como ainda não estamos utilizando a API,
   * os campos abaixo apresentam valores provisórios.
   * Não devemos inventar informações reais de alunos.
   */

  return (
    <main className="container-fluid p-3 p-md-4">
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p className="text-secondary">Carregando dados do aluno...</p>}
      {/* Cabeçalho da página e caminho de navegação */}
      <header className="mb-4">
        <p className="text-secondary mb-2">
          Alunos / Detalhes do aluno
        </p>

        <div className="d-flex flex-column flex-md-row
                        justify-content-between align-items-md-center gap-3">
          <div>
            <h1 className="h2 fw-bold mb-1">
              Detalhes do aluno
            </h1>

            <p className="text-secondary mb-0">
              Consulte informações de frequência e acompanhamento escolar.
            </p>
          </div>

          {/* Retorna para a página anterior do navegador */}
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => window.history.back()}
          >
            Voltar
          </button>
        </div>
      </header>

      {/* Identificação principal do aluno */}
      <section className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            {/* Espaço reservado para o avatar ou foto do aluno */}
            <div className="col-auto">
              <div
                className="rounded-circle d-flex align-items-center
                           justify-content-center bg-primary text-white fw-bold"
                style={{ width: '72px', height: '72px', fontSize: '1.5rem' }}
                aria-label="Foto do aluno não disponível"
              >
                {aluno?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            </div>

            {/* Informações básicas: serão preenchidas pela API futuramente */}
            <div className="col">
              <h2 className="h4 fw-bold mb-2">
                {aluno?.name || 'Aluno não encontrado'}
              </h2>

              <p className="text-secondary mb-1">
                Matrícula: {aluno?.enrollment || 'Não informada'}
              </p>

              <p className="text-secondary mb-0">
                Escola: {aluno?.school_name || '—'} · Turma: {aluno?.class_names || '—'}
              </p>
            </div>

            {/* Situação atual do cadastro */}
            <div className="col-12 col-lg-auto">
              <span className={`badge ${nivelRisco === 'high' ? 'text-bg-danger' : nivelRisco === 'medium' ? 'text-bg-warning' : nivelRisco === 'low' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {({ high: 'Risco alto', medium: 'Risco médio', low: 'Risco baixo' })[nivelRisco] || 'Sem alerta'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Indicadores resumidos da frequência escolar */}
      <section className="mb-4" aria-labelledby="indicadores-titulo">
        <h2 id="indicadores-titulo" className="h4 fw-bold mb-3">
          Resumo da frequência
        </h2>

        <div className="row g-3">
          {/* Percentual de frequência */}
          <div className="col-12 col-sm-6 col-xl-3">
            <article className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-secondary mb-2">
                  Frequência
                </p>

                <p className="h3 fw-bold mb-2">{percentualFrequencia == null ? '—' : `${percentualFrequencia}%`}</p>

                <p className="small text-secondary mb-0">
                  {frequencia.length ? `${presencas.length} presenças registradas` : 'Ainda sem chamada registrada'}
                </p>
              </div>
            </article>
          </div>

          {/* Quantidade total de faltas */}
          <div className="col-12 col-sm-6 col-xl-3">
            <article className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-secondary mb-2">
                  Total de faltas
                </p>

                <p className="h3 fw-bold mb-2">{faltas.length}</p>

                <p className="small text-secondary mb-0">
                  {frequencia.length ? `Em ${frequencia.length} registros de chamada` : 'Ainda sem chamada registrada'}
                </p>
              </div>
            </article>
          </div>

          {/* Quantidade de faltas consecutivas */}
          <div className="col-12 col-sm-6 col-xl-3">
            <article className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-secondary mb-2">
                  Faltas consecutivas
                </p>

                <p className="h3 fw-bold mb-2">{mediaNotas}</p>

                <p className="small text-secondary mb-0">
                  {notas.length ? `${notas.length} notas registradas` : 'Ainda sem notas lançadas'}
                </p>
              </div>
            </article>
          </div>

          {/* Resultado do indicador de risco */}
          <div className="col-12 col-sm-6 col-xl-3">
            <article className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-secondary mb-2">
                  Indicador de risco
                </p>

                <p className="h3 fw-bold mb-2">{nivelRisco ? ({ high: 'Alto', medium: 'Médio', low: 'Baixo' })[nivelRisco] : '—'}</p>

                <p className="small text-secondary mb-0">
                  Aguardando resultado do modelo
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Histórico de frequência */}
      <section className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">
            Histórico de frequência
          </h2>

          <p className="text-secondary">
            Presenças e faltas registradas pelos professores.
          </p>

          {/* Tabela preparada para receber registros futuramente */}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Observação</th>
                </tr>
              </thead>

              <tbody>{frequencia.length === 0 ? <tr><td colSpan="3" className="text-center text-secondary py-4">Sem dados disponíveis para exibição.</td></tr> : frequencia.map((registro, index) => <tr key={`${registro.lesson_date}-${index}`}><td>{new Date(`${registro.lesson_date}T00:00:00`).toLocaleDateString('pt-BR')}</td><td>{({ present: 'Presente', absent: 'Ausente', excused: 'Justificada' })[registro.status]}</td><td>{registro.note || registro.class_name}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Alertas relacionados à frequência do aluno */}
      <section className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">
            Alertas de frequência
          </h2>

          {alertas.length === 0 ? <div className="alert alert-light border mb-0" role="status">Não há alertas disponíveis para exibição neste momento.</div> : <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Data</th><th>Origem</th><th>Nível</th><th>Status</th><th>Descrição</th></tr></thead><tbody>{alertas.map((alerta) => <tr key={alerta.id}><td>{new Date(alerta.created_at).toLocaleDateString('pt-BR')}</td><td>{alerta.source === 'ml' ? `Modelo ${alerta.model_version || 'ML'}` : 'Manual'}</td><td>{({ high: 'Alto', medium: 'Médio', low: 'Baixo' })[alerta.risk_level]}</td><td>{({ new: 'Novo', in_progress: 'Em andamento', overdue: 'Em atraso', resolved: 'Concluído' })[alerta.status]}</td><td>{alerta.summary}</td></tr>)}</tbody></table></div>}
        </div>
      </section>

      {/* Área reservada para o acompanhamento realizado pela equipe escolar */}
      <section className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">
            Acompanhamento escolar
          </h2>

          <p className="text-secondary mb-0">
            {alertas.some((alerta) => alerta.intervention_description) ? alertas.filter((alerta) => alerta.intervention_description).map((alerta) => `${alerta.intervention_kind}: ${alerta.intervention_description}`).join(' · ') : 'Ainda não há intervenções registradas para este aluno.'}
          </p>
        </div>
      </section>
    </main>
  );
}
