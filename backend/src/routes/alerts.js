import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { status, risk, studentId } = req.query;
  if (studentId && !z.uuid().safeParse(studentId).success) return res.status(400).json({ error: 'studentId inválido.' });
  const { rows } = await pool.query(
    `SELECT a.id, a.student_id, st.name AS student_name, st.enrollment, s.name AS school_name, s.code AS school_code, s.district,
       a.kind, a.status, a.risk_level, a.risk_score, a.source, a.model_version, a.summary, a.due_at, a.created_at,
       intervention.name AS intervention_by, intervention.kind AS intervention_kind,
       intervention.description AS intervention_description, intervention.outcome AS intervention_outcome,
       intervention.occurred_at AS intervention_occurred_at, intervention.follow_up_at AS intervention_follow_up_at,
       student_class.name AS class_name
     FROM alerts a JOIN students st ON st.id = a.student_id JOIN schools s ON s.id = st.school_id
     LEFT JOIN LATERAL (SELECT u.name, i.kind, i.description, i.outcome, i.occurred_at, i.follow_up_at FROM interventions i JOIN users u ON u.id = i.created_by WHERE i.alert_id = a.id ORDER BY i.created_at DESC LIMIT 1) intervention ON TRUE
     LEFT JOIN LATERAL (SELECT c.name FROM class_students cs JOIN classes c ON c.id = cs.class_id WHERE cs.student_id = st.id AND c.is_active ORDER BY c.academic_year DESC LIMIT 1) student_class ON TRUE
     WHERE ($1 = 'admin' OR st.school_id = $2)
       AND ($1 <> 'teacher' OR EXISTS (SELECT 1 FROM class_students cs JOIN classes c ON c.id = cs.class_id WHERE cs.student_id = st.id AND c.teacher_id = $3))
       AND ($4::text IS NULL OR a.status = $4) AND ($5::text IS NULL OR a.risk_level = $5)
       AND ($6::uuid IS NULL OR a.student_id = $6)
     ORDER BY a.created_at DESC LIMIT 500`,
    [req.user.role, req.user.schoolId, req.user.id, status || null, risk || null, studentId || null],
  );
  res.json({ alertas: rows });
});

const statusSchema = z.object({ body: z.object({ status: z.enum(['new', 'in_progress', 'resolved', 'overdue']) }) });
router.patch('/:id/status', allowRoles('admin', 'director', 'social'), validate(statusSchema), async (req, res) => {
  const { rows: [alert] } = await pool.query(
    `UPDATE alerts a SET status = $2, updated_at = NOW() FROM students st
     WHERE a.id = $1 AND st.id = a.student_id AND ($3 = 'admin' OR st.school_id = $4)
     RETURNING a.id, a.status, a.updated_at`, [req.params.id, req.validated.body.status, req.user.role, req.user.schoolId],
  );
  if (!alert) return res.status(404).json({ error: 'Alerta não encontrado.' });
  res.json({ alerta: alert });
});

export default router;
