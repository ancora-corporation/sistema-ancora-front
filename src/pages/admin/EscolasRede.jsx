import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { useApiResource } from '../../services/useApiResource';

export default function EscolasRede() {
  const { escolaId } = useParams();
  const [params] = useSearchParams();
  const { data: escolas, loading, error, refresh } = useApiResource('/schools', 'escolas');
  const { data: alertas, error: alertasErro } = useApiResource('/alerts', 'alertas');
  const { data: usuarios, error: usuariosErro } = useApiResource('/users', 'usuarios');
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [novaEscola, setNovaEscola] = useState({ name: '', code: '', district: '' });
  const [erroCadastro, setErroCadastro] = useState('');
  const [mensagemCadastro, setMensagemCadastro] = useState('');
  const [diretorSelecionado, setDiretorSelecionado] = useState(null);
  const [salvandoDiretor, setSalvandoDiretor] = useState(false);
  const escolaAtual = escolas.find((escola) => escola.id === escolaId);
  const filtradas = escolas.filter((escola) => {
    const alertasDaEscola = alertas.filter((alerta) => alerta.school_name === escola.name);
    if (params.get('alertas') === 'a-responder') return alertasDaEscola.some((alerta) => ['new', 'in_progress'].includes(alerta.status));
    if (params.get('alertas') === 'em-atraso') return alertasDaEscola.some((alerta) => alerta.status === 'overdue');
    return true;
  });

  async function criarEscola(event) {
    event.preventDefault();
    setErroCadastro('');
    setMensagemCadastro('');
    try {
      await apiRequest('/schools', {
        method: 'POST',
        body: JSON.stringify({
          name: novaEscola.name.trim(),
          code: novaEscola.code.trim().toUpperCase(),
          district: novaEscola.district.trim() || undefined,
        }),
      });
      setNovaEscola({ name: '', code: '', district: '' });
      setFormularioAberto(false);
      setMensagemCadastro('Escola adicionada com sucesso.');
      await refresh();
    } catch (requestError) {
      setErroCadastro(requestError.message);
    }
  }

  async function designarDiretor(event) {
    event.preventDefault();
    setErroCadastro('');
    setMensagemCadastro('');
    setSalvandoDiretor(true);
    const diretorId = diretorSelecionado ?? escolaAtual.director_id ?? '';
    try {
      await apiRequest(`/schools/${escolaAtual.id}/diretor`, {
        method: 'PATCH',
        body: JSON.stringify({ directorId: diretorId || null }),
      });
      setDiretorSelecionado(null);
      setMensagemCadastro(diretorId ? 'Diretor designado para esta escola.' : 'Diretor removido da escola.');
      await refresh();
    } catch (requestError) {
      setErroCadastro(requestError.message);
    } finally {
      setSalvandoDiretor(false);
    }
  }

  if (escolaId) {
    if (!escolaAtual) return <div className="alert alert-warning">Escola não encontrada. <Link to="/admin/escolas">Voltar para escolas</Link></div>;
    const equipe = usuarios.filter((usuario) => usuario.school_id === escolaAtual.id);
    const diretores = equipe.filter((usuario) => usuario.role === 'director' && usuario.is_active);
    const alertasDaEscola = alertas.filter((alerta) => alerta.school_name === escolaAtual.name);
    return <>
      {(error || alertasErro || usuariosErro) && <div className="alert alert-danger">{error || alertasErro || usuariosErro}</div>}
      <Link to="/admin/escolas" className="small text-decoration-none"><i className="bi bi-arrow-left me-1" />Voltar para escolas</Link>
      <header className="mt-3 mb-4"><span className="text-primary small fw-bold">PERFIL DA ESCOLA</span><h1 className="h2 fw-bold mb-1">{escolaAtual.name}</h1><p className="text-secondary mb-0">Resumo de usuários e alertas vinculados à unidade.</p></header>
      {erroCadastro && <div className="alert alert-danger" role="alert">{erroCadastro}</div>}
      {mensagemCadastro && <div className="alert alert-success" role="status">{mensagemCadastro}</div>}
      <section className="card border-0 shadow-sm mb-4" aria-labelledby="titulo-diretor-escola">
        <form className="card-body" onSubmit={designarDiretor}>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-8">
              <h2 id="titulo-diretor-escola" className="h5 fw-bold">Diretor responsável</h2>
              {diretores.length ? (
                <>
                  <label htmlFor="diretor-escola" className="form-label">Escolha um diretor ativo desta escola</label>
                  <select id="diretor-escola" className="form-select" value={diretorSelecionado ?? escolaAtual.director_id ?? ''} onChange={(event) => setDiretorSelecionado(event.target.value)}>
                    <option value="">Nenhum diretor designado</option>
                    {diretores.map((diretor) => <option key={diretor.id} value={diretor.id}>{diretor.name} · {diretor.email}</option>)}
                  </select>
                </>
              ) : (
                <p className="text-secondary mb-0">Ainda não há uma conta de direção ativa vinculada a esta escola. <Link to="/admin/contas">Criar conta de direção</Link>.</p>
              )}
            </div>
            <div className="col-12 col-md-4 d-grid">
              <button type="submit" className="btn btn-primary" disabled={!diretores.length || salvandoDiretor}>
                {salvandoDiretor ? 'Salvando...' : 'Designar diretor'}
              </button>
            </div>
          </div>
        </form>
      </section>
      <div className="row g-3 mb-4"><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">Profissionais vinculados</span><div className="fs-3 fw-bold">{equipe.length}</div></div></div></div><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">Alertas</span><div className="fs-3 fw-bold">{alertasDaEscola.length}</div></div></div></div><div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><span className="small text-secondary">A responder</span><div className="fs-3 fw-bold">{alertasDaEscola.filter((alerta) => ['new', 'in_progress'].includes(alerta.status)).length}</div></div></div></div></div>
      <div className="card border-0 shadow-sm"><div className="card-body"><h2 className="h5 fw-bold">Equipe da escola</h2><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Profissional</th><th>Perfil</th><th>Contato</th></tr></thead><tbody>{equipe.map((usuario) => <tr key={usuario.id}><td className="fw-semibold">{usuario.name}</td><td>{({ social: 'Assistência social', director: 'Direção', teacher: 'Professor' })[usuario.role]}</td><td><a href={`mailto:${usuario.email}`}>{usuario.email}</a></td></tr>)}</tbody></table></div></div></div>
    </>;
  }

  return <>
    <header className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div><h1 className="h2 fw-bold mb-1">Escolas</h1><p className="text-secondary mb-0">Acompanhe unidades, equipe e alertas da rede.</p></div>
      <div className="d-flex align-items-center gap-3">
        <span className="badge text-bg-light border">{filtradas.length} de {escolas.length} escolas</span>
        <button type="button" className="btn btn-primary" aria-expanded={formularioAberto} onClick={() => { setFormularioAberto((aberto) => !aberto); setErroCadastro(''); }}>
          <i className={`bi ${formularioAberto ? 'bi-x-lg' : 'bi-building-add'} me-2`} aria-hidden="true" />
          {formularioAberto ? 'Cancelar' : 'Adicionar escola'}
        </button>
      </div>
    </header>
    {(error || alertasErro || usuariosErro) && <div className="alert alert-danger">{error || alertasErro || usuariosErro}</div>}
    {erroCadastro && <div className="alert alert-danger" role="alert">{erroCadastro}</div>}
    {mensagemCadastro && <div className="alert alert-success" role="status">{mensagemCadastro}</div>}
    {formularioAberto && (
      <section className="card border-0 shadow-sm mb-4" aria-labelledby="titulo-nova-escola">
        <form className="card-body" onSubmit={criarEscola}>
          <h2 id="titulo-nova-escola" className="h5 fw-bold mb-3">Adicionar escola à rede</h2>
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-5">
              <label htmlFor="nome-escola" className="form-label">Nome da escola</label>
              <input id="nome-escola" className="form-control" value={novaEscola.name} onChange={(event) => setNovaEscola({ ...novaEscola, name: event.target.value })} minLength={3} maxLength={160} required />
            </div>
            <div className="col-12 col-md-3">
              <label htmlFor="codigo-escola" className="form-label">Código</label>
              <input id="codigo-escola" className="form-control text-uppercase" value={novaEscola.code} onChange={(event) => setNovaEscola({ ...novaEscola, code: event.target.value.toUpperCase() })} minLength={2} maxLength={30} required />
            </div>
            <div className="col-12 col-md-3">
              <label htmlFor="bairro-escola" className="form-label">Bairro</label>
              <input id="bairro-escola" className="form-control" value={novaEscola.district} onChange={(event) => setNovaEscola({ ...novaEscola, district: event.target.value })} maxLength={120} />
            </div>
            <div className="col-12 col-md-1 d-grid">
              <button type="submit" className="btn btn-primary" aria-label="Salvar escola"><i className="bi bi-check-lg" aria-hidden="true" /></button>
            </div>
          </div>
        </form>
      </section>
    )}
    {params.has('alertas') && <div className="alert alert-primary py-2">Filtro: {params.get('alertas') === 'em-atraso' ? 'escolas com alertas em atraso' : 'escolas com alertas a responder'} <Link to="/admin/escolas" className="alert-link ms-2">Limpar filtro</Link></div>}
    <div className="row g-3">{filtradas.map((escola) => {
      const equipe = usuarios.filter((usuario) => usuario.school_id === escola.id);
      const alertasDaEscola = alertas.filter((alerta) => alerta.school_name === escola.name);
      const pendentes = alertasDaEscola.filter((alerta) => ['new', 'in_progress'].includes(alerta.status)).length;
      const atrasados = alertasDaEscola.filter((alerta) => alerta.status === 'overdue').length;
      return <div className="col-12 col-lg-6" key={escola.id}><article className="card h-100 border-0 shadow-sm"><div className="card-body p-4"><div className="d-flex justify-content-between gap-3"><div><span className="badge text-bg-light border mb-2">{escola.code}</span><h2 className="h5 fw-bold">{escola.name}</h2></div><i className="bi bi-building text-primary fs-3" aria-hidden="true" /></div><p className="small text-secondary mb-3">Diretor: {escola.director_name || 'Não designado'}</p><div className="d-flex flex-wrap gap-4 small text-secondary mb-3"><span><i className="bi bi-people me-1" />{equipe.length} profissionais</span><span><i className="bi bi-bell me-1" />{alertasDaEscola.length} alertas</span></div><div className="d-flex gap-2 mb-3"><span className="badge text-bg-primary">{pendentes} a responder</span>{atrasados > 0 && <span className="badge text-bg-danger">{atrasados} em atraso</span>}</div><Link className="btn btn-outline-primary btn-sm" to={`/admin/escolas/${escola.id}`}>Ver perfil <i className="bi bi-arrow-right ms-1" /></Link></div></article></div>;
    })}</div>
    {loading && <p className="small text-secondary mt-4">Carregando escolas...</p>}
  </>;
}
