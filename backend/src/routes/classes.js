import { Router } from 'express';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createSchema = z.object({ body: z.object({ schoolId: z.uuid().optional(), teacherId: z.uuid(), name: z.string().trim().min(2).max(80), gradeLevel: z.string().trim().min(1).max(40), shift: z.enum(['morning', 'afternoon', 'evening']), subject: z.string().trim().min(1).max(100), academicYear: z.coerce.number().int().min(2000).max(2200).optional() }) });

router.post('/', allowRoles('admin', 'director'), validate(createSchema), async (req, res) => {
  const item = req.validated.body;
  const schoolId = req.user.role === 'admin' ? item.schoolId : req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'Informe a escola da turma.' });
  const { rows: [teacher] } = await pool.query(
    "SELECT id FROM users WHERE id = $1 AND role = 'teacher' AND school_id = $2 AND is_active", [item.teacherId, schoolId],
  );
  if (!teacher) return res.status(400).json({ error: 'O professor deve estar ativo e vinculado à mesma escola.' });
  try {
    const { rows: [created] } = await pool.query(
      `INSERT INTO classes (school_id, teacher_id, name, grade_level, shift, subject, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, school_id, teacher_id, name, grade_level, shift, subject, academic_year`,
      [schoolId, teacher.id, item.name, item.gradeLevel, item.shift, item.subject, item.academicYear || new Date().getFullYear()],
    );
    res.status(201).json({ turma: created });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Esta turma já está cadastrada para o ano letivo.' });
    throw error;
  }
});

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.grade_level, c.shift, c.subject, c.academic_year, c.school_id,
      s.name AS school_name, COUNT(cs.student_id)::int AS student_count
     FROM classes c JOIN schools s ON s.id = c.school_id
     LEFT JOIN class_students cs ON cs.class_id = c.id
     WHERE c.is_active AND ($1 = 'admin' OR c.school_id = $2)
       AND ($1 <> 'teacher' OR c.teacher_id = $3)
     GROUP BY c.id, s.name ORDER BY c.name`, [req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ turmas: rows });
});

router.get('/:id/alunos', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT st.id, st.name, st.enrollment FROM classes c
     JOIN class_students cs ON cs.class_id = c.id JOIN students st ON st.id = cs.student_id
     WHERE c.id = $1 AND c.is_active AND st.is_active
       AND ($2 = 'admin' OR c.school_id = $3)
       AND ($2 <> 'teacher' OR c.teacher_id = $4)
     ORDER BY st.name`, [req.params.id, req.user.role, req.user.schoolId, req.user.id],
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
      'SELECT id, school_id FROM classes WHERE id = $1 AND ($2 = \'admin\' OR school_id = $3) AND is_active',
      [classId, req.user.role, req.user.schoolId],
    );
    if (!classRow) return null;
    const { rows: students } = await client.query(
      'SELECT id FROM students WHERE id = ANY($1::uuid[]) AND school_id = $2 AND is_active', [ids, classRow.school_id],
    );
    if (students.length !== ids.length) return false;
    for (const studentId of ids) await client.query('INSERT INTO class_students (class_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [classId, studentId]);
    return ids.length;
  });
  if (added === null) return res.status(404).json({ error: 'Turma não encontrada nesta escola.' });
  if (added === false) return res.status(400).json({ error: 'Um ou mais alunos não estão ativos nesta escola.' });
  res.status(201).json({ matriculasCriadas: added });
});

export default router;
