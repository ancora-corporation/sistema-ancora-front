import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import { apiRequest } from '../../services/api';

const hoje = new Date().toISOString().slice(0, 10);

export default function PainelProfessor() {
  const navigate = useNavigate();
  const usuario = Auth.usuarioAtual();
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [data, setData] = useState(hoje);
  const [aba, setAba] = useState('alunos');
  const [chamada, setChamada] = useState({});
  const [notas, setNotas] = useState({});
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const turma = turmas.find((item) => item.id === turmaId);
  const presentes = Object.values(chamada).filter((status) => status === 'present').length;

  useEffect(() => {
    apiRequest('/classes')
      .then(({ turmas: resultados }) => {
        setTurmas(resultados);
        setTurmaId(resultados[0]?.id || '');
      })
      .catch((error) => setErro(error.message))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    let ativo = true;
    Promise.all([
      apiRequest(`/classes/${turmaId}/alunos`),
      apiRequest(`/attendance?classId=${encodeURIComponent(turmaId)}&lessonDate=${encodeURIComponent(data)}`),
      apiRequest(`/grades?classId=${encodeURIComponent(turmaId)}`),
    ]).then(([lista, chamadaSalva, notasSalvas]) => {
      if (!ativo) return;
      setErro('');
      setAlunos(lista.alunos);
      setChamada(Object.fromEntries(chamadaSalva.chamada.map((registro) => [registro.student_id, registro.status])));
      setNotas(Object.fromEntries(notasSalvas.notas.filter((nota) => nota.period === data).map((nota) => [nota.student_id, String(nota.value)])));
    }).catch((error) => { if (ativo) setErro(error.message); });
    return () => { ativo = false; };
  }, [turmaId, data]);

  function atualizarRegistro(categoria, alunoId, valor) {
    if (categoria === 'presencas') setChamada((atual) => ({ ...atual, [alunoId]: valor }));
    if (categoria === 'notas') setNotas((atual) => ({ ...atual, [alunoId]: valor }));
    setAviso('');
  }

  async function salvarChamada() {
    try {
      const records = Object.entries(chamada).map(([studentId, status]) => ({ studentId, status }));
      await apiRequest('/attendance', { method: 'PUT', body: JSON.stringify({ classId: turmaId, lessonDate: data, records }) });
      setAviso('Chamada salva com sucesso.');
      setErro('');
    } catch (error) { setErro(error.message); }
  }

  async function salvarNota(alunoId) {
    const value = notas[alunoId];
    if (value === '' || value == null) return;
    try {
      await apiRequest('/grades', { method: 'PUT', body: JSON.stringify({ classId: turmaId, studentId: alunoId, subject: turma.subject, assessment: 'Nota do dia', period: data, value: Number(value) }) });
      setAviso('Nota salva com sucesso.');
      setErro('');
    } catch (error) { setErro(error.message); }
  }

  function sair() {
    Auth.sair();
    navigate('/login');
  }

  return (
    <div className="container-fluid px-3 px-lg-5 py-4 ancora-professor">
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="text-primary fw-bold small text-uppercase">Sistema Âncora · Área do professor</div>
          <h1 className="h2 fw-bold mt-1 mb-1">Olá, {usuario?.nome?.split(' ')[0]}</h1>
          <p className="text-secondary mb-0">Organize suas turmas, registre a frequência e acompanhe as notas.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={sair}><i className="bi bi-box-arrow-right me-2" />Sair</button>
      </header>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-people" /></span><div><div className="text-secondary small">Turmas vinculadas</div><strong className="fs-3">{turmas.length}</strong></div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-mortarboard" /></span><div><div className="text-secondary small">Alunos na turma</div><strong className="fs-3">{alunos.length}</strong></div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-calendar-check" /></span><div><div className="text-secondary small">Presentes · {turma?.name || '—'}</div><strong className="fs-3">{presentes}<span className="fs-6 text-secondary fw-normal"> / {alunos.length}</span></strong></div></div></div></div>
      </div>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="row align-items-end g-3 mb-4">
            <div className="col-12 col-md-6 col-lg-5"><label htmlFor="turma-professor" className="form-label fw-semibold">Selecione a turma</label><select id="turma-professor" className="form-select form-select-lg" value={turmaId} onChange={(e) => setTurmaId(e.target.value)} disabled={carregando || !turmas.length}>{turmas.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.shift === 'morning' ? 'Manhã' : item.shift === 'afternoon' ? 'Tarde' : 'Noite'}</option>)}</select></div>
            <div className="col-12 col-md-6 col-lg-4"><label htmlFor="data-aula" className="form-label fw-semibold">Data da aula</label><input id="data-aula" type="date" className="form-control form-control-lg" value={data} onChange={(e) => setData(e.target.value)} /></div>
            <div className="col-lg-3 text-secondary small">{turma?.subject} · {turma?.grade_level}</div>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="nav nav-pills" role="tablist" aria-label="Área da turma">
              {[['alunos', 'Alunos'], ['chamada', 'Chamada'], ['notas', 'Notas']].map(([id, rotulo]) => <button key={id} className={`nav-link ${aba === id ? 'active' : ''}`} onClick={() => setAba(id)} role="tab" aria-selected={aba === id}>{rotulo}</button>)}
            </div>
            {aba === 'chamada' && <div className="d-flex align-items-center gap-3"><span className="badge text-bg-primary">{presentes} de {alunos.length} presentes</span><button className="btn btn-primary btn-sm" onClick={salvarChamada} disabled={!Object.keys(chamada).length}><i className="bi bi-cloud-check me-1" />Salvar chamada</button></div>}
          </div>

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}
          {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
          {carregando && <div className="text-secondary py-4">Carregando turmas...</div>}
          {!carregando && !turmas.length && !erro && <div className="alert alert-info">Nenhuma turma vinculada a este professor.</div>}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Aluno</th><th>Matrícula</th>{aba === 'chamada' && <th className="text-md-center">Frequência</th>}{aba === 'notas' && <th style={{ minWidth: 180 }}>Nota do dia (0 a 10)</th>}</tr></thead>
              <tbody>{alunos.map((aluno) => <tr key={aluno.id}>
                <td className="fw-semibold">{aluno.name}</td><td className="text-secondary">{aluno.enrollment}</td>
                {aba === 'chamada' && <td><div className="d-flex flex-wrap gap-2"><button className={`btn btn-sm ${chamada[aluno.id] === 'present' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => atualizarRegistro('presencas', aluno.id, 'present')}><i className="bi bi-check2 me-1" />Presente</button><button className={`btn btn-sm ${chamada[aluno.id] === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => atualizarRegistro('presencas', aluno.id, 'absent')}><i className="bi bi-x me-1" />Ausente</button></div></td>}
                {aba === 'notas' && <td><input aria-label={`Nota de ${aluno.name}`} type="number" min="0" max="10" step="0.1" className="form-control" placeholder="Sem nota" value={notas[aluno.id] ?? ''} onChange={(e) => atualizarRegistro('notas', aluno.id, e.target.value)} onBlur={() => salvarNota(aluno.id)} /></td>}
              </tr>)}</tbody>
            </table>
          </div>
          {aba === 'alunos' && <p className="small text-secondary mt-3 mb-0">{alunos.length} alunos · {turma?.shift === 'morning' ? 'Manhã' : turma?.shift === 'afternoon' ? 'Tarde' : 'Noite'} · {turma?.subject}</p>}
        </div>
      </section>
      <p className="small text-secondary mb-0"><i className="bi bi-info-circle me-1" />Chamadas e notas são gravadas pela API do Sistema Âncora.</p>
    </div>
  );
}
