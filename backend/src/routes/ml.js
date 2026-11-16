import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const runSchema = z.object({ body: z.object({ schoolId: z.uuid().optional(), classId: z.uuid().optional() }) });
const predictionSchema = z.object({ predictions: z.array(z.object({ studentId: z.uuid(), score: z.number().min(0).max(1), riskLevel: z.enum(['low', 'medium', 'high']), summary: z.string().min(1).max(1000) })), modelVersion: z.string().max(100).optional() });
router.use(authenticate, allowRoles('admin'));

router.post('/runs', validate(runSchema), async (req, res) => {
  if (!env.ML_SERVICE_URL) return res.status(503).json({ error: 'Serviço de ML ainda não configurado. Defina ML_SERVICE_URL quando o modelo estiver disponível.' });
  const { schoolId, classId } = req.validated.body;
  const { rows: features } = await pool.query(
    `SELECT st.id AS student_id, st.school_id,
       attendance.attendance_records, attendance.absences, attendance.excused_absences,
       grades.average_grade
     FROM students st
     LEFT JOIN LATERAL (
       SELECT COUNT(ar.student_id)::int AS attendance_records,
         COUNT(ar.student_id) FILTER (WHERE ar.status = 'absent')::int AS absences,
         COUNT(ar.student_id) FILTER (WHERE ar.status = 'excused')::int AS excused_absences
       FROM class_students cs JOIN classes c ON c.id = cs.class_id AND c.is_active
       JOIN attendance_sessions ss ON ss.class_id = c.id
       JOIN attendance_records ar ON ar.session_id = ss.id AND ar.student_id = st.id
       WHERE cs.student_id = st.id AND ($2::uuid IS NULL OR c.id = $2)
     ) attendance ON TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(AVG(g.value), 0)::numeric(4,2) AS average_grade
       FROM grades g JOIN classes c ON c.id = g.class_id AND c.is_active
       WHERE g.student_id = st.id AND ($2::uuid IS NULL OR c.id = $2)
     ) grades ON TRUE
     WHERE st.is_active AND ($1::uuid IS NULL OR st.school_id = $1)
       AND ($2::uuid IS NULL OR EXISTS (
         SELECT 1 FROM class_students cs JOIN classes c ON c.id = cs.class_id
         WHERE cs.student_id = st.id AND c.id = $2 AND c.is_active
       ))
     ORDER BY st.id LIMIT 5000`, [schoolId || null, classId || null],
  );
  if (!features.length) return res.status(404).json({ error: 'Nenhum aluno encontrado para gerar previsões.' });

  const { rows: [run] } = await pool.query(
    `INSERT INTO model_runs (model_name, status, input_summary) VALUES ('attendance-risk', 'running', $1::jsonb) RETURNING id`,
    [JSON.stringify({ students: features.length, schoolId: schoolId || null, classId: classId || null })],
  );
  try {
    const endpoint = `${env.ML_SERVICE_URL.replace(/\/$/, '')}/predict`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(env.ML_SERVICE_TOKEN ? { authorization: `Bearer ${env.ML_SERVICE_TOKEN}` } : {}) },
      body: JSON.stringify({ model: 'attendance-risk', features }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw Object.assign(new Error(`Serviço de ML respondeu ${response.status}.`), { status: 502 });
    const parsed = predictionSchema.safeParse(await response.json());
    if (!parsed.success) throw Object.assign(new Error('Resposta do serviço de ML fora do contrato.'), { status: 502 });
    const allowedStudents = new Set(features.map((item) => item.student_id));
    if (parsed.data.predictions.some((item) => !allowedStudents.has(item.studentId))) throw Object.assign(new Error('A resposta contém aluno fora do conjunto enviado.'), { status: 502 });
    for (const prediction of parsed.data.predictions) {
      await pool.query(
        `INSERT INTO alerts (student_id, kind, status, risk_level, risk_score, source, model_version, summary, model_run_id)
         VALUES ($1, 'combined', 'new', $2, $3, 'ml', $4, $5, $6)`,
        [prediction.studentId, prediction.riskLevel, prediction.score, parsed.data.modelVersion || null, prediction.summary, run.id],
      );
    }
    await pool.query(
      `UPDATE model_runs SET status = 'succeeded', model_version = $2, finished_at = NOW(), output_summary = $3::jsonb WHERE id = $1`,
      [run.id, parsed.data.modelVersion || null, JSON.stringify({ predictions: parsed.data.predictions.length })],
    );
    res.status(201).json({ runId: run.id, modelVersion: parsed.data.modelVersion || null, predictions: parsed.data.predictions.length });
  } catch (error) {
    await pool.query(`UPDATE model_runs SET status = 'failed', finished_at = NOW(), error_message = $2 WHERE id = $1`, [run.id, error.message.slice(0, 500)]);
    throw error;
  }
});

router.get('/runs', async (_req, res) => {
  const { rows } = await pool.query('SELECT id, model_name, model_version, status, started_at, finished_at, input_summary, output_summary FROM model_runs ORDER BY started_at DESC LIMIT 100');
  res.json({ runs: rows });
});

export default router;
