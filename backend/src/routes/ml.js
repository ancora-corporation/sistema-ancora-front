import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const runSchema = z.object({ body: z.object({ schoolId: z.uuid().optional(), classId: z.uuid().optional() }) });
const predictionSchema = z.object({ predictions: z.array(z.object({ studentId: z.uuid(), score: z.number().min(0).max(1), riskLevel: z.enum(['low', 'medium', 'high']), summary: z.string().min(1).max(1000) })), modelVersion: z.string().max(100).optional() });
const riskToDatabase = { low: 'baixo', medium: 'medio', high: 'alto' };
router.use(authenticate, allowRoles('admin'));

router.post('/runs', validate(runSchema), async (req, res) => {
  if (!env.ML_SERVICE_URL) return res.status(503).json({ error: 'Serviço de ML ainda não configurado. Defina ML_SERVICE_URL quando o modelo estiver disponível.' });
  const { schoolId, classId } = req.validated.body;
  const { rows: features } = await pool.query(
    `SELECT a.id AS student_id, a.escola_id AS school_id,
       frequencia.total_registros AS attendance_records, frequencia.faltas AS absences,
       frequencia.faltas_justificadas AS excused_absences, notas.media AS average_grade
     FROM ALUNO a
     LEFT JOIN LATERAL (
       SELECT COUNT(rc.aluno_id)::int AS total_registros,
         COUNT(rc.aluno_id) FILTER (WHERE rc.situacao = 'ausente')::int AS faltas,
         COUNT(rc.aluno_id) FILTER (WHERE rc.situacao = 'falta_justificada')::int AS faltas_justificadas
       FROM ALUNO_TURMA at
       JOIN TURMA t ON t.id = at.turma_id AND t.status_turma
       JOIN CHAMADA c ON c.turma_id = t.id
       JOIN REGISTRO_CHAMADA rc ON rc.chamada_id = c.id AND rc.aluno_id = a.id
       WHERE at.aluno_id = a.id AND ($2::uuid IS NULL OR t.id = $2)
     ) frequencia ON TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(AVG(n.valor), 0)::numeric(4,2) AS media
       FROM NOTA n JOIN TURMA t ON t.id = n.turma_id AND t.status_turma
       WHERE n.aluno_id = a.id AND ($2::uuid IS NULL OR t.id = $2)
     ) notas ON TRUE
     WHERE a.status_aluno AND ($1::uuid IS NULL OR a.escola_id = $1)
       AND ($2::uuid IS NULL OR EXISTS (
         SELECT 1 FROM ALUNO_TURMA at JOIN TURMA t ON t.id = at.turma_id
         WHERE at.aluno_id = a.id AND t.id = $2 AND t.status_turma
       ))
     ORDER BY a.id LIMIT 5000`, [schoolId || null, classId || null],
  );
  if (!features.length) return res.status(404).json({ error: 'Nenhum aluno encontrado para gerar previsões.' });

  const { rows: [run] } = await pool.query(
    `INSERT INTO EXECUCAO_MODELO (nome_modelo, situacao, resumo_entrada)
     VALUES ('attendance-risk', 'em_execucao', $1::jsonb) RETURNING id`,
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
        `INSERT INTO ALERTA (aluno_id, tipo, situacao, nivel_risco, pontuacao_risco, origem, versao_modelo, resumo, execucao_modelo_id)
         VALUES ($1, 'combinado', 'novo', $2, $3, 'modelo_ml', $4, $5, $6)`,
        [prediction.studentId, riskToDatabase[prediction.riskLevel], prediction.score, parsed.data.modelVersion || null, prediction.summary, run.id],
      );
    }
    await pool.query(
      `UPDATE EXECUCAO_MODELO SET situacao = 'concluida', versao_modelo = $2,
       finalizada_em = NOW(), resumo_saida = $3::jsonb WHERE id = $1`,
      [run.id, parsed.data.modelVersion || null, JSON.stringify({ predictions: parsed.data.predictions.length })],
    );
    res.status(201).json({ runId: run.id, modelVersion: parsed.data.modelVersion || null, predictions: parsed.data.predictions.length });
  } catch (error) {
    await pool.query(`UPDATE EXECUCAO_MODELO SET situacao = 'falhou', finalizada_em = NOW(), mensagem_erro = $2 WHERE id = $1`, [run.id, error.message.slice(0, 500)]);
    throw error;
  }
});

router.get('/runs', async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id, nome_modelo AS model_name, versao_modelo AS model_version,
       CASE situacao WHEN 'na_fila' THEN 'queued' WHEN 'em_execucao' THEN 'running' WHEN 'concluida' THEN 'succeeded' WHEN 'falhou' THEN 'failed' END AS status,
       iniciada_em AS started_at, finalizada_em AS finished_at,
       resumo_entrada AS input_summary, resumo_saida AS output_summary
     FROM EXECUCAO_MODELO ORDER BY iniciada_em DESC LIMIT 100`,
  );
  res.json({ runs: rows });
});

export default router;
