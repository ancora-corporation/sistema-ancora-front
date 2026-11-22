// Importa o hook que permite ler parâmetros da URL.
// Exemplo de URL: /alunos/123
import { useParams } from 'react-router-dom';
import { useApiResource } from '../../services/useApiResource';

const HISTORICO_VAZIO = { notas: [], frequencia_por_turma: [], resumo: {} };

export default function DetalhesAluno() {
  // Recupera o identificador do aluno informado na URL.
  const { id } = useParams();
  const { data: aluno, loading, error } = useApiResource(`/students/${id}`, 'aluno', null);
  const { data: frequencia } = useApiResource(`/students/${id}/attendance`, 'frequencia');
  const { data: historico, error: erroHistorico } = useApiResource(`/students/${id}/historico-academico`, 'historico', HISTORICO_VAZIO);
  const notas = historico.notas;
  const resumo = historico.resumo;
  const { data: alertas } = useApiResource(`/alerts?studentId=${encodeURIComponent(id)}`, 'alertas');
  const percentualFrequencia = resumo.percentual == null ? null : Math.round(Number(resumo.percentual));
  const mediaNotas = resumo.media_geral == null ? '—' : Number(resumo.media_geral).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const nivelRisco = alertas[0]?.risk_level;

  /*
   * Como ainda não estamos utilizando a API,
   * os campos abaixo apresentam valores provisórios.
   * Não devemos inventar informações reais de alunos.
   */

  return (
    <main className="container-fluid p-3 p-md-4">
      {error && <div className="alert alert-danger">{error}</div>}
      {erroHistorico && <div className="alert alert-danger">Não foi possível carregar o histórico acadêmico: {erroHistorico}</div>}
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
          Resumo escolar
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
                  {resumo.aulas_registradas ? `${resumo.presentes} de ${resumo.aulas_registradas} aulas com presença` : 'Ainda sem chamada registrada'}
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

                <p className="h3 fw-bold mb-2">{resumo.faltas ?? 0}</p>

                <p className="small text-secondary mb-0">
                  {resumo.faltas_justificadas ? `${resumo.faltas_justificadas} faltas justificadas` : (resumo.aulas_registradas ? `Em ${resumo.aulas_registradas} aulas registradas` : 'Ainda sem chamada registrada')}
                </p>
              </div>
            </article>
          </div>

          {/* Média dos períodos concluídos */}
          <div className="col-12 col-sm-6 col-xl-3">
            <article className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-secondary mb-2">
                  Média geral
                </p>

                <p className="h3 fw-bold mb-2">{mediaNotas}</p>

                <p className="small text-secondary mb-0">
                  Média simples de {resumo.medias_finais_concluidas || 0} matéria(s)/período(s) concluído(s)
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

      <section className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">Histórico acadêmico</h2>
          <p className="text-secondary">Notas por turma, matéria e período. A média final aparece quando as quatro avaliações forem lançadas.</p>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Turma / ano</th><th>Matéria</th><th>Período</th><th>Avaliação 1</th><th>Avaliação 2</th><th>Avaliação 3</th><th>Avaliação 4</th><th>Média</th></tr></thead>
              <tbody>
                {notas.length === 0 ? <tr><td colSpan="8" className="text-center text-secondary py-4">Ainda não há avaliações lançadas.</td></tr> : notas.map((nota) => {
                  const valores = Object.fromEntries(nota.assessments.map(({ assessment, value }) => [assessment, Number(value)]));
                  const media = nota.final_average == null ? '—' : Number(nota.final_average).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
                  return <tr key={`${nota.class_id}-${nota.subject}-${nota.period}`}>
                    <td>{nota.class_name} · {nota.academic_year}</td><td>{nota.subject}</td><td>{nota.period}</td>
                    {[1, 2, 3, 4].map((numero) => <td key={numero}>{valores[`Avaliação ${numero}`]?.toLocaleString('pt-BR') ?? '—'}</td>)}
                    <td><strong>{media}</strong><div className="small text-secondary">{nota.final_average == null ? `Parcial · ${nota.assessment_count}/4` : 'Média final'}</div></td>
                  </tr>;
                })}
              </tbody>
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
