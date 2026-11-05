import { Link, useSearchParams } from 'react-router-dom';
import { alertasExemplo } from '../../data/alertasExemplo';
import {
  EtiquetaNivel,
  EtiquetaStatus,
  TextoPrazo,
} from '../../components/EtiquetasAlerta';

// Opções dos filtros, tiradas dos próprios dados (sem repetir)
const escolas = [...new Set(alertasExemplo.map((a) => a.escola))];
const bairros = [...new Set(alertasExemplo.map((a) => a.bairro))];

// O "T00:00:00" evita que a data apareça um dia antes por causa do fuso
function formatarData(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
}

// Menor prazo primeiro (em atraso no topo). Concluídos (sem prazo) vão para o fim.
function ordenarPorPrazo(a, b) {
  if (a.prazoDias === null) return b.prazoDias === null ? 0 : 1;
  if (b.prazoDias === null) return -1;
  return a.prazoDias - b.prazoDias;
}

export default function AlertasRede() {
  // Os filtros ficam na URL (ex.: /admin/alertas?status=em_atraso)
  const [params, setParams] = useSearchParams();

  const filtros = {
    escola: params.get('escola') || '',
    bairro: params.get('bairro') || '',
    codigo: params.get('codigo') || '',
    status: params.get('status') || '',
    nivel: params.get('nivel') || '',
  };

  function alterarFiltro(campo, valor) {
    const novos = new URLSearchParams(params);
    if (valor) {
      novos.set(campo, valor);
    } else {
      novos.delete(campo);
    }
    setParams(novos, { replace: true });
  }

  const temFiltro = Object.values(filtros).some(Boolean);

  const visiveis = alertasExemplo
    .filter(
      (a) =>
        (!filtros.escola || a.escola === filtros.escola) &&
        (!filtros.bairro || a.bairro === filtros.bairro) &&
        (!filtros.codigo ||
          a.codigo.toLowerCase().includes(filtros.codigo.trim().toLowerCase())) &&
        (!filtros.status || a.status === filtros.status) &&
        (!filtros.nivel || a.nivel === filtros.nivel)
    )
    .sort(ordenarPorPrazo);

  return (
    <>
      <div className="mb-4">
        <h1 className="h2 mb-1">Alertas da rede</h1>
        <p className="text-body-secondary mb-0">
          Ordenados pelo menor prazo de resposta.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="f-escola" className="form-label small mb-1">Escola</label>
              <select
                id="f-escola"
                className="form-select"
                value={filtros.escola}
                onChange={(e) => alterarFiltro('escola', e.target.value)}
              >
                <option value="">Todas</option>
                {escolas.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label htmlFor="f-bairro" className="form-label small mb-1">Bairro</label>
              <select
                id="f-bairro"
                className="form-select"
                value={filtros.bairro}
                onChange={(e) => alterarFiltro('bairro', e.target.value)}
              >
                <option value="">Todos</option>
                {bairros.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4 col-lg-2">
              <label htmlFor="f-codigo" className="form-label small mb-1">Código</label>
              <input
                id="f-codigo"
                type="text"
                className="form-control"
                placeholder="Ex.: EM-001"
                value={filtros.codigo}
                onChange={(e) => alterarFiltro('codigo', e.target.value)}
              />
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="f-status" className="form-label small mb-1">Status</label>
              <select
                id="f-status"
                className="form-select"
                value={filtros.status}
                onChange={(e) => alterarFiltro('status', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="novo">Novo</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="em_atraso">Em atraso</option>
              </select>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <label htmlFor="f-nivel" className="form-label small mb-1">Nível</label>
              <select
                id="f-nivel"
                className="form-select"
                value={filtros.nivel}
                onChange={(e) => alterarFiltro('nivel', e.target.value)}
              >
                <option value="">Todos</option>
                <option value="alto">Alto</option>
                <option value="medio">Médio</option>
                <option value="baixo">Baixo</option>
              </select>
            </div>
          </div>

          {temFiltro && (
            <button
              type="button"
              className="btn btn-link px-0 mt-3"
              onClick={() => setParams({}, { replace: true })}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <p className="small text-body-secondary">
        Mostrando {visiveis.length} de {alertasExemplo.length} alertas
      </p>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Aluno</th>
                <th scope="col">Escola</th>
                <th scope="col">Data do alerta</th>
                <th scope="col">Nível</th>
                <th scope="col">Status</th>
                <th scope="col">Prazo restante</th>
                <th scope="col">Intervenção preenchida por</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-body-secondary py-4">
                    Nenhum alerta encontrado com esses filtros.
                  </td>
                </tr>
              )}

              {visiveis.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/alunos/${a.alunoId}`}>{a.aluno}</Link>
                  </td>
                  <td>
                    {/* TODO: virar link para o perfil da escola quando a tela existir */}
                    <div>{a.escola}</div>
                    <div className="small text-body-secondary">
                      {a.codigo} · {a.bairro}
                    </div>
                  </td>
                  <td>{formatarData(a.data)}</td>
                  <td><EtiquetaNivel nivel={a.nivel} /></td>
                  <td><EtiquetaStatus status={a.status} /></td>
                  <td><TextoPrazo dias={a.prazoDias} /></td>
                  <td>
                    {a.preenchidoPor || (
                      <span className="text-body-secondary">Ainda não preenchida</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}