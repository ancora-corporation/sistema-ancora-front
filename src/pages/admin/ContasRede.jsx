import { useMemo, useState } from 'react';
import { usuariosExemplo } from '../../data/usuariosExemplo';

const CHAVE = 'ancora-contas-inativas';
const PERFIL = { 1: 'Assistência social', 2: 'Direção', 3: 'Administrador', 4: 'Professor' };

export default function Contas() {
  const [consulta, setConsulta] = useState('');
  const [inativas, setInativas] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch { return []; }
  });
  const visiveis = useMemo(() => usuariosExemplo.filter((usuario) => `${usuario.nome} ${usuario.email} ${usuario.escola || ''}`.toLocaleLowerCase('pt-BR').includes(consulta.toLocaleLowerCase('pt-BR'))), [consulta]);

  function alternarConta(id) {
    const atualizadas = inativas.includes(id) ? inativas.filter((item) => item !== id) : [...inativas, id];
    setInativas(atualizadas);
    localStorage.setItem(CHAVE, JSON.stringify(atualizadas));
  }

  return <>
    <header className="mb-4"><h1 className="h2 fw-bold mb-1">Contas e acessos</h1><p className="text-secondary mb-0">Consulte os profissionais cadastrados e ative ou desative acessos demonstrativos.</p></header>
    <div className="card border-0 shadow-sm mb-3"><div className="card-body d-flex flex-wrap align-items-end gap-3"><div className="flex-grow-1"><label htmlFor="busca-conta" className="form-label fw-semibold">Buscar profissional</label><input id="busca-conta" className="form-control" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Nome, e-mail ou escola" /></div><div className="small text-secondary">{visiveis.length} contas · {usuariosExemplo.length - inativas.length} ativas</div></div></div>
    <div className="card border-0 shadow-sm"><div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead><tr><th>Profissional</th><th>Perfil</th><th>Escola</th><th>Status</th><th className="text-end">Ação</th></tr></thead><tbody>{visiveis.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-secondary">Nenhuma conta encontrada.</td></tr>}{visiveis.map((usuario) => { const inativa = inativas.includes(usuario.id); return <tr key={usuario.id}><td><div className="fw-semibold">{usuario.nome}</div><a className="small" href={`mailto:${usuario.email}`}>{usuario.email}</a></td><td><span className="badge text-bg-light border">{PERFIL[usuario.nivel]}</span></td><td>{usuario.escola || 'Toda a rede'}</td><td><span className={`badge ${inativa ? 'text-bg-secondary' : 'text-bg-success'}`}>{inativa ? 'Inativa' : 'Ativa'}</span></td><td className="text-end"><button className={`btn btn-sm ${inativa ? 'btn-outline-success' : 'btn-outline-danger'}`} onClick={() => alternarConta(usuario.id)}>{inativa ? 'Reativar' : 'Desativar'}</button></td></tr>; })}</tbody></table></div></div>
    <p className="small text-secondary mt-3">Protótipo: alterações de status são guardadas neste navegador. Em produção, esta ação deve ser sincronizada com a API e validada por permissões administrativas.</p>
  </>;
}
