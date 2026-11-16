import { Router } from 'express';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const date = z.iso.date();
const saveSchema = z.object({ body: z.object({
  classId: z.uuid(), lessonDate: date,
  records: z.array(z.object({ studentId: z.uuid(), status: z.enum(['present', 'absent', 'excused']), note: z.string().max(500).optional() })).min(1).max(100),
}) });
router.use(authenticate);

router.get('/', async (req, res) => {
  const { classId, lessonDate } = req.query;
  if (!classId || !lessonDate) return res.status(400).json({ error: 'Informe classId e lessonDate.' });
  const { rows } = await pool.query(
    `SELECT ss.id AS session_id, ss.lesson_date, ar.student_id, st.name AS student_name, ar.status, ar.note
     FROM attendance_sessions ss JOIN classes c ON c.id = ss.class_id
     JOIN attendance_records ar ON ar.session_id = ss.id JOIN students st ON st.id = ar.student_id
     WHERE c.id = $1 AND ss.lesson_date = $2
       AND ($3 = 'admin' OR c.school_id = $4)
       AND ($3 <> 'teacher' OR c.teacher_id = $5)
     ORDER BY st.name`, [classId, lessonDate, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ chamada: rows });
});

router.put('/', allowRoles('teacher'), validate(saveSchema), async (req, res) => {
  const { classId, lessonDate, records } = req.validated.body;
  const uniqueIds = new Set(records.map(({ studentId }) => studentId));
  if (uniqueIds.size !== records.length) return res.status(400).json({ error: 'Há alunos repetidos na chamada.' });
  const saved = await inTransaction(async (client) => {
    const { rows: [classRow] } = await client.query('SELECT id FROM classes WHERE id = $1 AND teacher_id = $2 AND is_active', [classId, req.user.id]);
    if (!classRow) return null;
    const { rows: enrolled } = await client.query(
      'SELECT student_id FROM class_students WHERE class_id = $1 AND student_id = ANY($2::uuid[])', [classId, [...uniqueIds]],
    );
    if (enrolled.length !== records.length) return false;
    const { rows: [session] } = await client.query(
      `INSERT INTO attendance_sessions (class_id, lesson_date, created_by) VALUES ($1, $2, $3)
       ON CONFLICT (class_id, lesson_date) DO UPDATE SET created_by = EXCLUDED.created_by RETURNING id`,
      [classId, lessonDate, req.user.id],
    );
    for (const record of records) {
      await client.query(
        `INSERT INTO attendance_records (session_id, student_id, status, note) VALUES ($1, $2, $3, $4)
         ON CONFLICT (session_id, student_id) DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, marked_at = NOW()`,
        [session.id, record.studentId, record.status, record.note || null],
      );
    }
    return session.id;
  });
  if (saved === null) return res.status(403).json({ error: 'Esta turma não está vinculada ao seu perfil.' });
  if (saved === false) return res.status(400).json({ error: 'A chamada contém alunos de outra turma.' });
  res.json({ sessionId: saved, registrosSalvos: records.length });
});

export default router;
