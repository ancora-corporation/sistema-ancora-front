import { useMemo, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useApiResource } from '../../services/useApiResource';

const PERFIL = { social: 'Assistência social', director: 'Direção', admin: 'Administrador', teacher: 'Professor' };

export default function Contas() {
  const [consulta, setConsulta] = useState('');
  const { data: usuarios, loading, error, refresh } = useApiResource('/users', 'usuarios');
  const { data: escolas } = useApiResource('/schools', 'escolas');
  const [acaoErro, setAcaoErro] = useState('');
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', role: 'teacher', escolaId: '' });
  const visiveis = useMemo(() => usuarios.filter((usuario) => `${usuario.name} ${usuario.email} ${usuario.school_name || ''}`.toLocaleLowerCase('pt-BR').includes(consulta.toLocaleLowerCase('pt-BR'))), [consulta, usuarios]);

  async function alternarConta(id) {
    try {
      await apiRequest(`/users/${id}/status`, { method: 'PATCH' });
      setAcaoErro('');
      await refresh();
    } catch (requestError) { setAcaoErro(requestError.message); }
  }

  async function criarConta(event) {
    event.preventDefault();
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify({ ...novoUsuario, escolaId: novoUsuario.escolaId }) });
      setNovoUsuario({ nome: '', email: '', senha: '', role: 'teacher', escolaId: '' });
      setAcaoErro('');
      await refresh();
    } catch (requestError) { setAcaoErro(requestError.message); }
  }

  return <>
    <header className="mb-4"><h1 className="h2 fw-bold mb-1">Contas e acessos</h1><p className="text-secondary mb-0">Consulte os profissionais cadastrados e gerencie o acesso no servidor.</p></header>
    {error && <div className="alert alert-danger">{error}</div>}{acaoErro && <div className="alert alert-danger">{acaoErro}</div>}
    <details className="card border-0 shadow-sm mb-3"><summary className="card-header bg-white fw-semibold py-3">Criar acesso de direção, assistência social ou professor</summary><form className="card-body" onSubmit={criarConta}><div className="row g-3"><div className="col-12 col-md-6"><label className="form-label" htmlFor="novo-nome">Nome</label><input id="novo-nome" className="form-control" value={novoUsuario.nome} onChange={(event) => setNovoUsuario({ ...novoUsuario, nome: event.target.value })} minLength={2} maxLength={120} required /></div><div className="col-12 col-md-6"><label className="form-label" htmlFor="novo-email">E-mail</label><input id="novo-email" type="email" className="form-control" value={novoUsuario.email} onChange={(event) => setNovoUsuario({ ...novoUsuario, email: event.target.value })} required /></div><div className="col-12 col-md-4"><label className="form-label" htmlFor="nova-senha">Senha inicial</label><input id="nova-senha" type="password" className="form-control" value={novoUsuario.senha} onChange={(event) => setNovoUsuario({ ...novoUsuario, senha: event.target.value })} minLength={10} autoComplete="new-password" required /><div className="form-text">Mínimo de 10 caracteres.</div></div><div className="col-12 col-md-4"><label className="form-label" htmlFor="novo-perfil">Perfil</label><select id="novo-perfil" className="form-select" value={novoUsuario.role} onChange={(event) => setNovoUsuario({ ...novoUsuario, role: event.target.value })}><option value="teacher">Professor</option><option value="social">Assistência social</option><option value="director">Direção</option></select></div><div className="col-12 col-md-4"><label className="form-label" htmlFor="nova-escola">Escola</label><select id="nova-escola" className="form-select" value={novoUsuario.escolaId} onChange={(event) => setNovoUsuario({ ...novoUsuario, escolaId: event.target.value })} required><option value="">Selecione a escola</option>{escolas.map((escola) => <option key={escola.id} value={escola.id}>{escola.name}</option>)}</select></div><div className="col-12 text-end"><button className="btn btn-primary" type="submit"><i className="bi bi-person-plus me-2" />Criar conta</button></div></div></form></details>
    <div className="card border-0 shadow-sm mb-3"><div className="card-body d-flex flex-wrap align-items-end gap-3"><div className="flex-grow-1"><label htmlFor="busca-conta" className="form-label fw-semibold">Buscar profissional</label><input id="busca-conta" className="form-control" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Nome, e-mail ou escola" /></div><div className="small text-secondary">{usuarios.length} contas · {usuarios.filter((usuario) => usuario.is_active).length} ativas</div></div></div>
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Profissional</th><th>Perfil</th><th>Escola</th><th>Status</th><th className="text-end">Ação</th></tr></thead><tbody>{loading && <tr><td colSpan={5} className="text-center py-4 text-secondary">Carregando contas...</td></tr>}{!loading && visiveis.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-secondary">Nenhuma conta encontrada.</td></tr>}{visiveis.map((usuario) => <tr key={usuario.id}><td><div className="fw-semibold">{usuario.name}</div><a className="small" href={`mailto:${usuario.email}`}>{usuario.email}</a></td><td><span className="badge text-bg-light border">{PERFIL[usuario.role]}</span></td><td>{usuario.school_name || 'Toda a rede'}</td><td><span className={`badge ${usuario.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{usuario.is_active ? 'Ativa' : 'Inativa'}</span></td><td className="text-end"><button className={`btn btn-sm ${usuario.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => alternarConta(usuario.id)}>{usuario.is_active ? 'Desativar' : 'Reativar'}</button></td></tr>)}</tbody></table></div></div>
  </>;
}
