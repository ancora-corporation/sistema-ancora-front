import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool } from './pool.js';

if (env.SEED_DEMO !== 'true' || env.NODE_ENV === 'production') {
  console.error('Seed bloqueado. Use SEED_DEMO=true fora de produção.');
  process.exit(1);
}

const schoolCode = 'EM-001';
const demoUsers = [
  ['Administrador Exemplo', 'admin@ancora.com', 'administrador'],
  ['Diretor Exemplo', 'diretor@ancora.com', 'diretor'],
  ['Assistente Social Exemplo', 'social@ancora.com', 'assistente_social'],
  ['Professora Exemplo', 'professor@ancora.com', 'professor'],
];

try {
  const passwordHash = await bcrypt.hash('123456', 12);
  const { rows: [school] } = await pool.query(
    `INSERT INTO ESCOLA (nome_escola, codigo_escola, bairro_escola)
     VALUES ('Escola Municipal Exemplo A', $1, 'Bairro Centro')
     ON CONFLICT (codigo_escola) DO UPDATE SET nome_escola = EXCLUDED.nome_escola
     RETURNING id`, [schoolCode],
  );
  const users = {};
  for (const [name, email, role] of demoUsers) {
    const { rows: [user] } = await pool.query(
      `INSERT INTO USUARIO (nome_usuario, email, senha_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nome_usuario = EXCLUDED.nome_usuario,
         senha_hash = EXCLUDED.senha_hash, status_usuario = TRUE
       RETURNING id`, [name, email, passwordHash],
    );
    users[email] = user.id;
    if (role === 'administrador') await pool.query('INSERT INTO ADMINISTRADOR (id_usuario) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
    if (role === 'diretor') await pool.query('INSERT INTO DIRETOR (id_usuario, id_escola) VALUES ($1, $2) ON CONFLICT (id_usuario) DO UPDATE SET id_escola = EXCLUDED.id_escola', [user.id, school.id]);
    if (role === 'professor') await pool.query('INSERT INTO PROFESSOR (id_usuario, id_escola) VALUES ($1, $2) ON CONFLICT (id_usuario) DO UPDATE SET id_escola = EXCLUDED.id_escola', [user.id, school.id]);
    if (role === 'assistente_social') await pool.query('INSERT INTO ASSISTENTE_SOCIAL (id_usuario, id_escola) VALUES ($1, $2) ON CONFLICT (id_usuario) DO UPDATE SET id_escola = EXCLUDED.id_escola', [user.id, school.id]);
  }
  await pool.query(
    'UPDATE ESCOLA SET diretor_responsavel_id = $2 WHERE id = $1',
    [school.id, users['diretor@ancora.com']],
  );

  const classes = [];
  for (const [name, grade, shift, subject] of [
    ['6º ano A', '6º ano', 'manha', 'Matemática'],
    ['7º ano B', '7º ano', 'tarde', 'Matemática'],
  ]) {
    const { rows: [classRow] } = await pool.query(
      `INSERT INTO TURMA (escola_id, nome_turma, ano_serie, turno, ano_letivo)
       VALUES ($1, $2, $3, $4, EXTRACT(YEAR FROM CURRENT_DATE)::smallint)
       ON CONFLICT (escola_id, nome_turma, ano_letivo) DO UPDATE SET status_turma = TRUE
       RETURNING id`, [school.id, name, grade, shift],
    );
    await pool.query(
      `INSERT INTO DISCIPLINA (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET ativa = TRUE RETURNING id`, [subject],
    );
    const { rows: [disciplina] } = await pool.query('SELECT id FROM DISCIPLINA WHERE nome = $1', [subject]);
    await pool.query(
      `INSERT INTO LOTACAO (id_professor, id_turma, id_disciplina, ano_letivo)
       VALUES ($1, $2, $3, EXTRACT(YEAR FROM CURRENT_DATE)::smallint) ON CONFLICT DO NOTHING`,
      [users['professor@ancora.com'], classRow.id, disciplina.id],
    );
    classes.push(classRow.id);
  }

  const demoStudents = [
    ['Ana Exemplo', classes[0]], ['Bruno Exemplo', classes[0]],
    ['Camila Exemplo', classes[0]], ['Daniel Exemplo', classes[0]],
    ['Eduarda Exemplo', classes[0]], ['Felipe Exemplo', classes[1]],
    ['Gabriela Exemplo', classes[1]], ['Heitor Exemplo', classes[1]],
    ['Isabela Exemplo', classes[1]],
  ];
  const students = [];
  for (const [name, classId] of demoStudents) {
    let { rows: [student] } = await pool.query(
      'SELECT id, matricula FROM ALUNO WHERE escola_id = $1 AND nome_aluno = $2 LIMIT 1', [school.id, name],
    );
    if (!student) {
      ({ rows: [student] } = await pool.query(
        'INSERT INTO ALUNO (escola_id, nome_aluno) VALUES ($1, $2) RETURNING id, matricula', [school.id, name],
      ));
    }
    await pool.query(
      `INSERT INTO ALUNO_TURMA (turma_id, aluno_id) VALUES ($1, $2)
       ON CONFLICT (turma_id, aluno_id) DO UPDATE SET
         data_matricula = CASE WHEN ALUNO_TURMA.data_saida IS NOT NULL THEN CURRENT_DATE ELSE ALUNO_TURMA.data_matricula END,
         data_saida = NULL`, [classId, student.id],
    );
    students.push({ name, id: student.id, classId });
  }

  const { rows: [session] } = await pool.query(
    `INSERT INTO CHAMADA (turma_id, id_lotacao, data_aula, registrada_por)
     SELECT $1, id, CURRENT_DATE, $2 FROM LOTACAO WHERE id_turma = $1 AND id_professor = $2
     ORDER BY id LIMIT 1 ON CONFLICT (id_lotacao, data_aula) WHERE id_lotacao IS NOT NULL
     DO UPDATE SET registrada_por = EXCLUDED.registrada_por RETURNING id`,
    [classes[0], users['professor@ancora.com']],
  );
  for (const [index, student] of students.filter((item) => item.classId === classes[0]).entries()) {
    await pool.query(
      `INSERT INTO REGISTRO_CHAMADA (chamada_id, aluno_id, situacao, observacao) VALUES ($1, $2, $3, $4)
       ON CONFLICT (chamada_id, aluno_id) DO UPDATE SET situacao = EXCLUDED.situacao, observacao = EXCLUDED.observacao`,
      [session.id, student.id, index === 3 ? 'ausente' : 'presente', index === 3 ? 'Ausência demonstrativa' : null],
    );
  }

  const ana = students.find((student) => student.name === 'Ana Exemplo');
  for (const [index, value] of [8, 8.5, 9, 9.5].entries()) {
    await pool.query(
      `INSERT INTO NOTA (turma_id, aluno_id, id_lotacao, disciplina, avaliacao, periodo, valor, registrada_por)
       SELECT $1, $2, l.id, d.nome, $4, EXTRACT(YEAR FROM CURRENT_DATE)::text, $5, $3
       FROM LOTACAO l JOIN DISCIPLINA d ON d.id = l.id_disciplina WHERE l.id_turma = $1 AND l.id_professor = $3 AND d.nome = 'Matemática'
       ON CONFLICT (turma_id, aluno_id, disciplina, avaliacao, periodo) DO UPDATE SET id_lotacao = EXCLUDED.id_lotacao, valor = EXCLUDED.valor, atualizacao = NOW()`,
      [classes[0], ana.id, users['professor@ancora.com'], `Avaliação ${index + 1}`, value],
    );
  }

  for (const [studentName, status, level, score, summary, dueOffset] of [
    ['Daniel Exemplo', 'novo', 'alto', 0.82, 'Ausências frequentes registradas nesta turma.', 5],
    ['Gabriela Exemplo', 'atrasado', 'medio', 0.61, 'Acompanhamento de frequência requer retorno da escola.', -2],
  ]) {
    const student = students.find((item) => item.name === studentName);
    const { rowCount } = await pool.query(
      'SELECT 1 FROM ALERTA WHERE aluno_id = $1 AND origem = \'manual\' AND resumo = $2', [student.id, summary],
    );
    if (!rowCount) {
      await pool.query(
        `INSERT INTO ALERTA (aluno_id, tipo, situacao, nivel_risco, pontuacao_risco, origem, resumo, prazo)
         VALUES ($1, 'frequencia', $2, $3, $4, 'manual', $5, CURRENT_DATE + $6::int)`,
        [student.id, status, level, score, summary, dueOffset],
      );
    }
  }
  console.log('Dados demonstrativos criados. Senha de todos os acessos: 123456');
} catch (error) {
  console.error('Falha ao criar dados demonstrativos:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
