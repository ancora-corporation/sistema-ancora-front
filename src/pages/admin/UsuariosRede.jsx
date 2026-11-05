import { Link, useSearchParams } from 'react-router-dom';
import { usuariosExemplo } from '../../data/usuariosExemplo';

const NIVEIS_ACESSO = {
  1: { rotulo: 'Nível 1 - Assistência social', classe: 'text-bg-info' },
  2: { rotulo: 'Nível 2 - Direção', classe: 'text-bg-primary' },
  3: { rotulo: 'Nível 3 - Administrador', classe: 'text-bg-dark' },
};

// Opções do filtro de escola, tiradas dos próprios dados (sem repetir e sem vazios)
const escolas = [
  ...new Set(usuariosExemplo.map((u) => u.escola).filter(Boolean)),
];

// Ignora maiúsculas e acentos: "usuario" encontra "Usuário"
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function UsuariosRede() {
  // Os filtros ficam na URL (ex.: /admin/usuarios?escola=...)
  const [params, setParams] = useSearchParams();

  const filtros = {
    nome: params.get('nome') || '',
    matricula: params.get('matricula') || '',
    escola: params.get('escola') || '',
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

  const visiveis = usuariosExemplo.filter(
    (u) =>
      (!filtros.nome ||
        normalizar(u.nome).includes(normalizar(filtros.nome.trim()))) &&
      (!filtros.matricula ||
        normalizar(u.matricula).includes(normalizar(filtros.matricula.trim()))) &&
      (!filtros.escola || u.escola === filtros.escola)
  );

  return (
    <>
      <div className="mb-4">
        <h1 className="h2 mb-1">Usuários</h1>
        <p className="text-body-secondary mb-0">
          Perfis das pessoas com acesso ao sistema.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label htmlFor="f-nome" className="form-label small mb-1">Nome</label>
              <input
                id="f-nome"
                type="text"
                className="form-control"
                placeholder="Buscar por nome"
                value={filtros.nome}
                onChange={(e) => alterarFiltro('nome', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-3">
              <label htmlFor="f-matricula" className="form-label small mb-1">Matrícula</label>
              <input
                id="f-matricula"
                type="text"
                className="form-control"
                placeholder="Ex.: F-0002"
                value={filtros.matricula}
                onChange={(e) => alterarFiltro('matricula', e.target.value)}
              />
            </div>

            <div className="col-12 col-md-5">
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
        Mostrando {visiveis.length} de {usuariosExemplo.length} usuários
      </p>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Matrícula</th>
                <th scope="col">Contato</th>
                <th scope="col">Escola vinculada</th>
                <th scope="col">Nível de acesso</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-body-secondary py-4">
                    Nenhum usuário encontrado com esses filtros.
                  </td>
                </tr>
              )}

              {visiveis.map((u) => (
                <tr key={u.id}>
                  <td className="fw-bold">{u.nome}</td>
                  <td>{u.matricula}</td>
                  <td>
                    <div>
                      <a href={`mailto:${u.email}`}>{u.email}</a>
                    </div>
                    <div className="small text-body-secondary">{u.telefone}</div>
                  </td>
                  <td>
                    {u.escola ? (
                      // TODO: esta rota ainda não existe; vira o Perfil da Escola
                      <Link to={`/admin/escolas/${u.escolaId}`}>{u.escola}</Link>
                    ) : (
                      <span className="text-body-secondary">Toda a rede</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${NIVEIS_ACESSO[u.nivel].classe}`}>
                      {NIVEIS_ACESSO[u.nivel].rotulo}
                    </span>
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