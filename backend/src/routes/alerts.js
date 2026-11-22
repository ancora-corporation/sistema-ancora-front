import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

// A API mantém os valores em inglês que o front-end já utiliza; o banco os guarda em português.
const statusToDatabase = {
  new: 'novo',
  in_progress: 'em_acompanhamento',
  resolved: 'resolvido',
  overdue: 'atrasado',
};
const riskToDatabase = { low: 'baixo', medium: 'medio', high: 'alto' };

router.get('/', async (req, res) => {
  const { status, risk, studentId } = req.query;
  if (studentId && !z.uuid().safeParse(studentId).success) {
    return res.status(400).json({ error: 'studentId inválido.' });
  }

  const { rows } = await pool.query(
    `SELECT a.id,
       a.aluno_id AS student_id,
       al.nome_aluno AS student_name,
       al.matricula AS enrollment,
       e.nome_escola AS school_name,
       e.codigo_escola AS school_code,
       e.bairro_escola AS district,
       CASE a.tipo
         WHEN 'frequencia' THEN 'attendance'
         WHEN 'nota' THEN 'grade'
         WHEN 'combinado' THEN 'combined'
         ELSE a.tipo
       END AS kind,
       CASE a.situacao
         WHEN 'novo' THEN 'new'
         WHEN 'em_acompanhamento' THEN 'in_progress'
         WHEN 'resolvido' THEN 'resolved'
         WHEN 'atrasado' THEN 'overdue'
       END AS status,
       CASE a.nivel_risco
         WHEN 'baixo' THEN 'low'
         WHEN 'medio' THEN 'medium'
         WHEN 'alto' THEN 'high'
       END AS risk_level,
       a.pontuacao_risco AS risk_score,
       CASE a.origem WHEN 'modelo_ml' THEN 'ml' ELSE a.origem END AS source,
       a.versao_modelo AS model_version,
       a.resumo AS summary,
       a.prazo AS due_at,
       a.registro AS created_at,
       acompanhamento.nome_usuario AS intervention_by,
       acompanhamento.tipo AS intervention_kind,
       acompanhamento.descricao AS intervention_description,
       acompanhamento.resultado AS intervention_outcome,
       acompanhamento.data_ocorrencia AS intervention_occurred_at,
       acompanhamento.data_retorno AS intervention_follow_up_at,
       turma.nome_turma AS class_name
     FROM ALERTA a
     JOIN ALUNO al ON al.id = a.aluno_id
     JOIN ESCOLA e ON e.id = al.escola_id
     LEFT JOIN LATERAL (
       SELECT u.nome_usuario, i.tipo, i.descricao, i.resultado, i.data_ocorrencia, i.data_retorno
       FROM INTERVENCAO i
       JOIN USUARIO u ON u.id = i.registrada_por
       WHERE i.alerta_id = a.id
       ORDER BY i.registro DESC
       LIMIT 1
     ) acompanhamento ON TRUE
     LEFT JOIN LATERAL (
       SELECT CONCAT_WS(' - ', t.ano_serie, t.turno) AS nome_turma
       FROM ALUNO_TURMA at
       JOIN TURMA t ON t.id = at.turma_id
       WHERE at.aluno_id = al.id AND at.data_saida IS NULL AND t.status_turma
       ORDER BY t.ano_letivo DESC
       LIMIT 1
     ) turma ON TRUE
     WHERE ($1 IN ('admin', 'administrador') OR al.escola_id = $2)
       AND ($1 NOT IN ('teacher', 'professor') OR EXISTS (
         SELECT 1
         FROM ALUNO_TURMA at
         JOIN TURMA t ON t.id = at.turma_id
         JOIN LOTACAO l ON l.id_turma = t.id
         WHERE at.aluno_id = al.id AND at.data_saida IS NULL AND t.status_turma AND l.id_professor = $3 AND l.ativa AND l.ano_letivo = t.ano_letivo
       ))
       AND ($4::text IS NULL OR a.situacao = $4)
       AND ($5::text IS NULL OR a.nivel_risco = $5)
       AND ($6::uuid IS NULL OR a.aluno_id = $6)
     ORDER BY a.registro DESC
     LIMIT 500`,
    [
      req.user.role,
      req.user.schoolId,
      req.user.id,
      status ? (statusToDatabase[status] || status) : null,
      risk ? (riskToDatabase[risk] || risk) : null,
      studentId || null,
    ],
  );

  res.json({ alertas: rows });
});

const statusSchema = z.object({
  body: z.object({ status: z.enum(['new', 'in_progress', 'resolved', 'overdue']) }),
});

router.patch(
  '/:id/status',
  allowRoles('admin', 'director', 'social', 'administrador', 'diretor', 'assistente_social'),
  validate(statusSchema),
  async (req, res) => {
    const { rows: [alert] } = await pool.query(
      `UPDATE ALERTA a
       SET situacao = $2, atualizacao = NOW()
       FROM ALUNO al
       WHERE a.id = $1
         AND al.id = a.aluno_id
         AND ($3 IN ('admin', 'administrador') OR al.escola_id = $4)
       RETURNING a.id,
         CASE a.situacao
           WHEN 'novo' THEN 'new'
           WHEN 'em_acompanhamento' THEN 'in_progress'
           WHEN 'resolvido' THEN 'resolved'
           WHEN 'atrasado' THEN 'overdue'
         END AS status,
         a.atualizacao AS updated_at`,
      [
        req.params.id,
        statusToDatabase[req.validated.body.status],
        req.user.role,
        req.user.schoolId,
      ],
    );

    if (!alert) return res.status(404).json({ error: 'Alerta não encontrado.' });
    res.json({ alerta: alert });
  },
);

export default router;
