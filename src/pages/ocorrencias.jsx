
import { useState } from 'react';

export default function Ocorrencias() {
  // Dados ilustrativos para desenvolver a interface.
  // Futuramente, as ocorrências serão carregadas pela API.
  const ocorrencias = [
    {
      id: 1,
      titulo: 'Ocorrência de exemplo 01',
      descricao: 'Alerta relacionado à frequência escolar.',
      status: 'Em andamento',
    },
    {
      id: 2,
      titulo: 'Ocorrência de exemplo 02',
      descricao: 'Alerta pendente de acompanhamento.',
      status: 'Em atraso',
    },
    {
      id: 3,
      titulo: 'Ocorrência de exemplo 03',
      descricao: 'Acompanhamento finalizado.',
      status: 'Concluída',
    },
  ];

  // Controla a abertura do formulário e a ocorrência selecionada.
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] =
    useState(null);

  // Guarda os dados digitados no formulário.
  const [formulario, setFormulario] = useState({
    data: '',
    providencia: '',
    descricao: '',
    proximaProvidencia: '',
    prazo: '',
    resultado: '',
  });

  // Atualiza o campo que o usuário estiver preenchendo.
  function atualizarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((dadosAnteriores) => ({
      ...dadosAnteriores,
      [name]: value,
    }));
  }

  // Abre o formulário para a ocorrência selecionada.
  function abrirFormulario(ocorrencia) {
    setOcorrenciaSelecionada(ocorrencia);

    setFormulario({
      data: '',
      providencia: '',
      descricao: '',
      proximaProvidencia: '',
      prazo: '',
      resultado: '',
    });
  }

  // Trata o envio demonstrativo do formulário.
  function salvarAcompanhamento(evento) {
    evento.preventDefault();

    alert(
      'Registro demonstrativo preenchido. ' +
      'Os dados ainda não são enviados para uma API.'
    );

    setOcorrenciaSelecionada(null);
  }

  // Conta quantas ocorrências existem em cada situação.
  const quantidadeEmAndamento = ocorrencias.filter(
    (ocorrencia) => ocorrencia.status === 'Em andamento'
  ).length;

  const quantidadeEmAtraso = ocorrencias.filter(
    (ocorrencia) => ocorrencia.status === 'Em atraso'
  ).length;

  const quantidadeConcluidas = ocorrencias.filter(
    (ocorrencia) => ocorrencia.status === 'Concluída'
  ).length;

  // Define a cor visual de cada status.
  function obterCorStatus(status) {
    if (status === 'Em atraso') return 'danger';
    if (status === 'Concluída') return 'success';

    return 'primary';
  }

  // Estilo de borda usado nos cartões.
  const estiloCartao = {
    border: '1px solid #9AAFCB',
    borderRadius: '10px',
  };

  // Estilo das bordas dos campos do formulário.
  const estiloCampo = {
    borderColor: '#8FA6C3',
  };

  return (
    <main className="container-fluid py-4 px-3 px-md-4">
      {/* Cabeçalho da página */}
      <header className="mb-4">
        <h1 className="fw-bold mb-2">Ocorrências</h1>

        <p className="text-secondary mb-0">
          Acompanhe as ocorrências geradas a partir dos alertas escolares.
        </p>
      </header>

      {/* Indicadores de situação das ocorrências */}
      <section className="row g-3 mb-4">
        {[
          {
            titulo: 'Em andamento',
            quantidade: quantidadeEmAndamento,
            cor: 'primary',
          },
          {
            titulo: 'Em atraso',
            quantidade: quantidadeEmAtraso,
            cor: 'danger',
          },
          {
            titulo: 'Concluídas',
            quantidade: quantidadeConcluidas,
            cor: 'success',
          },
        ].map((indicador) => (
          <div
            className="col-12 col-sm-6 col-xl-4"
            key={indicador.titulo}
          >
            <article
              className={`card h-100 border-start border-4 border-${indicador.cor} shadow-sm`}
              style={estiloCartao}
            >
              <div className="card-body p-4">
                <h2 className="fs-6 fw-bold mb-3">
                  {indicador.titulo}
                </h2>

                <p className="fs-3 fw-bold mb-0">
                  {indicador.quantidade}
                </p>

                <p className="text-secondary small mb-0 mt-2">
                  Dados ilustrativos do protótipo
                </p>
              </div>
            </article>
          </div>
        ))}
      </section>

      {/* Listagem das ocorrências */}
      <section
        className="card shadow-sm mb-4"
        style={estiloCartao}
      >
        <div className="card-body p-3 p-md-4">
          <h2 className="h5 fw-bold mb-3">
            Lista de ocorrências
          </h2>

          <p className="text-secondary small">
            Os registros apresentados abaixo são apenas exemplos.
          </p>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th
                    scope="col"
                    style={{ borderColor: '#9AAFCB' }}
                  >
                    Ocorrência
                  </th>
                  <th
                    scope="col"
                    style={{ borderColor: '#9AAFCB' }}
                  >
                    Descrição
                  </th>
                  <th
                    scope="col"
                    style={{ borderColor: '#9AAFCB' }}
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    style={{ borderColor: '#9AAFCB' }}
                  >
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody>
                {ocorrencias.map((ocorrencia) => (
                  <tr key={ocorrencia.id}>
                    <td
                      className="fw-semibold"
                      style={{ borderColor: '#B0C0D5' }}
                    >
                      {ocorrencia.titulo}
                    </td>

                    <td style={{ borderColor: '#B0C0D5' }}>
                      {ocorrencia.descricao}
                    </td>

                    <td style={{ borderColor: '#B0C0D5' }}>
                      <span
                        className={`badge text-bg-${obterCorStatus(ocorrencia.status)}`}
                      >
                        {ocorrencia.status}
                      </span>
                    </td>

                    <td style={{ borderColor: '#B0C0D5' }}>
                      {ocorrencia.status !== 'Concluída' ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => abrirFormulario(ocorrencia)}
                        >
                          Acompanhar
                        </button>
                      ) : (
                        <span className="text-secondary small">
                          Finalizada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Formulário exibido ao selecionar uma ocorrência */}
      {ocorrenciaSelecionada && (
        <section
          className="card shadow-sm"
          id="formulario-acompanhamento"
          style={estiloCartao}
        >
          <div className="card-body p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
              <div>
                <h2 className="h5 fw-bold mb-2">
                  Acompanhar ocorrência
                </h2>

                <p className="text-secondary mb-0">
                  {ocorrenciaSelecionada.titulo}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setOcorrenciaSelecionada(null)}
              >
                Fechar
              </button>
            </div>

            <form onSubmit={salvarAcompanhamento}>
              <div className="row g-3">
                {/* Data do acompanhamento */}
                <div className="col-12 col-md-6">
                  <label htmlFor="data" className="form-label fw-semibold">
                    Data do acompanhamento
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    style={estiloCampo}
                    id="data"
                    name="data"
                    value={formulario.data}
                    onChange={atualizarCampo}
                    required
                  />
                </div>

                {/* Providência realizada */}
                <div className="col-12 col-md-6">
                  <label
                    htmlFor="providencia"
                    className="form-label fw-semibold"
                  >
                    Providência realizada
                  </label>

                  <select
                    className="form-select"
                    style={estiloCampo}
                    id="providencia"
                    name="providencia"
                    value={formulario.providencia}
                    onChange={atualizarCampo}
                    required
                  >
                    <option value="">Selecione uma providência</option>
                    <option value="Contato com a família">
                      Contato com a família
                    </option>
                    <option value="Conversa com a escola">
                      Conversa com a escola
                    </option>
                    <option value="Encaminhamento">
                      Encaminhamento
                    </option>
                    <option value="Outra providência">
                      Outra providência
                    </option>
                  </select>
                </div>

                {/* Descrição do acompanhamento */}
                <div className="col-12">
                  <label
                    htmlFor="descricao"
                    className="form-label fw-semibold"
                  >
                    Descrição do acompanhamento
                  </label>

                  <textarea
                    className="form-control"
                    style={estiloCampo}
                    id="descricao"
                    name="descricao"
                    rows="4"
                    placeholder="Descreva a ação realizada..."
                    value={formulario.descricao}
                    onChange={atualizarCampo}
                    required
                  />
                </div>

                {/* Próxima providência */}
                <div className="col-12">
                  <label
                    htmlFor="proximaProvidencia"
                    className="form-label fw-semibold"
                  >
                    Próxima providência
                  </label>

                  <textarea
                    className="form-control"
                    style={estiloCampo}
                    id="proximaProvidencia"
                    name="proximaProvidencia"
                    rows="2"
                    placeholder="Informe o que ainda precisa ser feito, se necessário."
                    value={formulario.proximaProvidencia}
                    onChange={atualizarCampo}
                  />
                </div>

                {/* Prazo da próxima providência */}
                <div className="col-12 col-md-6">
                  <label htmlFor="prazo" className="form-label fw-semibold">
                    Prazo da próxima providência
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    style={estiloCampo}
                    id="prazo"
                    name="prazo"
                    value={formulario.prazo}
                    onChange={atualizarCampo}
                  />
                </div>

                {/* Resultado do acompanhamento */}
                <div className="col-12">
                  <label
                    htmlFor="resultado"
                    className="form-label fw-semibold"
                  >
                    Resultado do acompanhamento
                  </label>

                  <textarea
                    className="form-control"
                    style={estiloCampo}
                    id="resultado"
                    name="resultado"
                    rows="3"
                    placeholder="Registre o resultado, se já houver."
                    value={formulario.resultado}
                    onChange={atualizarCampo}
                  />
                </div>
              </div>

              {/* Ações do formulário */}
              <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setOcorrenciaSelecionada(null)}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn btn-primary">
                  Registrar acompanhamento
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
