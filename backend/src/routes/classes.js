import { Router } from 'express';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);
const shiftToDatabase = { morning: 'manha', afternoon: 'tarde', evening: 'noite' };
const shiftToApi = { manha: 'morning', tarde: 'afternoon', noite: 'evening' };

const createSchema = z.object({ body: z.object({ schoolId: z.uuid().optional(), teacherId: z.uuid(), name: z.string().trim().min(2).max(80), gradeLevel: z.string().trim().min(1).max(40), shift: z.enum(['morning', 'afternoon', 'evening']), subject: z.string().trim().min(1).max(100), academicYear: z.coerce.number().int().min(2000).max(2200).optional() }) });
const lotacaoSchema = z.object({ params: z.object({ id: z.uuid() }), body: z.object({ teacherId: z.uuid(), subject: z.string().trim().min(1).max(100) }) });

router.post('/', allowRoles('admin', 'director'), validate(createSchema), async (req, res) => {
  const item = req.validated.body;
  const schoolId = req.user.role === 'admin' ? item.schoolId : req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'Informe a escola da turma.' });
  const { rows: [teacher] } = await pool.query(
    `SELECT p.id_usuario AS id FROM PROFESSOR p JOIN USUARIO u ON u.id = p.id_usuario
     WHERE p.id_usuario = $1 AND p.id_escola = $2 AND u.status_usuario`,
    [item.teacherId, schoolId],
  );
  if (!teacher) return res.status(400).json({ error: 'O professor deve estar ativo e vinculado à mesma escola.' });
  try {
    const created = await inTransaction(async (client) => {
      const { rows: [turma] } = await client.query(
        `INSERT INTO TURMA (escola_id, nome_turma, ano_serie, turno, ano_letivo)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, escola_id, nome_turma, ano_serie, turno, ano_letivo`,
        [schoolId, item.name, item.gradeLevel, shiftToDatabase[item.shift], item.academicYear || new Date().getFullYear()],
      );
      const { rows: [disciplina] } = await client.query(
        `INSERT INTO DISCIPLINA (nome) VALUES ($1)
         ON CONFLICT (nome) DO UPDATE SET ativa = TRUE RETURNING id, nome`, [item.subject],
      );
      const { rows: [lotacao] } = await client.query(
        `INSERT INTO LOTACAO (id_professor, id_turma, id_disciplina, ano_letivo)
         VALUES ($1, $2, $3, $4) RETURNING id`, [teacher.id, turma.id, disciplina.id, turma.ano_letivo],
      );
      return { turma, lotacao, disciplina };
    });
    res.status(201).json({ turma: { ...created.turma, id: created.turma.id, name: created.turma.nome_turma, grade_level: created.turma.ano_serie, shift: shiftToApi[created.turma.turno], school_id: created.turma.escola_id, academic_year: created.turma.ano_letivo, subject: created.disciplina.nome, teacher_id: teacher.id, lotacao_id: created.lotacao.id } });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Esta turma já está cadastrada para o ano letivo.' });
    throw error;
  }
});

router.post('/:id/lotacoes', allowRoles('admin', 'director'), validate(lotacaoSchema), async (req, res) => {
  const { id: classId } = req.validated.params;
  const { teacherId, subject } = req.validated.body;
  const { rows: [turma] } = await pool.query(
    `SELECT id, escola_id, ano_letivo FROM TURMA
     WHERE id = $1 AND status_turma AND ($2 = 'admin' OR escola_id = $3)`,
    [classId, req.user.role, req.user.schoolId],
  );
  if (!turma) return res.status(404).json({ error: 'Turma não encontrada nesta escola.' });
  const { rowCount } = await pool.query(
    `SELECT 1 FROM PROFESSOR p JOIN USUARIO u ON u.id = p.id_usuario
     WHERE p.id_usuario = $1 AND p.id_escola = $2 AND u.status_usuario`, [teacherId, turma.escola_id],
  );
  if (!rowCount) return res.status(400).json({ error: 'O professor deve estar ativo e vinculado à mesma escola.' });
  try {
    const lotacao = await inTransaction(async (client) => {
      const { rows: [disciplina] } = await client.query(
        'INSERT INTO DISCIPLINA (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET ativa = TRUE RETURNING id, nome', [subject],
      );
      const { rows: [created] } = await client.query(
        `INSERT INTO LOTACAO (id_professor, id_turma, id_disciplina, ano_letivo)
         VALUES ($1, $2, $3, $4) RETURNING id, id_professor AS teacher_id,
           id_turma AS class_id, id_disciplina AS discipline_id, ano_letivo AS academic_year`,
        [teacherId, classId, disciplina.id, turma.ano_letivo],
      );
      return { ...created, subject: disciplina.nome };
    });
    return res.status(201).json({ lotacao });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Este professor já está lotado nesta disciplina e turma para o ano letivo.' });
    throw error;
  }
});

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.id, t.nome_turma AS name, t.ano_serie AS grade_level,
       CASE t.turno WHEN 'manha' THEN 'morning' WHEN 'tarde' THEN 'afternoon' WHEN 'noite' THEN 'evening' END AS shift,
       string_agg(DISTINCT d.nome, ', ' ORDER BY d.nome) AS subject,
       string_agg(DISTINCT l.id_professor::text, ',') FILTER (WHERE $1 <> 'teacher' OR l.id_professor = $3) AS teacher_ids,
       COALESCE(json_agg(DISTINCT jsonb_build_object(
         'id', l.id, 'teacher_id', l.id_professor, 'discipline_id', d.id,
         'subject', d.nome, 'academic_year', l.ano_letivo
       )) FILTER (WHERE l.id IS NOT NULL AND ($1 <> 'teacher' OR l.id_professor = $3)), '[]'::json) AS lotacoes,
       t.ano_letivo AS academic_year, t.escola_id AS school_id,
       e.nome_escola AS school_name, COUNT(DISTINCT at.aluno_id)::int AS student_count
     FROM TURMA t JOIN ESCOLA e ON e.id = t.escola_id
     LEFT JOIN ALUNO_TURMA at ON at.turma_id = t.id
     LEFT JOIN LOTACAO l ON l.id_turma = t.id AND l.ativa AND l.ano_letivo = t.ano_letivo
     LEFT JOIN DISCIPLINA d ON d.id = l.id_disciplina AND d.ativa
     WHERE t.status_turma AND ($1 = 'admin' OR t.escola_id = $2)
       AND ($1 <> 'teacher' OR EXISTS (SELECT 1 FROM LOTACAO mine WHERE mine.id_turma = t.id AND mine.id_professor = $3 AND mine.ativa AND mine.ano_letivo = t.ano_letivo))
     GROUP BY t.id, e.nome_escola ORDER BY t.nome_turma`, [req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ turmas: rows });
});

router.get('/:id/alunos', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.id, a.nome_aluno AS name, a.matricula AS enrollment
     FROM TURMA t JOIN ALUNO_TURMA at ON at.turma_id = t.id
     JOIN ALUNO a ON a.id = at.aluno_id
     WHERE t.id = $1 AND t.status_turma AND a.status_aluno
       AND ($2 = 'admin' OR t.escola_id = $3)
       AND ($2 <> 'teacher' OR EXISTS (SELECT 1 FROM LOTACAO mine WHERE mine.id_turma = t.id AND mine.id_professor = $4 AND mine.ativa AND mine.ano_letivo = t.ano_letivo))
     ORDER BY a.nome_aluno`, [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ alunos: rows });
});

const enrollmentSchema = z.object({ params: z.object({ id: z.uuid() }), body: z.object({ studentIds: z.array(z.uuid()).min(1).max(100) }) });
router.post('/:id/alunos', allowRoles('admin', 'director'), validate(enrollmentSchema), async (req, res) => {
  const { id: classId } = req.validated.params;
  const { studentIds } = req.validated.body;
  const ids = [...new Set(studentIds)];
  if (ids.length !== studentIds.length) return res.status(400).json({ error: 'A lista contém alunos repetidos.' });
  const added = await inTransaction(async (client) => {
    const { rows: [classRow] } = await client.query(
      `SELECT id, escola_id FROM TURMA WHERE id = $1 AND ($2 = 'admin' OR escola_id = $3) AND status_turma`,
      [classId, req.user.role, req.user.schoolId],
    );
    if (!classRow) return null;
    const { rows: students } = await client.query(
      'SELECT id FROM ALUNO WHERE id = ANY($1::uuid[]) AND escola_id = $2 AND status_aluno', [ids, classRow.escola_id],
    );
    if (students.length !== ids.length) return false;
    for (const studentId of ids) await client.query('INSERT INTO ALUNO_TURMA (turma_id, aluno_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [classId, studentId]);
    return ids.length;
  });
  if (added === null) return res.status(404).json({ error: 'Turma não encontrada nesta escola.' });
  if (added === false) return res.status(400).json({ error: 'Um ou mais alunos não estão ativos nesta escola.' });
  res.status(201).json({ matriculasCriadas: added });
});

export default router;
