import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const saveSchema = z.object({ body: z.object({ classId: z.uuid(), studentId: z.uuid(), subject: z.string().trim().min(1).max(100), assessment: z.string().trim().min(1).max(120), period: z.string().trim().min(1).max(40), value: z.coerce.number().min(0).max(10) }) });
router.use(authenticate);

router.get('/', async (req, res) => {
  const { classId } = req.query;
  if (!classId) return res.status(400).json({ error: 'Informe classId.' });
  const { rows } = await pool.query(
    `SELECT g.id, g.class_id, g.student_id, st.name AS student_name, g.subject, g.assessment, g.period, g.value, g.updated_at
     FROM grades g JOIN students st ON st.id = g.student_id JOIN classes c ON c.id = g.class_id
     WHERE c.id = $1 AND ($2 = 'admin' OR c.school_id = $3)
       AND ($2 <> 'teacher' OR c.teacher_id = $4) ORDER BY st.name, g.period, g.assessment`,
    [classId, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ notas: rows });
});

router.put('/', allowRoles('teacher'), validate(saveSchema), async (req, res) => {
  const grade = req.validated.body;
  const { rows: [saved] } = await pool.query(
    `INSERT INTO grades (class_id, student_id, subject, assessment, period, value, created_by)
     SELECT c.id, cs.student_id, $3, $4, $5, $6, $7 FROM classes c
     JOIN class_students cs ON cs.class_id = c.id
     WHERE c.id = $1 AND c.teacher_id = $7 AND cs.student_id = $2 AND c.is_active
     ON CONFLICT (class_id, student_id, assessment, period) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING id, class_id, student_id, subject, assessment, period, value`,
    [grade.classId, grade.studentId, grade.subject, grade.assessment, grade.period, grade.value, req.user.id],
  );
  if (!saved) return res.status(403).json({ error: 'Turma ou aluno não vinculado ao seu perfil.' });
  res.json({ nota: saved });
});

export default router;
