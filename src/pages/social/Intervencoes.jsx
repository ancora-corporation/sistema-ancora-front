import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import iconeAncora from '../../assets/icone-sistema.png';

/*
 * Arquivo: IntervencoesS.jsx
 * Projeto: Sistema Âncora
 *
 * Objetivo:
 * Tela Ocorrências (Intervenções) do nível de acesso 1 (Assistência Social):
 * lista as ocorrências com contagem regressiva do prazo e, ao clicar em uma,
 * abre o formulário de intervenção que será atrelado ao relatório do aluno.
 */

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function dataEmDias(dias) {
  return new Date(Date.now() + dias * MS_POR_DIA);
}

function dataParaInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// Quantos dias faltam até o prazo (negativo quando já passou).
function diasRestantes(prazo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(prazo);
  fim.setHours(0, 0, 0, 0);
  return Math.round((fim - hoje) / MS_POR_DIA);
}

function situacaoDoPrazo(ocorrencia) {
  if (ocorrencia.status === 'Encerrada') {
    return { texto: 'Encerrada', classe: 'text-bg-secondary' };
  }

  const dias = diasRestantes(ocorrencia.prazo);

  if (dias < 0) return { texto: `Atrasada há ${-dias} dia(s)`, classe: 'text-bg-danger' };
  if (dias === 0) return { texto: 'Vence hoje', classe: 'text-bg-danger' };
  if (dias <= 2) return { texto: `${dias} dia(s) restante(s)`, classe: 'text-bg-warning' };
  return { texto: `${dias} dias restantes`, classe: 'text-bg-primary' };
}

// Dados fictícios para visualizar a tela durante o protótipo.
// Serão substituídos pelos dados reais quando houver integração com a API.
const ocorrenciasIniciais = [
  {
    id: 1,
    alunoId: 1,
    aluno: 'Aluno Exemplo A',
    turma: '1º ano A',
    tipo: 'Frequência',
    descricao: 'Faltas consecutivas na última semana.',
    prazo: dataEmDias(5),
    status: 'Pendente',
    relatorio: null,
  },
  {
    id: 2,
    alunoId: 2,
    aluno: 'Aluno Exemplo B',
    turma: '2º ano B',
    tipo: 'Notas',
    descricao: 'Queda de rendimento nas avaliações do bimestre.',
    prazo: dataEmDias(2),
    status: 'Pendente',
    relatorio: null,
  },
  {
    id: 3,
    alunoId: 3,
    aluno: 'Aluno Exemplo C',
    turma: '3º ano A',
    tipo: 'Frequência',
    descricao: 'Ausência sem justificativa por mais de 5 dias.',
    prazo: dataEmDias(-1),
    status: 'Pendente',
    relatorio: null,
  },
  {
    id: 4,
    alunoId: 4,
    aluno: 'Aluno Exemplo D',
    turma: '1º ano B',
    tipo: 'Notas',
    descricao: 'Notas abaixo da média em duas disciplinas.',
    prazo: dataEmDias(10),
    status: 'Pendente',
    relatorio: null,
  },
  {
    id: 5,
    alunoId: 5,
    aluno: 'Aluno Exemplo E',
    turma: '2º ano A',
    tipo: 'Frequência',
    descricao: 'Aluno deixou de comparecer às aulas.',
    prazo: dataEmDias(-3),
    status: 'Encerrada',
    relatorio: {
      acao: 'Contato com a família',
      data: dataParaInput(dataEmDias(-4)),
      relato: 'Exemplo de relatório de uma intervenção já encerrada.',
    },
  },
];

const acoes = [
  'Contato com a família',
  'Visita domiciliar',
  'Atendimento ao aluno',
  'Encaminhamento a outro serviço',
  'Outra',
];

const abas = ['Pendentes', 'Encerradas', 'Todas'];

function formularioVazio() {
  return { acao: '', data: dataParaInput(new Date()), relato: '' };
}

export default function Intervencoes() {
  const navigate = useNavigate();

  const [ocorrencias, setOcorrencias] = useState(ocorrenciasIniciais);
  const [aba, setAba] = useState('Pendentes');
  const [selecionadaId, setSelecionadaId] = useState(null);
  const [formulario, setFormulario] = useState(formularioVazio());
  const [validado, setValidado] = useState(false);

  const selecionada = ocorrencias.find((o) => o.id === selecionadaId) ?? null;
  const encerradaSelecionada = selecionada?.status === 'Encerrada';

  const pendentes = ocorrencias.filter((o) => o.status === 'Pendente');
  const atrasadas = pendentes.filter((o) => diasRestantes(o.prazo) < 0);
  const encerradas = ocorrencias.filter((o) => o.status === 'Encerrada');

  const lista = ocorrencias
    .filter((o) => {
      if (aba === 'Pendentes') return o.status === 'Pendente';
      if (aba === 'Encerradas') return o.status === 'Encerrada';
      return true;
    })
    .sort((a, b) => a.prazo - b.prazo);

  function sair() {
    Auth.sair();
    navigate('/login');
  }

  function abrirOcorrencia(ocorrencia) {
    setSelecionadaId(ocorrencia.id);
    setFormulario(ocorrencia.relatorio ?? formularioVazio());
    setValidado(false);
  }

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  // Guarda o relatório na ocorrência. Com a API, ele será atrelado ao perfil do aluno.
  function salvarRelatorio(evento) {
    evento.preventDefault();

    if (!evento.currentTarget.checkValidity()) {
      setValidado(true);
      return;
    }

    setOcorrencias((atuais) =>
      atuais.map((o) =>
        o.id === selecionadaId ? { ...o, relatorio: { ...formulario } } : o
      )
    );
    setValidado(false);
  }

  // Só pode encerrar depois que o formulário foi preenchido e salvo.
  function encerrarIntervencao() {
    if (!selecionada?.relatorio) return;

    setOcorrencias((atuais) =>
      atuais.map((o) =>
        o.id === selecionadaId ? { ...o, status: 'Encerrada' } : o
      )
    );
    setSelecionadaId(null);
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
        <h1 className="fw-bold mb-0">Ocorrências</h1>
        <span className="badge text-bg-secondary">Dados de exemplo</span>
      </div>

      {/* Resumo */}
      <section className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <article className="card h-100 border-0 border-start border-4 border-primary shadow-sm">
            <div className="card-body p-3">
              <h2 className="fs-6 fw-bold mb-1">Pendentes</h2>
              <p className="display-6 fw-bold mb-0">{pendentes.length}</p>
            </div>
          </article>
        </div>
        <div className="col-12 col-md-4">
          <article className="card h-100 border-0 border-start border-4 border-danger shadow-sm">
            <div className="card-body p-3">
              <h2 className="fs-6 fw-bold mb-1">Atrasadas</h2>
              <p className="display-6 fw-bold mb-0">{atrasadas.length}</p>
            </div>
          </article>
        </div>
        <div className="col-12 col-md-4">
          <article className="card h-100 border-0 border-start border-4 border-secondary shadow-sm">
            <div className="card-body p-3">
              <h2 className="fs-6 fw-bold mb-1">Encerradas</h2>
              <p className="display-6 fw-bold mb-0">{encerradas.length}</p>
            </div>
          </article>
        </div>
      </section>

      {/* Lista de ocorrências */}
      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
            <h2 className="h5 fw-bold mb-0">Lista de ocorrências</h2>

            <div className="d-flex gap-2 flex-wrap">
              {abas.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 ${
                    aba === nome ? 'btn-primary' : 'btn-outline-primary'
                  }`}
                  onClick={() => setAba(nome)}
                >
                  {nome}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col">Aluno</th>
                  <th scope="col">Turma</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Ocorrência</th>
                  <th scope="col">Prazo para responder</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-secondary py-4">
                      Nenhuma ocorrência nesta lista.
                    </td>
                  </tr>
                ) : (
                  lista.map((ocorrencia) => {
                    const prazo = situacaoDoPrazo(ocorrencia);

                    return (
                      <tr
                        key={ocorrencia.id}
                        className={ocorrencia.id === selecionadaId ? 'table-active' : ''}
                      >
                        <td>{ocorrencia.aluno}</td>
                        <td>{ocorrencia.turma}</td>
                        <td>
                          <span
                            className={`badge ${
                              ocorrencia.tipo === 'Frequência'
                                ? 'text-bg-danger'
                                : 'text-bg-warning'
                            }`}
                          >
                            {ocorrencia.tipo}
                          </span>
                        </td>
                        <td>{ocorrencia.descricao}</td>
                        <td>
                          <span className={`badge ${prazo.classe}`}>{prazo.texto}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill"
                            onClick={() => abrirOcorrencia(ocorrencia)}
                          >
                            {ocorrencia.status === 'Encerrada' ? 'Ver relatório' : 'Responder'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Formulário da ocorrência selecionada */}
      {selecionada && (
        <section className="card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
              <div>
                <h2 className="h5 fw-bold mb-1">
                  Intervenção: {selecionada.aluno}
                </h2>
                <p className="text-secondary mb-0">{selecionada.descricao}</p>
              </div>

              <div className="d-flex gap-2 align-items-center">
                <span className="badge text-bg-secondary">
                  Formulário provisório
                </span>
                <Link
                  to={`/alunos/${selecionada.alunoId}`}
                  className="btn btn-sm btn-outline-primary rounded-pill"
                >
                  Ver perfil do aluno
                </Link>
              </div>
            </div>

            <form
              onSubmit={salvarRelatorio}
              noValidate
              className={validado ? 'was-validated' : ''}
            >
              <fieldset disabled={encerradaSelecionada}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="acao" className="form-label fw-semibold">
                      Ação realizada
                    </label>
                    <select
                      id="acao"
                      className="form-select rounded-pill"
                      value={formulario.acao}
                      onChange={(e) => atualizarCampo('acao', e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {acoes.map((acao) => (
                        <option key={acao} value={acao}>
                          {acao}
                        </option>
                      ))}
                    </select>
                    <div className="invalid-feedback">Escolha a ação realizada.</div>
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="data" className="form-label fw-semibold">
                      Data da intervenção
                    </label>
                    <input
                      id="data"
                      type="date"
                      className="form-control rounded-pill"
                      value={formulario.data}
                      onChange={(e) => atualizarCampo('data', e.target.value)}
                      required
                    />
                    <div className="invalid-feedback">Informe a data.</div>
                  </div>

                  <div className="col-12">
                    <label htmlFor="relato" className="form-label fw-semibold">
                      Relato
                    </label>
                    <textarea
                      id="relato"
                      className="form-control"
                      rows={4}
                      value={formulario.relato}
                      onChange={(e) => atualizarCampo('relato', e.target.value)}
                      required
                    />
                    <div className="invalid-feedback">Descreva o que foi feito.</div>
                  </div>
                </div>
              </fieldset>

              {!encerradaSelecionada && (
                <div className="d-flex flex-wrap gap-2 mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-bold"
                  >
                    Salvar relatório
                  </button>

                  {/* Só aparece depois que o formulário foi preenchido e salvo */}
                  {selecionada.relatorio && (
                    <button
                      type="button"
                      className="btn btn-success rounded-pill px-4 fw-bold"
                      onClick={encerrarIntervencao}
                    >
                      Intervenção encerrada
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill px-4"
                    onClick={() => setSelecionadaId(null)}
                  >
                    Fechar
                  </button>
                </div>
              )}

              {encerradaSelecionada && (
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4 mt-4"
                  onClick={() => setSelecionadaId(null)}
                >
                  Fechar
                </button>
              )}
            </form>
          </div>
        </section>
      )}
    </main>
  );
}