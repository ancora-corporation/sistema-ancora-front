import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import { apiRequest } from '../../services/api';
import MinhaConta from '../../components/MinhaConta';

const hoje = new Date().toISOString().slice(0, 10);
const avaliacoes = ['Avaliação 1', 'Avaliação 2', 'Avaliação 3', 'Avaliação 4'];

export default function PainelProfessor() {
  const navigate = useNavigate();
  const usuario = Auth.usuarioAtual();
  const [turmas, setTurmas] = useState([]);
  const [lotacaoId, setLotacaoId] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [data, setData] = useState(hoje);
  const [aba, setAba] = useState('alunos');
  const [chamada, setChamada] = useState({});
  const [notas, setNotas] = useState({});
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const lotacoes = turmas.flatMap((item) => (item.lotacoes || []).map((lotacao) => ({ ...lotacao, class_id: item.id, class_name: item.name, shift: item.shift, grade_level: item.grade_level })));
  const lotacao = lotacoes.find((item) => item.id === lotacaoId);
  const turma = turmas.find((item) => item.id === lotacao?.class_id);
  const anoLetivoNotas = String(turma?.academic_year || new Date().getFullYear());
  const presentes = Object.values(chamada).filter((status) => status === 'present').length;

  useEffect(() => {
    apiRequest('/classes')
      .then(({ turmas: resultados }) => {
        setTurmas(resultados);
        setLotacaoId(resultados.flatMap((item) => item.lotacoes || [])[0]?.id || '');
      })
      .catch((error) => setErro(error.message))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (!turma?.id || !lotacaoId) return;
    let ativo = true;
    Promise.all([
      apiRequest(`/classes/${turma.id}/alunos`),
      apiRequest(`/attendance?classId=${encodeURIComponent(turma.id)}&lotacaoId=${encodeURIComponent(lotacaoId)}&lessonDate=${encodeURIComponent(data)}`),
      apiRequest(`/grades?classId=${encodeURIComponent(turma.id)}&lotacaoId=${encodeURIComponent(lotacaoId)}`),
    ]).then(([lista, chamadaSalva, notasSalvas]) => {
      if (!ativo) return;
      setErro('');
      setAlunos(lista.alunos);
      setChamada(Object.fromEntries(chamadaSalva.chamada.map((registro) => [registro.student_id, registro.status])));
      setNotas(notasSalvas.notas
        .filter((nota) => nota.period === anoLetivoNotas)
        .reduce((resultado, nota) => ({
          ...resultado,
          [nota.student_id]: { ...resultado[nota.student_id], [nota.assessment]: String(nota.value) },
        }), {}));
    }).catch((error) => { if (ativo) setErro(error.message); });
    return () => { ativo = false; };
  }, [turma?.id, lotacaoId, data, anoLetivoNotas]);

  function atualizarChamada(alunoId, valor) {
    setChamada((atual) => ({ ...atual, [alunoId]: valor }));
    setAviso('');
  }

  function atualizarNota(alunoId, avaliacao, valor) {
    setNotas((atuais) => ({
      ...atuais,
      [alunoId]: { ...atuais[alunoId], [avaliacao]: valor },
    }));
    setAviso('');
  }

  async function salvarChamada() {
    try {
      const records = Object.entries(chamada).map(([studentId, status]) => ({ studentId, status }));
      await apiRequest('/attendance', { method: 'PUT', body: JSON.stringify({ classId: turma.id, lotacaoId, lessonDate: data, records }) });
      setAviso('Chamada salva com sucesso.');
      setErro('');
    } catch (error) { setErro(error.message); }
  }

  async function salvarNota(alunoId, avaliacao) {
    const value = notas[alunoId]?.[avaliacao];
    if (value == null) return;
    try {
      if (value === '') {
        await apiRequest('/grades', { method: 'DELETE', body: JSON.stringify({ classId: turma.id, lotacaoId, studentId: alunoId, assessment: avaliacao, period: anoLetivoNotas }) });
        setAviso(`${avaliacao} removida.`);
      } else {
        await apiRequest('/grades', { method: 'PUT', body: JSON.stringify({ classId: turma.id, lotacaoId, studentId: alunoId, assessment: avaliacao, period: anoLetivoNotas, value: Number(value) }) });
        setAviso(`${avaliacao} salva com sucesso.`);
      }
      setErro('');
    } catch (error) { setErro(error.message); }
  }

  function mediaDoAluno(alunoId) {
    const valores = avaliacoes
      .map((avaliacao) => notas[alunoId]?.[avaliacao])
      .filter((valor) => valor !== '' && valor != null)
      .map(Number)
      .filter((valor) => Number.isFinite(valor) && valor >= 0 && valor <= 10);
    return valores.length ? { valor: valores.reduce((soma, valor) => soma + valor, 0) / valores.length, quantidade: valores.length } : null;
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
        <div className="d-flex gap-2"><MinhaConta /><button className="btn btn-outline-primary" onClick={sair}><i className="bi bi-box-arrow-right me-2" />Sair</button></div>
      </header>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-people" /></span><div><div className="text-secondary small">Turmas vinculadas</div><strong className="fs-3">{turmas.length}</strong></div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-mortarboard" /></span><div><div className="text-secondary small">Alunos na turma</div><strong className="fs-3">{alunos.length}</strong></div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-calendar-check" /></span><div><div className="text-secondary small">Presentes · {turma?.name || '—'}</div><strong className="fs-3">{presentes}<span className="fs-6 text-secondary fw-normal"> / {alunos.length}</span></strong></div></div></div></div>
      </div>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="row align-items-end g-3 mb-4">
            <div className="col-12 col-md-7"><label htmlFor="turma-professor" className="form-label fw-semibold">Turma e disciplina</label><select id="turma-professor" className="form-select form-select-lg" value={lotacaoId} onChange={(e) => setLotacaoId(e.target.value)} disabled={carregando || !lotacoes.length}>{lotacoes.map((item) => <option key={item.id} value={item.id}>{item.class_name} · {item.subject} · {item.shift === 'morning' ? 'Manhã' : item.shift === 'afternoon' ? 'Tarde' : 'Noite'}</option>)}</select></div>
            {aba === 'chamada' && <div className="col-12 col-md-5"><label htmlFor="data-aula" className="form-label fw-semibold">Data da aula</label><input id="data-aula" type="date" className="form-control form-control-lg" value={data} onChange={(e) => setData(e.target.value)} /></div>}
            {aba === 'notas' && <div className="col-12 col-md-5"><span className="form-label fw-semibold d-block">Ano letivo das avaliações</span><div className="form-control form-control-lg bg-light">{anoLetivoNotas}</div></div>}
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="nav nav-tabs w-100" role="tablist" aria-label="Área do professor">
              {[['alunos', 'Lista de alunos', 'bi-people'], ['chamada', 'Chamada', 'bi-calendar-check'], ['notas', 'Notas e avaliações', 'bi-journal-check']].map(([id, rotulo, icone]) => <button key={id} className={`nav-link ${aba === id ? 'active fw-semibold' : ''}`} onClick={() => setAba(id)} role="tab" aria-selected={aba === id} aria-controls={`painel-${id}`} id={`aba-${id}`}><i className={`bi ${icone} me-2`} aria-hidden="true" />{rotulo}</button>)}
            </div>
            {aba === 'chamada' && <div className="d-flex align-items-center gap-3"><span className="badge text-bg-primary">{presentes} de {alunos.length} presentes</span><button className="btn btn-primary btn-sm" onClick={salvarChamada} disabled={!Object.keys(chamada).length}><i className="bi bi-cloud-check me-1" />Salvar chamada</button></div>}
          </div>

          {erro && <div className="alert alert-danger py-2" role="alert">{erro}</div>}
          {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
          {carregando && <div className="text-secondary py-4">Carregando turmas...</div>}
          {!carregando && !lotacoes.length && !erro && <div className="alert alert-info">Nenhuma turma vinculada a este professor.</div>}
          <section id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Aluno</th><th>Matrícula</th>{aba === 'chamada' && <th className="text-md-center">Frequência</th>}{aba === 'notas' && <>{avaliacoes.map((avaliacao) => <th key={avaliacao} className="text-center" style={{ minWidth: 130 }}>{avaliacao}</th>)}<th className="text-center" style={{ minWidth: 150 }}>Média</th></>}</tr></thead>
              <tbody>{alunos.map((aluno) => {
                const media = mediaDoAluno(aluno.id);
                return <tr key={aluno.id}>
                  <td className="fw-semibold">{aluno.name}</td><td className="text-secondary">{aluno.enrollment}</td>
                  {aba === 'chamada' && <td><div className="d-flex flex-wrap gap-2"><button type="button" className={`btn btn-sm ${chamada[aluno.id] === 'present' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => atualizarChamada(aluno.id, 'present')}><i className="bi bi-check2 me-1" />Presente</button><button type="button" className={`btn btn-sm ${chamada[aluno.id] === 'absent' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => atualizarChamada(aluno.id, 'absent')}><i className="bi bi-x me-1" />Ausente</button><button type="button" className={`btn btn-sm ${chamada[aluno.id] === 'excused' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => atualizarChamada(aluno.id, 'excused')}>Falta justificada</button></div></td>}
                  {aba === 'notas' && <>{avaliacoes.map((avaliacao) => <td key={avaliacao}><input aria-label={`${avaliacao} de ${aluno.name}`} type="number" min="0" max="10" step="0.1" className="form-control text-center" placeholder="—" value={notas[aluno.id]?.[avaliacao] ?? ''} onChange={(evento) => atualizarNota(aluno.id, avaliacao, evento.target.value)} onBlur={() => salvarNota(aluno.id, avaliacao)} /></td>)}<td className="text-center"><strong className="fs-5">{media ? media.valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '—'}</strong><div className="small text-secondary">{media ? (media.quantidade === 4 ? 'Média final' : `Parcial · ${media.quantidade}/4`) : 'Sem avaliações'}</div></td></>}
                </tr>;
              })}</tbody>
            </table>
          </div>
          {aba === 'alunos' && <p className="small text-secondary mt-3 mb-0">{alunos.length} alunos · {turma?.shift === 'morning' ? 'Manhã' : turma?.shift === 'afternoon' ? 'Tarde' : 'Noite'} · {lotacao?.subject}</p>}
          {aba === 'notas' && <p className="small text-secondary mt-3 mb-0">As avaliações são salvas ao sair do campo. A média é calculada pelas notas preenchidas; com quatro notas, ela é final.</p>}
          </section>
        </div>
      </section>
      <p className="small text-secondary mb-0"><i className="bi bi-info-circle me-1" />Chamadas e notas são gravadas pela API do Sistema Âncora.</p>
    </div>
  );
}
