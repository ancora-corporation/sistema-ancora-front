import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApiResource } from '../../services/useApiResource';

export default function EscolasRede() {
  const { escolaId } = useParams();
  const [params] = useSearchParams();
  const { data: escolas, loading, error } = useApiResource('/schools', 'escolas');
  const { data: alertas, error: alertasErro } = useApiResource('/alerts', 'alertas');
  const { data: usuarios, error: usuariosErro } = useApiResource('/users', 'usuarios');
  const escolaAtual = escolas.find((escola) => escola.id === escolaId);
  const filtradas = escolas.filter((escola) => {
    const alertasDaEscola = alertas.filter((alerta) => alerta.school_name === escola.name);
    if (params.get('alertas') === 'a-responder') return alertasDaEscola.some((alerta) => ['new', 'in_progress'].includes(alerta.status));
    if (params.get('alertas') === 'em-atraso') return alertasDaEscola.some((alerta) => alerta.status === 'overdue');
    return true;
  });

  if (escolaId) {
    if (!escolaAtual) return <div className="alert alert-warning">Escola não encontrada. <Link to="/admin/escolas">Voltar para escolas</Link></div>;
    const equipe = usuarios.filter((usuario) => usuario.school_id === escolaAtual.id);
    const alertasDaEscola = alertas.filter((alerta) => alerta.school_name === escolaAtual.name);
    return <>
      {(error || alertasErro || usuariosErro) && <div className="alert alert-danger">{error || alertasErro || usuariosErro}</div>}
      <Link to="/admin/escolas" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />Voltar para escolas</Link>
      <header className="mt-3 mb-4"><span className="text-primary small fw-bold">PERFIL DA ESCOLA</span><h1 className="h2 fw-bold mb-1">{escolaAtual.name}</h1><p className="text-secondary mb-0">Resumo de usuários e alertas vinculados à unidade.</p></header>
      <div className="row g-3 mb-4"><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">Profissionais vinculados</span><div className="fs-3 fw-bold">{equipe.length}</div></div></div></div><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">Alertas</span><div className="fs-3 fw-bold">{alertasDaEscola.length}</div></div></div></div><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">A responder</span><div className="fs-3 fw-bold">{alertasDaEscola.filter((alerta) => ['new', 'in_progress'].includes(alerta.status)).length}</div></div></div></div></div>
      <div className="card border-0 shadow-sm"><div className="card-body"><h2 className="h5 fw-bold">Equipe da escola</h2><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Profissional</th><th>Perfil</th><th>Contato</th></tr></thead><tbody>{equipe.map((usuario) => <tr key={usuario.id}><td className="fw-semibold">{usuario.name}</td><td>{({ social: 'Assistência social', director: 'Direção', teacher: 'Professor' })[usuario.role]}</td><td><a href={`mailto:${usuario.email}`}>{usuario.email}</a></td></tr>)}</tbody></table></div></div></div>
    </>;
  }

  return <>
    <header className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"><div><h1 className="h2 fw-bold mb-1">Escolas</h1><p className="text-secondary mb-0">Acompanhe unidades, equipe e alertas da rede.</p></div><span className="badge text-bg-light border">{filtradas.length} de {escolas.length} escolas</span></header>
    {(error || alertasErro || usuariosErro) && <div className="alert alert-danger">{error || alertasErro || usuariosErro}</div>}
    {params.has('alertas') && <div className="alert alert-primary py-2">Filtro: {params.get('alertas') === 'em-atraso' ? 'escolas com alertas em atraso' : 'escolas com alertas a responder'} <Link to="/admin/escolas" className="alert-link ms-2">Limpar filtro</Link></div>}
    <div className="row g-3">{filtradas.map((escola) => {
      const equipe = usuarios.filter((usuario) => usuario.school_id === escola.id);
      const alertasDaEscola = alertas.filter((alerta) => alerta.school_name === escola.name);
      const pendentes = alertasDaEscola.filter((alerta) => ['new', 'in_progress'].includes(alerta.status)).length;
      const atrasados = alertasDaEscola.filter((alerta) => alerta.status === 'overdue').length;
      return <div className="col-12 col-lg-6" key={escola.id}><article className="card h-100 border-0 shadow-sm"><div className="card-body p-4"><div className="d-flex justify-content-between gap-3"><div><span className="badge text-bg-light border mb-2">{escola.code}</span><h2 className="h5 fw-bold">{escola.name}</h2></div><i className="bi bi-building text-primary fs-3" aria-hidden="true" /></div><div className="d-flex flex-wrap gap-4 small text-secondary mb-3"><span><i className="bi bi-people me-1" />{equipe.length} profissionais</span><span><i className="bi bi-bell me-1" />{alertasDaEscola.length} alertas</span></div><div className="d-flex gap-2 mb-3"><span className="badge text-bg-primary">{pendentes} a responder</span>{atrasados > 0 && <span className="badge text-bg-danger">{atrasados} em atraso</span>}</div><Link className="btn btn-outline-primary btn-sm" to={`/admin/escolas/${escola.id}`}>Ver perfil <i className="bi bi-arrow-right ms-1" /></Link></div></article></div>;
    })}</div>
    {loading && <p className="small text-secondary mt-4">Carregando escolas...</p>}
  </>;
}
