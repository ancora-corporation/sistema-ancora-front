import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import { useApiResource } from '../../services/useApiResource';

const PERFIS = { social: 'Assistência social', teacher: 'Professor' };
const cadastroVazio = { nome: '', email: '', senha: '', role: 'teacher', lotacoes: [{ turmaId: '', disciplina: '' }] };

export default function Contas() {
  const { data: profissionais, loading, error, refresh } = useApiResource('/users', 'usuarios');
  const { data: turmas, loading: carregandoTurmas, error: erroTurmas } = useApiResource('/classes', 'turmas');
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [novoProfissional, setNovoProfissional] = useState(cadastroVazio);
  const [erroCadastro, setErroCadastro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function cadastrarProfissional(event) {
    event.preventDefault();
    setErroCadastro('');
    setMensagem('');
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify({ ...novoProfissional, lotacoes: novoProfissional.role === 'teacher' ? novoProfissional.lotacoes : [] }) });
      setNovoProfissional(cadastroVazio);
      setFormularioAberto(false);
      setMensagem('Acesso criado para a equipe desta escola.');
      await refresh();
    } catch (requestError) {
      setErroCadastro(requestError.message);
    }
  }

  return (
    <main className="container py-4">
      <header className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-2">Equipe da escola</h1>
          <p className="text-secondary mb-0">Cadastre professores e profissionais da assistência social vinculados a esta escola.</p>
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-primary" aria-expanded={formularioAberto} onClick={() => { setFormularioAberto((aberto) => !aberto); setErroCadastro(''); }}>
            <i className={`bi ${formularioAberto ? 'bi-x-lg' : 'bi-person-plus'} me-2`} aria-hidden="true" />
            {formularioAberto ? 'Cancelar' : 'Adicionar profissional'}
          </button>
          <Link to="/painel-escola" className="btn btn-outline-primary">
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />Voltar ao painel
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {erroCadastro && <div className="alert alert-danger" role="alert">{erroCadastro}</div>}
      {mensagem && <div className="alert alert-success" role="status">{mensagem}</div>}

      {formularioAberto && (
        <section className="card border-0 shadow-sm mb-4" aria-labelledby="titulo-novo-profissional">
          <form className="card-body" onSubmit={cadastrarProfissional}>
            <h2 id="titulo-novo-profissional" className="h5 fw-bold mb-3">Criar acesso para a equipe</h2>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="nome-profissional" className="form-label">Nome</label>
                <input id="nome-profissional" className="form-control" value={novoProfissional.nome} onChange={(event) => setNovoProfissional({ ...novoProfissional, nome: event.target.value })} minLength={2} maxLength={120} required />
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="email-profissional" className="form-label">E-mail</label>
                <input id="email-profissional" type="email" className="form-control" value={novoProfissional.email} onChange={(event) => setNovoProfissional({ ...novoProfissional, email: event.target.value })} required />
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="senha-profissional" className="form-label">Senha inicial</label>
                <input id="senha-profissional" type="password" className="form-control" value={novoProfissional.senha} onChange={(event) => setNovoProfissional({ ...novoProfissional, senha: event.target.value })} minLength={10} maxLength={200} autoComplete="new-password" required />
                <div className="form-text">Use pelo menos 10 caracteres.</div>
              </div>
              <div className="col-12 col-md-4">
                <label htmlFor="perfil-profissional" className="form-label">Perfil</label>
                <select id="perfil-profissional" className="form-select" value={novoProfissional.role} onChange={(event) => setNovoProfissional({ ...novoProfissional, role: event.target.value })}>
                  <option value="teacher">Professor</option>
                  <option value="social">Assistência social</option>
                </select>
              </div>
              <div className="col-12 col-md-4 d-flex align-items-end justify-content-md-end">
                <button type="submit" className="btn btn-primary w-100"><i className="bi bi-person-plus me-2" aria-hidden="true" />Criar acesso</button>
              </div>
              {novoProfissional.role === 'teacher' && <div className="col-12">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <div><div className="form-label fw-semibold mb-0">Matérias e turmas do professor</div><div className="form-text">Cada linha associa uma matéria a uma turma. Adicione linhas para outros vínculos.</div></div>
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setNovoProfissional({ ...novoProfissional, lotacoes: [...novoProfissional.lotacoes, { turmaId: '', disciplina: '' }] })}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Adicionar matéria e turma</button>
                </div>
                {erroTurmas && <div className="alert alert-danger py-2" role="alert">{erroTurmas}</div>}
                {!carregandoTurmas && !turmas.length && <div className="alert alert-warning py-2">Cadastre uma turma para esta escola antes de cadastrar o professor.</div>}
                <div className="d-grid gap-2">{novoProfissional.lotacoes.map((lotacao, indice) => <div className="row g-2 align-items-end" key={`vinculo-professor-${indice}`}>
                  <div className="col-12 col-md-6"><label className="form-label" htmlFor={`turma-professor-${indice}`}>Turma</label><select id={`turma-professor-${indice}`} className="form-select" value={lotacao.turmaId} onChange={(event) => setNovoProfissional({ ...novoProfissional, lotacoes: novoProfissional.lotacoes.map((item, i) => i === indice ? { ...item, turmaId: event.target.value } : item) })} required disabled={carregandoTurmas || !turmas.length}><option value="">Selecione a turma</option>{turmas.map((turma) => <option key={turma.id} value={turma.id}>{turma.name} · {turma.grade_level} · {turma.academic_year}</option>)}</select></div>
                  <div className="col-12 col-md-5"><label className="form-label" htmlFor={`materia-professor-${indice}`}>Matéria</label><input id={`materia-professor-${indice}`} className="form-control" value={lotacao.disciplina} onChange={(event) => setNovoProfissional({ ...novoProfissional, lotacoes: novoProfissional.lotacoes.map((item, i) => i === indice ? { ...item, disciplina: event.target.value } : item) })} placeholder="Ex.: Matemática" maxLength={100} required /></div>
                  <div className="col-12 col-md-1 d-grid"><button type="button" className="btn btn-outline-danger" aria-label="Remover matéria e turma" disabled={novoProfissional.lotacoes.length === 1} onClick={() => setNovoProfissional({ ...novoProfissional, lotacoes: novoProfissional.lotacoes.filter((_, i) => i !== indice) })}><i className="bi bi-trash" aria-hidden="true" /></button></div>
                </div>)}</div>
              </div>}
            </div>
            <p className="form-text mb-0 mt-3">O acesso será vinculado automaticamente à escola do diretor.</p>
          </form>
        </section>
      )}

      <section className="card border-0 shadow-sm" aria-labelledby="titulo-profissionais">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
            <h2 id="titulo-profissionais" className="h5 fw-bold mb-0">Profissionais cadastrados</h2>
            <span className="small text-secondary">{profissionais.length} pessoa(s)</span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Nome</th><th>Perfil</th><th>E-mail</th><th>Status</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="text-center py-4 text-secondary">Carregando equipe...</td></tr>}
                {!loading && profissionais.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-secondary">Ainda não há profissionais cadastrados nesta escola.</td></tr>}
                {profissionais.filter((profissional) => ['teacher', 'social'].includes(profissional.role)).map((profissional) => (
                  <tr key={profissional.id}>
                    <td className="fw-semibold">{profissional.name}</td>
                    <td>{PERFIS[profissional.role]}</td>
                    <td><a href={`mailto:${profissional.email}`}>{profissional.email}</a></td>
                    <td><span className={`badge ${profissional.is_active ? 'text-bg-success' : 'text-bg-secondary'}`}>{profissional.is_active ? 'Ativo' : 'Inativo'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
