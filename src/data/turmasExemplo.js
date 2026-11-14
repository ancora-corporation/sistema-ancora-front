export const turmasExemplo = [
  {
    id: '6A', nome: '6º ano A', etapa: 'Ensino Fundamental II', turno: 'Manhã',
    disciplina: 'Matemática', alunos: [
      { id: 'A601', nome: 'Ana Exemplo', matricula: 'A-0601' },
      { id: 'A602', nome: 'Bruno Exemplo', matricula: 'A-0602' },
      { id: 'A603', nome: 'Camila Exemplo', matricula: 'A-0603' },
      { id: 'A604', nome: 'Daniel Exemplo', matricula: 'A-0604' },
      { id: 'A605', nome: 'Eduarda Exemplo', matricula: 'A-0605' },
    ],
  },
  {
    id: '7B', nome: '7º ano B', etapa: 'Ensino Fundamental II', turno: 'Tarde',
    disciplina: 'Matemática', alunos: [
      { id: 'B701', nome: 'Felipe Exemplo', matricula: 'B-0701' },
      { id: 'B702', nome: 'Gabriela Exemplo', matricula: 'B-0702' },
      { id: 'B703', nome: 'Heitor Exemplo', matricula: 'B-0703' },
      { id: 'B704', nome: 'Isabela Exemplo', matricula: 'B-0704' },
    ],
  },
];

const CHAVE = 'ancora-registros-professor';

export function lerRegistros() {
  try { return JSON.parse(localStorage.getItem(CHAVE) || '{}'); }
  catch { return {}; }
}

export function salvarRegistros(registros) {
  localStorage.setItem(CHAVE, JSON.stringify(registros));
}
