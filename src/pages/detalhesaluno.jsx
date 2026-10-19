// Importa o hook que permite ler parâmetros da URL.
// Exemplo de URL: /alunos/123
import { useParams } from 'react-router-dom';

export default function DetalhesAluno() {
  // Recupera o identificador do aluno informado na URL.
  const { id } = useParams();

  /*
   * Como ainda não estamos utilizando a API,
   * os campos abaixo apresentam valores provisórios.
   * Não devemos inventar informações reais de alunos.
   */

  return (
    <main className="container-fluid p-3 p-md-4">
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
                ?
              </div>
            </div>

            {/* Informações básicas: serão preenchidas pela API futuramente */}
            <div className="col">
              <h2 className="h4 fw-bold mb-2">
                Nome não disponível
              </h2>

              <p className="text-secondary mb-1">
                Matrícula: {id || 'Não informada'}
              </p>

              <p className="text-secondary mb-0">
                Turma: Sem dados disponíveis
              </p>
            </div>

            {/* Situação atual do cadastro */}
            <div className="col-12 col-lg-auto">
              <span className="badge text-bg-secondary">
                Aguardando dados
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

                <p className="h3 fw-bold mb-2">—</p>

                <p className="small text-secondary mb-0">
                  Sem dados disponíveis
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

                <p className="h3 fw-bold mb-2">—</p>

                <p className="small text-secondary mb-0">
                  Sem dados disponíveis
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

                <p className="h3 fw-bold mb-2">—</p>

                <p className="small text-secondary mb-0">
                  Sem dados disponíveis
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

                <p className="h3 fw-bold mb-2">—</p>

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
            O histórico de presenças e faltas será exibido aqui
            quando os dados estiverem disponíveis.
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

              <tbody>
                <tr>
                  <td colSpan="3" className="text-center text-secondary py-4">
                    Sem dados disponíveis para exibição.
                  </td>
                </tr>
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

          <div className="alert alert-light border mb-0" role="status">
            Não há alertas disponíveis para exibição neste momento.
          </div>
        </div>
      </section>

      {/* Área reservada para o acompanhamento realizado pela equipe escolar */}
      <section className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">
            Acompanhamento escolar
          </h2>

          <p className="text-secondary mb-0">
            Os registros de acompanhamento, as ações realizadas
            e os próximos encaminhamentos serão apresentados aqui
            quando estiverem disponíveis.
          </p>
        </div>
      </section>
    </main>
  );
}