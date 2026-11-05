// DADOS FICTÍCIOS, só para montar a tela.
// Nunca colocar dados reais de escolas ou alunos neste repositório.
//
// status: 'novo' | 'em_andamento' | 'concluido' | 'em_atraso'
// nivel: 'baixo' | 'medio' | 'alto' (a confirmar)
// prazoDias: dias restantes para responder (negativo = em atraso, null = concluído)
export const alertasExemplo = [
  { id: 1, alunoId: 101, aluno: 'Aluno Exemplo 101', escola: 'Escola Municipal Exemplo A', codigo: 'EM-001', bairro: 'Bairro Norte', data: '2026-11-03', nivel: 'alto', status: 'novo', prazoDias: 5, preenchidoPor: null },
  { id: 2, alunoId: 102, aluno: 'Aluno Exemplo 102', escola: 'Escola Municipal Exemplo A', codigo: 'EM-001', bairro: 'Bairro Norte', data: '2026-10-31', nivel: 'medio', status: 'em_andamento', prazoDias: 2, preenchidoPor: 'Assistente Exemplo A1' },
  { id: 3, alunoId: 103, aluno: 'Aluno Exemplo 103', escola: 'Escola Municipal Exemplo A', codigo: 'EM-001', bairro: 'Bairro Norte', data: '2026-10-26', nivel: 'alto', status: 'em_atraso', prazoDias: -3, preenchidoPor: null },
  { id: 4, alunoId: 201, aluno: 'Aluno Exemplo 201', escola: 'Escola Municipal Exemplo B', codigo: 'EM-002', bairro: 'Bairro Sul', data: '2026-10-20', nivel: 'baixo', status: 'concluido', prazoDias: null, preenchidoPor: 'Assistente Exemplo B1' },
  { id: 5, alunoId: 202, aluno: 'Aluno Exemplo 202', escola: 'Escola Municipal Exemplo B', codigo: 'EM-002', bairro: 'Bairro Sul', data: '2026-11-04', nivel: 'medio', status: 'novo', prazoDias: 6, preenchidoPor: null },
  { id: 6, alunoId: 301, aluno: 'Aluno Exemplo 301', escola: 'Escola Municipal Exemplo C', codigo: 'EM-003', bairro: 'Bairro Leste', data: '2026-10-27', nivel: 'alto', status: 'em_atraso', prazoDias: -2, preenchidoPor: 'Assistente Exemplo C1' },
  { id: 7, alunoId: 302, aluno: 'Aluno Exemplo 302', escola: 'Escola Municipal Exemplo C', codigo: 'EM-003', bairro: 'Bairro Leste', data: '2026-11-02', nivel: 'medio', status: 'novo', prazoDias: 4, preenchidoPor: null },
  { id: 8, alunoId: 401, aluno: 'Aluno Exemplo 401', escola: 'Escola Municipal Exemplo D', codigo: 'EM-004', bairro: 'Bairro Oeste', data: '2026-10-30', nivel: 'baixo', status: 'novo', prazoDias: 1, preenchidoPor: null },
  { id: 9, alunoId: 402, aluno: 'Aluno Exemplo 402', escola: 'Escola Municipal Exemplo D', codigo: 'EM-004', bairro: 'Bairro Oeste', data: '2026-10-15', nivel: 'alto', status: 'concluido', prazoDias: null, preenchidoPor: 'Assistente Exemplo D1' },
  { id: 10, alunoId: 501, aluno: 'Aluno Exemplo 501', escola: 'Escola Municipal Exemplo E', codigo: 'EM-005', bairro: 'Bairro Norte', data: '2026-11-01', nivel: 'medio', status: 'em_andamento', prazoDias: 3, preenchidoPor: 'Assistente Exemplo E1' },
  { id: 11, alunoId: 502, aluno: 'Aluno Exemplo 502', escola: 'Escola Municipal Exemplo E', codigo: 'EM-005', bairro: 'Bairro Norte', data: '2026-10-28', nivel: 'alto', status: 'em_atraso', prazoDias: -1, preenchidoPor: null },
  { id: 12, alunoId: 601, aluno: 'Aluno Exemplo 601', escola: 'Escola Municipal Exemplo F', codigo: 'EM-006', bairro: 'Bairro Centro', data: '2026-10-29', nivel: 'baixo', status: 'concluido', prazoDias: null, preenchidoPor: 'Assistente Exemplo F1' },
];