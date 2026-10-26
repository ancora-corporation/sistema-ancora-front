
export default function PainelEscola() {
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

                <p className="fw-semibold mb-0">
                  Sem dados disponíveis
                </p>
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
