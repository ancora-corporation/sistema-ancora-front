import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', allowRoles('admin', 'director', 'social'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.student_id, st.name AS student_name, i.alert_id, i.kind, i.description, i.outcome, i.occurred_at, i.follow_up_at, i.created_at, u.name AS created_by_name
     FROM interventions i JOIN students st ON st.id = i.student_id JOIN users u ON u.id = i.created_by
     WHERE ($1 = 'admin' OR st.school_id = $2) ORDER BY i.created_at DESC LIMIT 500`, [req.user.role, req.user.schoolId],
  );
  res.json({ intervencoes: rows });
});

const createSchema = z.object({ body: z.object({ studentId: z.uuid(), alertId: z.uuid().optional(), kind: z.string().trim().min(2).max(80), description: z.string().trim().min(5).max(4000), occurredAt: z.iso.date().optional(), outcome: z.string().trim().max(2000).optional(), followUpAt: z.iso.date().optional() }) });
router.post('/', allowRoles('social', 'director'), validate(createSchema), async (req, res) => {
  const item = req.validated.body;
  const { rows: [created] } = await pool.query(
    `INSERT INTO interventions (student_id, alert_id, created_by, kind, description, occurred_at, outcome, follow_up_at)
     SELECT st.id, a.id, $3, $4, $5, $6, $7, $8 FROM students st
     LEFT JOIN alerts a ON a.id = $2 AND a.student_id = st.id
     WHERE st.id = $1 AND st.school_id = $9 AND st.is_active
       AND ($2::uuid IS NULL OR a.id IS NOT NULL)
     RETURNING id, student_id, alert_id, kind, description, occurred_at, outcome, follow_up_at, created_at`,
    [item.studentId, item.alertId || null, req.user.id, item.kind, item.description, item.occurredAt || new Date().toISOString().slice(0, 10), item.outcome || null, item.followUpAt || null, req.user.schoolId],
  );
  if (!created) return res.status(404).json({ error: 'Aluno ou alerta não encontrado nesta escola.' });
  res.status(201).json({ intervencao: created });
});

export default router;
