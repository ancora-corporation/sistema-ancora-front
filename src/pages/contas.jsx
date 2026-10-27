
import React from "react";

// Dados fictícios para demonstrar o visual da tela.
// Serão substituídos pelos dados da API quando ela estiver disponível.
const assistentesSociais = [
  {
    id: "EXEMPLO-001",
    nome: "Assistente social 1",
    alertasRespondidos: null,
    intervencoesRealizadas: null,
  },
  {
    id: "EXEMPLO-002",
    nome: "Assistente social 2",
    alertasRespondidos: null,
    intervencoesRealizadas: null,
  },
  {
    id: "EXEMPLO-003",
    nome: "Assistente social 3",
    alertasRespondidos: null,
    intervencoesRealizadas: null,
  },
  {
    id: "EXEMPLO-004",
    nome: "Assistente social 4",
    alertasRespondidos: null,
    intervencoesRealizadas: null,
  },
];

function Contas() {
  return (
    <div className="container py-4">
      {/* Cabeçalho da página */}
      <div className="mb-4">
        <h1 className="fw-bold mb-2">Contas</h1>
        <p className="text-secondary mb-0">
          Consulte os perfis dos profissionais da assistência social.
        </p>
      </div>

      {/* Painel principal com rolagem vertical interna */}
      <section
        className="bg-white rounded-4 shadow-sm p-3 p-md-4"
        style={{
          height: "590px",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
        aria-label="Lista de assistentes sociais"
      >
        <h2 className="h5 fw-bold mb-4">Assistentes sociais</h2>

        <div className="d-flex flex-column gap-4">
          {assistentesSociais.map((assistente) => (
            <article
              key={assistente.id}
              className="border rounded-4 p-3 p-md-4"
              style={{ backgroundColor: "#F8FAFC" }}
            >
              {/* Identificação do profissional */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: "#D3E3FA",
                    color: "#0B2A5B",
                    fontSize: "1.4rem",
                    fontWeight: "bold",
                  }}
                  aria-hidden="true"
                >
                  {assistente.nome.charAt(0)}
                </div>

                <div>
                  <h3 className="h5 fw-bold mb-1">
                    {assistente.nome}
                  </h3>
                  <p className="text-secondary mb-1">
                    ID: {assistente.id}
                  </p>
                  <span className="small text-secondary">
                    Assistente social
                  </span>
                </div>
              </div>

              {/* Indicadores de atividades do profissional */}
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div
                    className="rounded-3 p-3 h-100"
                    style={{ backgroundColor: "#EFF6FF" }}
                  >
                    <p className="text-secondary mb-2">
                      Alertas respondidos
                    </p>
                    <p
                      className="fs-3 fw-bold mb-0"
                      style={{ color: "#0B2A5B" }}
                    >
                      {assistente.alertasRespondidos ?? "Sem dados"}
                    </p>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div
                    className="rounded-3 p-3 h-100"
                    style={{ backgroundColor: "#EFF6FF" }}
                  >
                    <p className="text-secondary mb-2">
                      Intervenções realizadas
                    </p>
                    <p
                      className="fs-3 fw-bold mb-0"
                      style={{ color: "#0B2A5B" }}
                    >
                      {assistente.intervencoesRealizadas ?? "Sem dados"}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Aviso sobre a natureza dos dados apresentados */}
        <p className="text-secondary small mt-4 mb-0">
          Protótipo visual: os perfis são exemplos fictícios e os indicadores
          aguardam integração com a API.
        </p>
      </section>
    </div>
  );
}

export default Contas;
