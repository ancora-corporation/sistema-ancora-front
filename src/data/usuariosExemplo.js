// DADOS FICTÍCIOS, só para montar a tela.
// Nunca colocar dados reais de pessoas neste repositório.
//
// nivel: 1 = Assistência social | 2 = Direção | 3 = Administrador | 4 = Professor
// escolaId e escola ficam vazios para quem não é vinculado a uma escola
export const usuariosExemplo = [
  { id: 1, nome: 'Usuário Exemplo 01', matricula: 'F-0001', email: 'usuario01@example.com', telefone: '(00) 90000-0001', nivel: 3, escolaId: null, escola: null },
  { id: 2, nome: 'Usuário Exemplo 02', matricula: 'F-0002', email: 'usuario02@example.com', telefone: '(00) 90000-0002', nivel: 2, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
  { id: 3, nome: 'Usuário Exemplo 03', matricula: 'F-0003', email: 'usuario03@example.com', telefone: '(00) 90000-0003', nivel: 1, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
  { id: 4, nome: 'Usuário Exemplo 04', matricula: 'F-0004', email: 'usuario04@example.com', telefone: '(00) 90000-0004', nivel: 2, escolaId: 2, escola: 'Escola Municipal Exemplo B' },
  { id: 5, nome: 'Usuário Exemplo 05', matricula: 'F-0005', email: 'usuario05@example.com', telefone: '(00) 90000-0005', nivel: 1, escolaId: 2, escola: 'Escola Municipal Exemplo B' },
  { id: 6, nome: 'Usuário Exemplo 06', matricula: 'F-0006', email: 'usuario06@example.com', telefone: '(00) 90000-0006', nivel: 2, escolaId: 3, escola: 'Escola Municipal Exemplo C' },
  { id: 7, nome: 'Usuário Exemplo 07', matricula: 'F-0007', email: 'usuario07@example.com', telefone: '(00) 90000-0007', nivel: 1, escolaId: 3, escola: 'Escola Municipal Exemplo C' },
  { id: 8, nome: 'Usuário Exemplo 08', matricula: 'F-0008', email: 'usuario08@example.com', telefone: '(00) 90000-0008', nivel: 1, escolaId: 3, escola: 'Escola Municipal Exemplo C' },
  { id: 9, nome: 'Usuário Exemplo 09', matricula: 'F-0009', email: 'usuario09@example.com', telefone: '(00) 90000-0009', nivel: 2, escolaId: 4, escola: 'Escola Municipal Exemplo D' },
  { id: 10, nome: 'Usuário Exemplo 10', matricula: 'F-0010', email: 'usuario10@example.com', telefone: '(00) 90000-0010', nivel: 1, escolaId: 4, escola: 'Escola Municipal Exemplo D' },
  { id: 11, nome: 'Usuário Exemplo 11', matricula: 'F-0011', email: 'usuario11@example.com', telefone: '(00) 90000-0011', nivel: 2, escolaId: 5, escola: 'Escola Municipal Exemplo E' },
  { id: 12, nome: 'Usuário Exemplo 12', matricula: 'F-0012', email: 'usuario12@example.com', telefone: '(00) 90000-0012', nivel: 1, escolaId: 6, escola: 'Escola Municipal Exemplo F' },
  { id: 13, nome: 'Professora Exemplo', matricula: 'P-0001', email: 'professor@ancora.com', telefone: '(00) 90000-0013', nivel: 4, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
  { id: 14, nome: 'Assistente Social Exemplo', matricula: 'S-0001', email: 'social@ancora.com', telefone: '(00) 90000-0014', nivel: 1, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
  { id: 15, nome: 'Diretor Exemplo', matricula: 'D-0001', email: 'diretor@ancora.com', telefone: '(00) 90000-0015', nivel: 2, escolaId: 1, escola: 'Escola Municipal Exemplo A' },
];
