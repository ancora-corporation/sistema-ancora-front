import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool } from './pool.js';

if (env.SEED_DEMO !== 'true' || env.NODE_ENV === 'production') {
  console.error('Seed bloqueado. Use SEED_DEMO=true fora de produção.');
  process.exit(1);
}

const schoolCode = 'EM-001';
const demoUsers = [
  ['Administrador Exemplo', 'admin@ancora.com', 'admin', null],
  ['Diretor Exemplo', 'diretor@ancora.com', 'director', schoolCode],
  ['Assistente Social Exemplo', 'social@ancora.com', 'social', schoolCode],
  ['Professora Exemplo', 'professor@ancora.com', 'teacher', schoolCode],
];

try {
  const passwordHash = await bcrypt.hash('123456', 12);
  const { rows: [school] } = await pool.query(
    `INSERT INTO schools (name, code, district)
     VALUES ('Escola Municipal Exemplo A', $1, 'Bairro Centro')
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`, [schoolCode],
  );
  const users = {};
  for (const [name, email, role, code] of demoUsers) {
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (name, email, role, school_id, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role,
         school_id = EXCLUDED.school_id, password_hash = EXCLUDED.password_hash, is_active = TRUE
       RETURNING id`, [name, email, role, code ? school.id : null, passwordHash],
    );
    users[email] = user.id;
  }

  const classRows = [];
  for (const definition of [
    ['6º ano A', '6º ano', 'morning', 'Matemática'],
    ['7º ano B', '7º ano', 'afternoon', 'Matemática'],
  ]) {
    const { rows: [classRow] } = await pool.query(
      `INSERT INTO classes (school_id, teacher_id, name, grade_level, shift, subject, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, EXTRACT(YEAR FROM CURRENT_DATE)::smallint)
       ON CONFLICT (school_id, name, academic_year) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
       RETURNING id`, [school.id, users['professor@ancora.com'], ...definition],
    );
    classRows.push(classRow.id);
  }

  const students = [
    ['A-0601', 'Ana Exemplo', classRows[0]], ['A-0602', 'Bruno Exemplo', classRows[0]],
    ['A-0603', 'Camila Exemplo', classRows[0]], ['A-0604', 'Daniel Exemplo', classRows[0]],
    ['A-0605', 'Eduarda Exemplo', classRows[0]], ['B-0701', 'Felipe Exemplo', classRows[1]],
    ['B-0702', 'Gabriela Exemplo', classRows[1]], ['B-0703', 'Heitor Exemplo', classRows[1]],
    ['B-0704', 'Isabela Exemplo', classRows[1]],
  ];
  const seededStudents = [];
  for (const [enrollment, name, classId] of students) {
    const { rows: [student] } = await pool.query(
      `INSERT INTO students (school_id, enrollment, name) VALUES ($1, $2, $3)
       ON CONFLICT (enrollment) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [school.id, enrollment, name],
    );
    await pool.query('INSERT INTO class_students (class_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [classId, student.id]);
    seededStudents.push({ enrollment, id: student.id, classId });
  }

  const { rows: [session] } = await pool.query(
    `INSERT INTO attendance_sessions (class_id, lesson_date, created_by) VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (class_id, lesson_date) DO UPDATE SET created_by = EXCLUDED.created_by RETURNING id`,
    [classRows[0], users['professor@ancora.com']],
  );
  for (const [index, student] of seededStudents.filter((item) => item.classId === classRows[0]).entries()) {
    await pool.query(
      `INSERT INTO attendance_records (session_id, student_id, status, note) VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note`,
      [session.id, student.id, index === 3 ? 'absent' : 'present', index === 3 ? 'Ausência demonstrativa' : null],
    );
  }

  const ana = seededStudents.find((student) => student.enrollment === 'A-0601');
  await pool.query(
    `INSERT INTO grades (class_id, student_id, subject, assessment, period, value, created_by)
     VALUES ($1, $2, 'Matemática', 'Avaliação inicial', EXTRACT(YEAR FROM CURRENT_DATE)::text, 8.5, $3)
     ON CONFLICT (class_id, student_id, assessment, period) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [classRows[0], ana.id, users['professor@ancora.com']],
  );

  for (const [enrollment, status, level, score, summary, dueOffset] of [
    ['A-0604', 'new', 'high', 0.82, 'Ausências frequentes registradas nesta turma.', 5],
    ['B-0702', 'overdue', 'medium', 0.61, 'Acompanhamento de frequência requer retorno da escola.', -2],
  ]) {
    const student = seededStudents.find((item) => item.enrollment === enrollment);
    const { rowCount } = await pool.query(
      `SELECT 1 FROM alerts WHERE student_id = $1 AND source = 'manual' AND summary = $2`, [student.id, summary],
    );
    if (!rowCount) {
      await pool.query(
        `INSERT INTO alerts (student_id, kind, status, risk_level, risk_score, source, summary, due_at)
         VALUES ($1, 'attendance', $2, $3, $4, 'manual', $5, CURRENT_DATE + $6::int)`,
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
