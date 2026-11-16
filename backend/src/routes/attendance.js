import { Router } from 'express';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const date = z.iso.date();
const saveSchema = z.object({ body: z.object({ classId: z.uuid(), lotacaoId: z.uuid(), lessonDate: date, records: z.array(z.object({ studentId: z.uuid(), status: z.enum(['present', 'absent', 'excused']), note: z.string().max(500).optional() })).min(1).max(100) }) });
const statusToDatabase = { present: 'presente', absent: 'ausente', excused: 'falta_justificada' };
router.use(authenticate);

router.get('/', async (req, res) => {
  const { classId, lessonDate, lotacaoId } = req.query;
  if (!classId || !lessonDate) return res.status(400).json({ error: 'Informe classId e lessonDate.' });
  if (!z.uuid().safeParse(classId).success || !date.safeParse(lessonDate).success || (lotacaoId && !z.uuid().safeParse(lotacaoId).success)) {
    return res.status(400).json({ error: 'Turma, lotação ou data inválida.' });
  }
  if (req.user.role === 'teacher' && !lotacaoId) return res.status(400).json({ error: 'Selecione a disciplina/lotação da aula.' });
  const { rows } = await pool.query(
    `SELECT c.id AS session_id, c.data_aula AS lesson_date, rc.aluno_id AS student_id,
       a.nome_aluno AS student_name,
       CASE rc.situacao WHEN 'presente' THEN 'present' WHEN 'ausente' THEN 'absent' WHEN 'falta_justificada' THEN 'excused' END AS status,
       rc.observacao AS note
     FROM CHAMADA c JOIN TURMA t ON t.id = c.turma_id
     LEFT JOIN LOTACAO l ON l.id = c.id_lotacao
     JOIN REGISTRO_CHAMADA rc ON rc.chamada_id = c.id JOIN ALUNO a ON a.id = rc.aluno_id
     WHERE t.id = $1 AND c.data_aula = $2
       AND ($3 = 'admin' OR t.escola_id = $4)
       AND ($3 <> 'teacher' OR (c.id_lotacao = $5 AND l.id_professor = $6 AND l.ativa))
       AND ($7::uuid IS NULL OR c.id_lotacao = $7)
     ORDER BY a.nome_aluno`, [classId, lessonDate, req.user.role, req.user.schoolId, lotacaoId || null, req.user.id, lotacaoId || null],
  );
  res.json({ chamada: rows });
});

router.put('/', allowRoles('teacher'), validate(saveSchema), async (req, res) => {
  const { classId, lotacaoId, lessonDate, records } = req.validated.body;
  const uniqueIds = new Set(records.map(({ studentId }) => studentId));
  if (uniqueIds.size !== records.length) return res.status(400).json({ error: 'Há alunos repetidos na chamada.' });
  const saved = await inTransaction(async (client) => {
    const { rows: [classRow] } = await client.query(
      `SELECT t.id FROM TURMA t JOIN LOTACAO l ON l.id_turma = t.id
       WHERE t.id = $1 AND l.id = $2 AND l.id_professor = $3 AND l.ativa
         AND l.ano_letivo = t.ano_letivo AND t.status_turma`, [classId, lotacaoId, req.user.id],
    );
    if (!classRow) return null;
    const { rows: enrolled } = await client.query(
      'SELECT aluno_id FROM ALUNO_TURMA WHERE turma_id = $1 AND aluno_id = ANY($2::uuid[])', [classId, [...uniqueIds]],
    );
    if (enrolled.length !== records.length) return false;
    const { rows: [session] } = await client.query(
      `INSERT INTO CHAMADA (turma_id, id_lotacao, data_aula, registrada_por) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_lotacao, data_aula) WHERE id_lotacao IS NOT NULL
       DO UPDATE SET registrada_por = EXCLUDED.registrada_por RETURNING id`,
      [classId, lotacaoId, lessonDate, req.user.id],
    );
    for (const record of records) {
      await client.query(
        `INSERT INTO REGISTRO_CHAMADA (chamada_id, aluno_id, situacao, observacao) VALUES ($1, $2, $3, $4)
         ON CONFLICT (chamada_id, aluno_id) DO UPDATE SET situacao = EXCLUDED.situacao, observacao = EXCLUDED.observacao, marcado_em = NOW()`,
        [session.id, record.studentId, statusToDatabase[record.status], record.note || null],
      );
    }
    return session.id;
  });
  if (saved === null) return res.status(403).json({ error: 'Esta turma não está vinculada ao seu perfil.' });
  if (saved === false) return res.status(400).json({ error: 'A chamada contém alunos de outra turma.' });
  res.json({ sessionId: saved, registrosSalvos: records.length });
});

export default router;
