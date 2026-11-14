import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '../../services/auth';
import { lerRegistros, salvarRegistros, turmasExemplo } from '../../data/turmasExemplo';

const hoje = new Date().toISOString().slice(0, 10);

export default function PainelProfessor() {
  const navigate = useNavigate();
  const usuario = Auth.usuarioAtual();
  const [turmaId, setTurmaId] = useState(turmasExemplo[0].id);
  const [data, setData] = useState(hoje);
  const [aba, setAba] = useState('alunos');
  const [registros, setRegistros] = useState(lerRegistros);
  const [aviso, setAviso] = useState('');
  const turma = turmasExemplo.find((item) => item.id === turmaId);
  const chave = `${turmaId}:${data}`;
  const chamada = registros[chave]?.presencas || {};
  const notas = registros[chave]?.notas || {};
  const presentes = Object.values(chamada).filter((status) => status === 'presente').length;

  function atualizarRegistro(categoria, alunoId, valor) {
    const atualizados = {
      ...registros,
      [chave]: { ...registros[chave], [categoria]: { ...(registros[chave]?.[categoria] || {}), [alunoId]: valor } },
    };
    setRegistros(atualizados);
    salvarRegistros(atualizados);
    setAviso('Alteração salva neste dispositivo.');
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
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-people" /></span><div><div className="text-secondary small">Turmas vinculadas</div><strong className="fs-3">{turmasExemplo.length}</strong></div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-mortarboard" /></span><div><div className="text-secondary small">Alunos nas turmas</div><strong className="fs-3">{turmasExemplo.reduce((total, item) => total + item.alunos.length, 0)}</strong></div></div></div></div>
        <div className="col-12 col-md-4"><div className="card border-0 shadow-sm h-100"><div className="card-body d-flex align-items-center gap-3"><span className="professor-icon"><i className="bi bi-calendar-check" /></span><div><div className="text-secondary small">Presentes · {turma.nome}</div><strong className="fs-3">{presentes}<span className="fs-6 text-secondary fw-normal"> / {turma.alunos.length}</span></strong></div></div></div></div>
      </div>

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="row align-items-end g-3 mb-4">
            <div className="col-12 col-md-6 col-lg-5"><label htmlFor="turma-professor" className="form-label fw-semibold">Selecione a turma</label><select id="turma-professor" className="form-select form-select-lg" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>{turmasExemplo.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.turno}</option>)}</select></div>
            <div className="col-12 col-md-6 col-lg-4"><label htmlFor="data-aula" className="form-label fw-semibold">Data da aula</label><input id="data-aula" type="date" className="form-control form-control-lg" value={data} onChange={(e) => setData(e.target.value)} /></div>
            <div className="col-lg-3 text-secondary small">{turma.disciplina} · {turma.etapa}</div>
          </div>

          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="nav nav-pills" role="tablist" aria-label="Área da turma">
              {[['alunos', 'Alunos'], ['chamada', 'Chamada'], ['notas', 'Notas']].map(([id, rotulo]) => <button key={id} className={`nav-link ${aba === id ? 'active' : ''}`} onClick={() => setAba(id)} role="tab" aria-selected={aba === id}>{rotulo}</button>)}
            </div>
            {aba === 'chamada' && <span className="badge text-bg-primary">{presentes} de {turma.alunos.length} presentes</span>}
          </div>

          {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Aluno</th><th>Matrícula</th>{aba === 'chamada' && <th className="text-md-center">Frequência</th>}{aba === 'notas' && <th style={{ minWidth: 180 }}>Nota do dia (0 a 10)</th>}</tr></thead>
              <tbody>{turma.alunos.map((aluno) => <tr key={aluno.id}>
                <td className="fw-semibold">{aluno.nome}</td><td className="text-secondary">{aluno.matricula}</td>
                {aba === 'chamada' && <td><div className="d-flex flex-wrap gap-2"><button className={`btn btn-sm ${chamada[aluno.id] === 'presente' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => atualizarRegistro('presencas', aluno.id, 'presente')}><i className="bi bi-check2 me-1" />Presente</button><button className={`btn btn-sm ${chamada[aluno.id] === 'ausente' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => atualizarRegistro('presencas', aluno.id, 'ausente')}><i className="bi bi-x me-1" />Ausente</button></div></td>}
                {aba === 'notas' && <td><input aria-label={`Nota de ${aluno.nome}`} type="number" min="0" max="10" step="0.1" className="form-control" placeholder="Sem nota" value={notas[aluno.id] ?? ''} onChange={(e) => atualizarRegistro('notas', aluno.id, e.target.value)} /></td>}
              </tr>)}</tbody>
            </table>
          </div>
          {aba === 'alunos' && <p className="small text-secondary mt-3 mb-0">{turma.alunos.length} alunos · {turma.turno} · {turma.disciplina}</p>}
        </div>
      </section>
      <p className="small text-secondary mb-0"><i className="bi bi-info-circle me-1" />Protótipo: chamadas e notas ficam salvas no navegador e serão integradas à API quando disponível.</p>
    </div>
  );
}
