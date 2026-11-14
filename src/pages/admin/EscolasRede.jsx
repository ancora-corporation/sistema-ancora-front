import { Link, useParams, useSearchParams } from 'react-router-dom';
import { alertasExemplo } from '../../data/alertasExemplo';
import { usuariosExemplo } from '../../data/usuariosExemplo';

const escolas = [...new Map(usuariosExemplo.filter((usuario) => usuario.escolaId).map((usuario) => [usuario.escolaId, { id: usuario.escolaId, nome: usuario.escola }])).values()];

export default function EscolasRede() {
  const { escolaId } = useParams();
  const [params] = useSearchParams();
  const escolaAtual = escolas.find((escola) => escola.id === Number(escolaId));
  const filtradas = escolas.filter((escola) => {
    const alertas = alertasExemplo.filter((alerta) => alerta.escola === escola.nome);
    if (params.get('alertas') === 'a-responder') return alertas.some((alerta) => ['novo', 'em_andamento'].includes(alerta.status));
    if (params.get('alertas') === 'em-atraso') return alertas.some((alerta) => alerta.status === 'em_atraso');
    return true;
  });

  if (escolaId) {
    if (!escolaAtual) return <div className="alert alert-warning">Escola não encontrada. <Link to="/admin/escolas">Voltar para escolas</Link></div>;
    const equipe = usuariosExemplo.filter((usuario) => usuario.escolaId === escolaAtual.id);
    const alertas = alertasExemplo.filter((alerta) => alerta.escola === escolaAtual.nome);
    return <>
      <Link to="/admin/escolas" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />Voltar para escolas</Link>
      <header className="mt-3 mb-4"><span className="text-primary small fw-bold">PERFIL DA ESCOLA</span><h1 className="h2 fw-bold mb-1">{escolaAtual.nome}</h1><p className="text-secondary mb-0">Resumo de usuários e alertas vinculados à unidade.</p></header>
      <div className="row g-3 mb-4"><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">Profissionais vinculados</span><div className="fs-3 fw-bold">{equipe.length}</div></div></div></div><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">Alertas</span><div className="fs-3 fw-bold">{alertas.length}</div></div></div></div><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">A responder</span><div className="fs-3 fw-bold">{alertas.filter((alerta) => ['novo', 'em_andamento'].includes(alerta.status)).length}</div></div></div></div></div>
      <div className="card border-0 shadow-sm"><div className="card-body"><h2 className="h5 fw-bold">Equipe da escola</h2><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Profissional</th><th>Perfil</th><th>Contato</th></tr></thead><tbody>{equipe.map((usuario) => <tr key={usuario.id}><td className="fw-semibold">{usuario.nome}</td><td>{({ 1: 'Assistência social', 2: 'Direção', 4: 'Professor' })[usuario.nivel]}</td><td><a href={`mailto:${usuario.email}`}>{usuario.email}</a></td></tr>)}</tbody></table></div></div></div>
    </>;
  }

  return <>
    <header className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"><div><h1 className="h2 fw-bold mb-1">Escolas</h1><p className="text-secondary mb-0">Acompanhe unidades, equipe e alertas da rede.</p></div><span className="badge text-bg-light border">{filtradas.length} de {escolas.length} escolas</span></header>
    {params.has('alertas') && <div className="alert alert-primary py-2">Filtro: {params.get('alertas') === 'em-atraso' ? 'escolas com alertas em atraso' : 'escolas com alertas a responder'} <Link to="/admin/escolas" className="alert-link ms-2">Limpar filtro</Link></div>}
    <div className="row g-3">{filtradas.map((escola) => {
      const equipe = usuariosExemplo.filter((usuario) => usuario.escolaId === escola.id);
      const alertas = alertasExemplo.filter((alerta) => alerta.escola === escola.nome);
      const pendentes = alertas.filter((alerta) => ['novo', 'em_andamento'].includes(alerta.status)).length;
      const atrasados = alertas.filter((alerta) => alerta.status === 'em_atraso').length;
      return <div className="col-12 col-lg-6" key={escola.id}><article className="card h-100 border-0 shadow-sm"><div className="card-body p-4"><div className="d-flex justify-content-between gap-3"><div><span className="badge text-bg-light border mb-2">EM-{String(escola.id).padStart(3, '0')}</span><h2 className="h5 fw-bold">{escola.nome}</h2></div><i className="bi bi-building text-primary fs-3" aria-hidden="true" /></div><div className="d-flex flex-wrap gap-4 small text-secondary mb-3"><span><i className="bi bi-people me-1" />{equipe.length} profissionais</span><span><i className="bi bi-bell me-1" />{alertas.length} alertas</span></div><div className="d-flex gap-2 mb-3"><span className="badge text-bg-primary">{pendentes} a responder</span>{atrasados > 0 && <span className="badge text-bg-danger">{atrasados} em atraso</span>}</div><Link className="btn btn-outline-primary btn-sm" to={`/admin/escolas/${escola.id}`}>Ver perfil <i className="bi bi-arrow-right ms-1" /></Link></div></article></div>;
    })}</div>
    <p className="small text-secondary mt-4">Informações demonstrativas com dados fictícios. A integração com a API será necessária para atualizar os indicadores.</p>
  </>;
}
