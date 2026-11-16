import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', allowRoles('admin', 'director', 'social'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.aluno_id AS student_id, a.nome_aluno AS student_name,
       i.alerta_id AS alert_id, i.tipo AS kind, i.descricao AS description,
       i.resultado AS outcome, i.data_ocorrencia AS occurred_at,
       i.data_retorno AS follow_up_at, i.registro AS created_at,
       u.nome_usuario AS created_by_name
     FROM INTERVENCAO i JOIN ALUNO a ON a.id = i.aluno_id
     JOIN USUARIO u ON u.id = i.registrada_por
     WHERE ($1 = 'admin' OR a.escola_id = $2)
     ORDER BY i.registro DESC LIMIT 500`, [req.user.role, req.user.schoolId],
  );
  res.json({ intervencoes: rows });
});

const createSchema = z.object({ body: z.object({ studentId: z.uuid(), alertId: z.uuid().optional(), kind: z.string().trim().min(2).max(80), description: z.string().trim().min(5).max(4000), occurredAt: z.iso.date().optional(), outcome: z.string().trim().max(2000).optional(), followUpAt: z.iso.date().optional() }) });
router.post('/', allowRoles('social', 'director'), validate(createSchema), async (req, res) => {
  const item = req.validated.body;
  const { rows: [created] } = await pool.query(
    `INSERT INTO INTERVENCAO (aluno_id, alerta_id, registrada_por, tipo, descricao, data_ocorrencia, resultado, data_retorno)
     SELECT a.id, al.id, $3, $4, $5, $6, $7, $8 FROM ALUNO a
     LEFT JOIN ALERTA al ON al.id = $2 AND al.aluno_id = a.id
     WHERE a.id = $1 AND a.escola_id = $9 AND a.status_aluno
       AND ($2::uuid IS NULL OR al.id IS NOT NULL)
     RETURNING id, aluno_id AS student_id, alerta_id AS alert_id, tipo AS kind,
       descricao AS description, data_ocorrencia AS occurred_at, resultado AS outcome,
       data_retorno AS follow_up_at, registro AS created_at`,
    [item.studentId, item.alertId || null, req.user.id, item.kind, item.description, item.occurredAt || new Date().toISOString().slice(0, 10), item.outcome || null, item.followUpAt || null, req.user.schoolId],
  );
  if (!created) return res.status(404).json({ error: 'Aluno ou alerta não encontrado nesta escola.' });
  res.status(201).json({ intervencao: created });
});

export default router;
