import { useMemo, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useApiResource } from '../../services/useApiResource';

const PERFIL = { social: 'Assistência social', director: 'Direção', admin: 'Administrador', teacher: 'Professor' };
const formularioVazio = { nome: '', email: '', senha: '', role: 'teacher', escolaId: '', lotacoes: [{ turmaId: '', disciplina: '' }] };

export default function Contas() {
  const [consulta, setConsulta] = useState('');
  const { data: usuarios, loading, error, refresh } = useApiResource('/users', 'usuarios');
  const { data: escolas } = useApiResource('/schools', 'escolas');
  const { data: turmas, loading: carregandoTurmas, error: erroTurmas } = useApiResource('/classes', 'turmas');
  const [acaoErro, setAcaoErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [criacaoAberta, setCriacaoAberta] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState(formularioVazio);
  const visiveis = useMemo(() => usuarios.filter((usuario) => `${usuario.name} ${usuario.email} ${usuario.school_name || ''}`.toLocaleLowerCase('pt-BR').includes(consulta.toLocaleLowerCase('pt-BR'))), [consulta, usuarios]);
  const turmasDaEscola = turmas.filter((turma) => turma.school_id === novoUsuario.escolaId);

  async function alternarConta(id) {
    try {
      await apiRequest(`/users/${id}/status`, { method: 'PATCH' });
      setAcaoErro('');
      setMensagem('');
      await refresh();
    } catch (requestError) { setAcaoErro(requestError.message); }
  }

  async function criarConta(event) {
    event.preventDefault();
    setAcaoErro('');
    setMensagem('');
    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ ...novoUsuario, escolaId: novoUsuario.escolaId || undefined, lotacoes: novoUsuario.role === 'teacher' ? novoUsuario.lotacoes : [] }),
      });
      setNovoUsuario(formularioVazio);
      setCriacaoAberta(false);
      setMensagem('Conta criada com sucesso.');
      await refresh();
    } catch (requestError) { setAcaoErro(requestError.message); }
  }

  return <>
    <header className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 className="h2 fw-bold mb-1">Contas e acessos</h1>
        <p className="text-secondary mb-0">Consulte os profissionais cadastrados e gerencie o acesso no servidor.</p>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        aria-expanded={criacaoAberta}
        onClick={() => { setCriacaoAberta((aberta) => !aberta); setAcaoErro(''); }}
      >
        <i className={`bi ${criacaoAberta ? 'bi-x-lg' : 'bi-person-plus'} me-2`} aria-hidden="true" />
        {criacaoAberta ? 'Cancelar' : 'Criar conta'}
      </button>
    </header>

    {error && <div className="alert alert-danger">{error}</div>}
    {acaoErro && <div className="alert alert-danger" role="alert">{acaoErro}</div>}
    {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}

    {criacaoAberta && (
      <section className="card border-0 shadow-sm mb-3" aria-labelledby="titulo-nova-conta">
        <form className="card-body" onSubmit={criarConta}>
          <h2 id="titulo-nova-conta" className="h5 fw-bold mb-3">Criar uma conta</h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="novo-nome">Nome</label>
              <input id="novo-nome" className="form-control" value={novoUsuario.nome} onChange={(event) => setNovoUsuario({ ...novoUsuario, nome: event.target.value })} minLength={2} maxLength={120} required />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="novo-email">E-mail</label>
              <input id="novo-email" type="email" className="form-control" value={novoUsuario.email} onChange={(event) => setNovoUsuario({ ...novoUsuario, email: event.target.value })} required />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="nova-senha">Senha inicial</label>
              <input id="nova-senha" type="password" className="form-control" value={novoUsuario.senha} onChange={(event) => setNovoUsuario({ ...novoUsuario, senha: event.target.value })} minLength={10} autoComplete="new-password" required />
              <div className="form-text">Mínimo de 10 caracteres.</div>
            </div>
            <div className={`col-12 ${novoUsuario.role === 'admin' ? 'col-md-8' : 'col-md-4'}`}>
              <label className="form-label" htmlFor="novo-perfil">Perfil</label>
              <select
                id="novo-perfil"
                className="form-select"
                value={novoUsuario.role}
                onChange={(event) => setNovoUsuario({ ...novoUsuario, role: event.target.value, escolaId: '', lotacoes: [{ turmaId: '', disciplina: '' }] })}
              >
                <option value="teacher">Professor</option>
                <option value="social">Assistência social</option>
                <option value="director">Direção</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {novoUsuario.role !== 'admin' && (
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="nova-escola">Escola</label>
                <select id="nova-escola" className="form-select" value={novoUsuario.escolaId} onChange={(event) => setNovoUsuario({ ...novoUsuario, escolaId: event.target.value, lotacoes: [{ turmaId: '', disciplina: '' }] })} required>
                  <option value="">Selecione a escola</option>
                  {escolas.map((escola) => <option key={escola.id} value={escola.id}>{escola.name}</option>)}
                </select>
              </div>
            )}
            {novoUsuario.role === 'teacher' && <div className="col-12">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                <div><div className="form-label fw-semibold mb-0">Matérias e turmas do professor</div><div className="form-text">Cada linha associa uma matéria a uma turma. Adicione linhas para outros vínculos.</div></div>
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setNovoUsuario({ ...novoUsuario, lotacoes: [...novoUsuario.lotacoes, { turmaId: '', disciplina: '' }] })}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Adicionar matéria e turma</button>
              </div>
              {erroTurmas && <div className="alert alert-danger py-2" role="alert">{erroTurmas}</div>}
              {!carregandoTurmas && novoUsuario.escolaId && !turmasDaEscola.length && <div className="alert alert-warning py-2">Cadastre uma turma para esta escola antes de cadastrar o professor.</div>}
              <div className="d-grid gap-2">{novoUsuario.lotacoes.map((lotacao, indice) => <div className="row g-2 align-items-end" key={`vinculo-professor-${indice}`}>
                <div className="col-12 col-md-6"><label className="form-label" htmlFor={`turma-professor-${indice}`}>Turma</label><select id={`turma-professor-${indice}`} className="form-select" value={lotacao.turmaId} onChange={(event) => setNovoUsuario({ ...novoUsuario, lotacoes: novoUsuario.lotacoes.map((item, i) => i === indice ? { ...item, turmaId: event.target.value } : item) })} required disabled={carregandoTurmas || !turmasDaEscola.length}><option value="">Selecione a turma</option>{turmasDaEscola.map((turma) => <option key={turma.id} value={turma.id}>{turma.name} · {turma.grade_level} · {turma.academic_year}</option>)}</select></div>
                <div className="col-12 col-md-5"><label className="form-label" htmlFor={`materia-professor-${indice}`}>Matéria</label><input id={`materia-professor-${indice}`} className="form-control" value={lotacao.disciplina} onChange={(event) => setNovoUsuario({ ...novoUsuario, lotacoes: novoUsuario.lotacoes.map((item, i) => i === indice ? { ...item, disciplina: event.target.value } : item) })} placeholder="Ex.: Matemática" maxLength={100} required /></div>
                <div className="col-12 col-md-1 d-grid"><button type="button" className="btn btn-outline-danger" aria-label="Remover matéria e turma" disabled={novoUsuario.lotacoes.length === 1} onClick={() => setNovoUsuario({ ...novoUsuario, lotacoes: novoUsuario.lotacoes.filter((_, i) => i !== indice) })}><i className="bi bi-trash" aria-hidden="true" /></button></div>
              </div>)}</div>
            </div>}
            {novoUsuario.role === 'admin' && <p className="col-12 col-md-4 small text-secondary mb-0 align-self-end">A conta de administrador terá acesso à rede inteira e não precisa ser vinculada a uma escola.</p>}
            <div className="col-12 text-end">
              <button className="btn btn-primary" type="submit"><i className="bi bi-person-plus me-2" aria-hidden="true" />Criar conta</button>
            </div>
          </div>
        </form>
      </section>
    )}

    <div className="card border-0 shadow-sm mb-3">
      <div className="card-body d-flex flex-wrap align-items-end gap-3">
        <div className="flex-grow-1">
          <label htmlFor="busca-conta" className="form-label fw-semibold">Buscar profissional</label>
          <input id="busca-conta" className="form-control" value={consulta} onChange={(event) => setConsulta(event.target.value)} placeholder="Nome, e-mail ou escola" />
        </div>
        <div className="small text-secondary">{usuarios.length} contas · {usuarios.filter((usuario) => usuario.is_active).length} ativas</div>
      </div>
    </div>

    <div className="card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th>Profissional</th><th>Perfil</th><th>Escola</th><th>Status</th><th className="text-end">Ação</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center py-4 text-secondary">Carregando contas...</td></tr>}
            {!loading && visiveis.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-secondary">Nenhuma conta encontrada.</td></tr>}
            {visiveis.map((usuario) => (
              <tr key={usuario.id}>
                <td><div className="fw-semibold">{usuario.name}</div><a className="small" href={`mailto:${usuario.email}`}>{usuario.email}</a></td>
                <td><span className="badge text-bg-light border">{PERFIL[usuario.role]}</span></td>
                <td>{usuario.school_name || 'Toda a rede'}</td>
                <td><span className={`badge ${usuario.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{usuario.is_active ? 'Ativa' : 'Inativa'}</span></td>
                <td className="text-end"><button className={`btn btn-sm ${usuario.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => alternarConta(usuario.id)}>{usuario.is_active ? 'Desativar' : 'Reativar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}
