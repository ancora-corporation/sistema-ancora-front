import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const saveSchema = z.object({ body: z.object({ classId: z.uuid(), lotacaoId: z.uuid(), studentId: z.uuid(), assessment: z.string().trim().min(1).max(120), period: z.string().trim().min(1).max(40), value: z.coerce.number().min(0).max(10) }) });
const deleteSchema = z.object({ body: z.object({ classId: z.uuid(), lotacaoId: z.uuid(), studentId: z.uuid(), assessment: z.string().trim().min(1).max(120), period: z.string().trim().min(1).max(40) }) });
router.use(authenticate);

router.get('/', async (req, res) => {
  const { classId, lotacaoId } = req.query;
  if (!classId && !lotacaoId) return res.status(400).json({ error: 'Informe classId ou lotacaoId.' });
  if (req.user.role === 'teacher' && !lotacaoId) return res.status(400).json({ error: 'Selecione a disciplina/lotação.' });
  const { rows } = await pool.query(
    `SELECT n.id, n.turma_id AS class_id, n.aluno_id AS student_id,
       a.nome_aluno AS student_name, d.nome AS subject, n.id_lotacao AS lotacao_id, n.avaliacao AS assessment,
       n.periodo AS period, n.valor AS value, n.atualizacao AS updated_at
     FROM NOTA n JOIN ALUNO a ON a.id = n.aluno_id JOIN TURMA t ON t.id = n.turma_id
     LEFT JOIN LOTACAO l ON l.id = n.id_lotacao
     LEFT JOIN DISCIPLINA d ON d.id = l.id_disciplina
     WHERE ($1::uuid IS NULL OR t.id = $1) AND ($5::uuid IS NULL OR n.id_lotacao = $5)
       AND ($2 = 'admin' OR t.escola_id = $3)
       AND ($2 <> 'teacher' OR (l.id_professor = $4 AND l.ativa))
     ORDER BY a.nome_aluno, n.periodo, n.avaliacao`, [classId || null, req.user.role, req.user.schoolId, req.user.id, lotacaoId || null],
  );
  res.json({ notas: rows });
});

router.put('/', allowRoles('teacher'), validate(saveSchema), async (req, res) => {
  const grade = req.validated.body;
  const { rows: [saved] } = await pool.query(
     `INSERT INTO NOTA (turma_id, aluno_id, id_lotacao, disciplina, avaliacao, periodo, valor, registrada_por)
     SELECT t.id, at.aluno_id, l.id, d.nome, $4, $5, $6, $7
     FROM TURMA t JOIN ALUNO_TURMA at ON at.turma_id = t.id
     JOIN LOTACAO l ON l.id = $3 AND l.id_turma = t.id AND l.id_professor = $7 AND l.ativa AND l.ano_letivo = t.ano_letivo
     JOIN DISCIPLINA d ON d.id = l.id_disciplina
     WHERE t.id = $1 AND at.aluno_id = $2 AND t.status_turma
     ON CONFLICT (turma_id, aluno_id, disciplina, avaliacao, periodo)
     DO UPDATE SET valor = EXCLUDED.valor, id_lotacao = EXCLUDED.id_lotacao, disciplina = EXCLUDED.disciplina, atualizacao = NOW()
     RETURNING id, turma_id AS class_id, aluno_id AS student_id, disciplina AS subject, id_lotacao AS lotacao_id,
       avaliacao AS assessment, periodo AS period, valor AS value`,
    [grade.classId, grade.studentId, grade.lotacaoId, grade.assessment, grade.period, grade.value, req.user.id],
  );
  if (!saved) return res.status(403).json({ error: 'Turma, disciplina ou aluno não vinculado ao seu perfil.' });
  res.json({ nota: saved });
});

router.delete('/', allowRoles('teacher'), validate(deleteSchema), async (req, res) => {
  const { classId, lotacaoId, studentId, assessment, period } = req.validated.body;
  const { rowCount } = await pool.query(
    `DELETE FROM NOTA n USING LOTACAO l
     WHERE n.turma_id = $1 AND n.id_lotacao = l.id AND l.id = $2
       AND l.id_professor = $3 AND l.ativa AND n.aluno_id = $4
       AND n.avaliacao = $5 AND n.periodo = $6`,
    [classId, lotacaoId, req.user.id, studentId, assessment, period],
  );
  res.json({ removida: rowCount > 0 });
});

export default router;
