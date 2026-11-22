import { Router } from 'express';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, allowRoles('admin', 'director', 'social', 'teacher'));

const studentParamsSchema = z.object({ params: z.object({ id: z.uuid() }) });
const updateStudentSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.object({
    name: z.string().trim().min(2).max(160).optional(),
    birthDate: z.iso.date().nullable().optional(),
    district: z.string().trim().max(120).nullable().optional(),
    familyIncome: z.number().min(0).max(99999999.99).nullable().optional(),
    situation: z.enum(['matriculado', 'transferido', 'concluido', 'evadido', 'inativo']).optional(),
    exitDate: z.iso.date().nullable().optional(),
  }).refine((body) => Object.keys(body).length > 0, 'Informe ao menos um dado para atualizar.'),
});

const dadosAuditaveis = [
  { api: 'name', coluna: 'nome_aluno', campo: 'nome' },
  { api: 'birthDate', coluna: 'data_nascimento', campo: 'data_nascimento' },
  { api: 'district', coluna: 'bairro_aluno', campo: 'bairro' },
  { api: 'familyIncome', coluna: 'renda_familiar', campo: 'renda_familiar' },
  { api: 'situation', coluna: 'situacao_aluno', campo: 'situacao' },
  { api: 'exitDate', coluna: 'data_saida', campo: 'data_saida' },
];

function valorNormalizado(api, valor) {
  if (valor == null) return null;
  if (api === 'birthDate' || api === 'exitDate') return valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
  if (api === 'familyIncome') return Number(valor);
  return valor;
}

async function alunoNaEscola(idAluno, usuario, client = pool) {
  const { rows: [student] } = await client.query(
    `SELECT a.id, a.escola_id FROM ALUNO a JOIN ESCOLA e ON e.id = a.escola_id
     WHERE a.id = $1 AND ($2 = 'admin' OR a.escola_id = $3)
       AND ($2 <> 'director' OR e.diretor_responsavel_id = $4)`,
    [idAluno, usuario.role, usuario.schoolId, usuario.id],
  );
  return student || null;
}

router.get('/', async (req, res) => {
  const search = String(req.query.busca || '').trim();
  const { rows } = await pool.query(
    `SELECT a.id, a.nome_aluno AS name, a.matricula AS enrollment, a.escola_id AS school_id,
       e.nome_escola AS school_name,
       COALESCE(string_agg(DISTINCT t.nome_turma, ', '), '—') AS class_names,
       COALESCE(string_agg(DISTINCT t.ano_serie, ', '), '—') AS grade_levels,
       COALESCE(string_agg(DISTINCT t.turno, ', '), '—') AS shifts,
       CASE recente.nivel_risco WHEN 'alto' THEN 'high' WHEN 'medio' THEN 'medium' WHEN 'baixo' THEN 'low' END AS latest_risk_level
     FROM ALUNO a JOIN ESCOLA e ON e.id = a.escola_id
     LEFT JOIN ALUNO_TURMA at ON at.aluno_id = a.id AND at.data_saida IS NULL
     LEFT JOIN TURMA t ON t.id = at.turma_id AND t.status_turma
     LEFT JOIN LATERAL (SELECT al.nivel_risco FROM ALERTA al WHERE al.aluno_id = a.id ORDER BY al.registro DESC LIMIT 1) recente ON TRUE
     WHERE a.status_aluno AND ($1 = 'admin' OR a.escola_id = $2)
       AND ($1 <> 'teacher' OR EXISTS (SELECT 1 FROM ALUNO_TURMA at2 JOIN LOTACAO l ON l.id_turma = at2.turma_id JOIN TURMA t2 ON t2.id = l.id_turma WHERE at2.aluno_id = a.id AND at2.data_saida IS NULL AND l.id_professor = $3 AND l.ativa AND l.ano_letivo = t2.ano_letivo))
       AND ($4 = '' OR a.nome_aluno ILIKE '%' || $4 || '%' OR a.matricula::text ILIKE '%' || $4 || '%')
     GROUP BY a.id, e.nome_escola, recente.nivel_risco ORDER BY a.nome_aluno LIMIT 200`, [req.user.role, req.user.schoolId, req.user.id, search],
  );
  res.json({ alunos: rows });
});

router.get('/:id', async (req, res) => {
  const { rows: [student] } = await pool.query(
    `SELECT a.id, a.nome_aluno AS name, a.matricula AS enrollment,
       a.data_nascimento AS birth_date, a.escola_id AS school_id, e.nome_escola AS school_name,
       CASE WHEN $2 = 'teacher' THEN NULL ELSE a.bairro_aluno END AS district,
       CASE WHEN $2 = 'teacher' THEN NULL ELSE a.renda_familiar END AS family_income,
       a.situacao_aluno AS situation, a.data_saida AS exit_date,
       a.atualizacao AS updated_at, a.atualizado_por AS updated_by,
       COALESCE(string_agg(DISTINCT t.nome_turma, ', '), '—') AS class_names
     FROM ALUNO a JOIN ESCOLA e ON e.id = a.escola_id
     LEFT JOIN ALUNO_TURMA at ON at.aluno_id = a.id AND at.data_saida IS NULL
     LEFT JOIN TURMA t ON t.id = at.turma_id AND t.status_turma
     WHERE a.id = $1 AND a.status_aluno AND ($2 = 'admin' OR a.escola_id = $3)
       AND ($2 <> 'teacher' OR EXISTS (SELECT 1 FROM ALUNO_TURMA at2 JOIN LOTACAO l ON l.id_turma = at2.turma_id JOIN TURMA t2 ON t2.id = l.id_turma WHERE at2.aluno_id = a.id AND at2.data_saida IS NULL AND l.id_professor = $4 AND l.ativa AND l.ano_letivo = t2.ano_letivo))
     GROUP BY a.id, e.nome_escola`,
    [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  if (!student) return res.status(404).json({ error: 'Aluno não encontrado.' });
  res.json({ aluno: student });
});

router.get('/:id/historico-academico', validate(studentParamsSchema), async (req, res) => {
  const { id } = req.validated.params;
  const { rows: [student] } = await pool.query(
    `SELECT a.id, a.nome_aluno AS name, a.matricula AS enrollment, a.escola_id AS school_id
     FROM ALUNO a JOIN ESCOLA e ON e.id = a.escola_id
     WHERE a.id = $1 AND a.status_aluno AND ($2 = 'admin' OR a.escola_id = $3)
       AND ($2 <> 'director' OR e.diretor_responsavel_id = $4)
       AND ($2 <> 'teacher' OR EXISTS (
         SELECT 1 FROM ALUNO_TURMA at JOIN TURMA t ON t.id = at.turma_id
         JOIN LOTACAO l ON l.id_turma = t.id
         WHERE at.aluno_id = a.id AND at.data_saida IS NULL AND l.id_professor = $4
           AND l.ativa AND l.ano_letivo = t.ano_letivo
       ))`, [id, req.user.role, req.user.schoolId, req.user.id],
  );
  if (!student) return res.status(404).json({ error: 'Aluno não encontrado nesta escola ou sem vínculo com suas turmas.' });

  const avaliacoes = ['Avaliação 1', 'Avaliação 2', 'Avaliação 3', 'Avaliação 4'];
  const [gradesResult, attendanceResult] = await Promise.all([
    pool.query(
      `SELECT n.turma_id AS class_id, t.nome_turma AS class_name, t.ano_letivo AS academic_year,
         COALESCE(d.nome, n.disciplina) AS subject, n.periodo AS period,
         COALESCE(jsonb_agg(jsonb_build_object('assessment', n.avaliacao, 'value', n.valor)
           ORDER BY n.avaliacao) FILTER (WHERE n.avaliacao = ANY($5::text[])), '[]'::jsonb) AS assessments,
         COUNT(*) FILTER (WHERE n.avaliacao = ANY($5::text[]))::int AS assessment_count,
         ROUND(AVG(n.valor) FILTER (WHERE n.avaliacao = ANY($5::text[])), 2) AS average,
         CASE WHEN COUNT(*) FILTER (WHERE n.avaliacao = ANY($5::text[])) = 4
           THEN ROUND(AVG(n.valor) FILTER (WHERE n.avaliacao = ANY($5::text[])), 2) END AS final_average
       FROM NOTA n JOIN TURMA t ON t.id = n.turma_id
       LEFT JOIN LOTACAO l ON l.id = n.id_lotacao
       LEFT JOIN DISCIPLINA d ON d.id = l.id_disciplina
       WHERE n.aluno_id = $1 AND ($2 = 'admin' OR t.escola_id = $3)
         AND ($2 <> 'teacher' OR (l.id_professor = $4 AND l.ativa))
       GROUP BY n.turma_id, t.nome_turma, t.ano_letivo, COALESCE(d.nome, n.disciplina), n.periodo
       ORDER BY t.ano_letivo DESC, subject, n.periodo`,
      [id, req.user.role, req.user.schoolId, req.user.id, avaliacoes],
    ),
    pool.query(
      `SELECT t.id AS class_id, t.nome_turma AS class_name, t.ano_letivo AS academic_year,
         COUNT(*)::int AS lessons_recorded,
         COUNT(*) FILTER (WHERE rc.situacao = 'presente')::int AS present,
         COUNT(*) FILTER (WHERE rc.situacao = 'ausente')::int AS absent,
         COUNT(*) FILTER (WHERE rc.situacao = 'falta_justificada')::int AS excused,
         ROUND(100.0 * COUNT(*) FILTER (WHERE rc.situacao = 'presente') / NULLIF(COUNT(*), 0), 2) AS attendance_percent
       FROM REGISTRO_CHAMADA rc JOIN CHAMADA c ON c.id = rc.chamada_id
       JOIN TURMA t ON t.id = c.turma_id
       LEFT JOIN LOTACAO l ON l.id = c.id_lotacao
       WHERE rc.aluno_id = $1 AND ($2 = 'admin' OR t.escola_id = $3)
         AND ($2 <> 'teacher' OR (l.id_professor = $4 AND l.ativa))
       GROUP BY t.id, t.nome_turma, t.ano_letivo
       ORDER BY t.ano_letivo DESC, t.nome_turma`,
      [id, req.user.role, req.user.schoolId, req.user.id],
    ),
  ]);

  const frequencia = attendanceResult.rows.reduce((total, turma) => ({
    aulas_registradas: total.aulas_registradas + turma.lessons_recorded,
    presentes: total.presentes + turma.present,
    faltas: total.faltas + turma.absent,
    faltas_justificadas: total.faltas_justificadas + turma.excused,
  }), { aulas_registradas: 0, presentes: 0, faltas: 0, faltas_justificadas: 0 });
  frequencia.percentual = frequencia.aulas_registradas
    ? Number((100 * frequencia.presentes / frequencia.aulas_registradas).toFixed(2)) : null;
  const mediasFinais = gradesResult.rows.map(({ final_average }) => final_average).filter((value) => value != null).map(Number);

  res.json({
    aluno: student,
    notas: gradesResult.rows,
    frequencia_por_turma: attendanceResult.rows,
    resumo: {
      ...frequencia,
      medias_finais_concluidas: mediasFinais.length,
      media_geral: mediasFinais.length ? Number((mediasFinais.reduce((sum, value) => sum + value, 0) / mediasFinais.length).toFixed(2)) : null,
    },
  });
});

router.patch('/:id', allowRoles('admin', 'director', 'social'), validate(updateStudentSchema), async (req, res) => {
  const { id } = req.validated.params;
  const body = req.validated.body;
  const updated = await inTransaction(async (client) => {
    const current = await alunoNaEscola(id, req.user, client);
    if (!current) return null;
    const { rows: [original] } = await client.query(
      `SELECT nome_aluno, data_nascimento, bairro_aluno, renda_familiar,
         situacao_aluno, data_saida
       FROM ALUNO WHERE id = $1 FOR UPDATE`, [id],
    );
    const assignments = [];
    const values = [id, req.user.id];
    const auditEntries = [];
    for (const field of dadosAuditaveis) {
      if (!Object.hasOwn(body, field.api)) continue;
      const anterior = valorNormalizado(field.api, original[field.coluna]);
      const novo = valorNormalizado(field.api, body[field.api]);
      if (JSON.stringify(anterior) === JSON.stringify(novo)) continue;
      values.push(body[field.api]);
      assignments.push(`${field.coluna} = $${values.length}`);
      auditEntries.push({ campo: field.campo, anterior, novo });
    }
    if (assignments.length) {
      assignments.push('atualizacao = NOW()', 'atualizado_por = $2');
      await client.query(`UPDATE ALUNO SET ${assignments.join(', ')} WHERE id = $1`, values);
      for (const item of auditEntries) {
        await client.query(
          `INSERT INTO AUDITORIA_ALUNO (id_aluno, id_usuario, campo, valor_anterior, valor_novo)
           VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)`,
          [id, req.user.id, item.campo, JSON.stringify(item.anterior), JSON.stringify(item.novo)],
        );
      }
    }
    const { rows: [student] } = await client.query(
      `SELECT id, nome_aluno AS name, data_nascimento AS birth_date,
         bairro_aluno AS district, renda_familiar AS family_income,
         situacao_aluno AS situation, data_saida AS exit_date,
         atualizacao AS updated_at, atualizado_por AS updated_by
       FROM ALUNO WHERE id = $1`, [id],
    );
    return student;
  });
  if (!updated) return res.status(404).json({ error: 'Aluno não encontrado nesta escola ou sem permissão para editar.' });
  res.json({ aluno: updated });
});

router.get('/:id/auditoria', allowRoles('admin', 'director', 'social'), validate(studentParamsSchema), async (req, res) => {
  const { id } = req.validated.params;
  if (!await alunoNaEscola(id, req.user)) return res.status(404).json({ error: 'Aluno não encontrado nesta escola.' });
  const { rows } = await pool.query(
    `SELECT h.id, h.campo AS field, h.valor_anterior AS old_value,
       h.valor_novo AS new_value, h.alterado_em AS changed_at,
       h.id_usuario AS user_id, u.nome_usuario AS user_name
     FROM AUDITORIA_ALUNO h JOIN USUARIO u ON u.id = h.id_usuario
     WHERE h.id_aluno = $1 ORDER BY h.alterado_em DESC LIMIT 500`, [id],
  );
  res.json({ auditoria: rows });
});

router.get('/:id/attendance', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.data_aula AS lesson_date,
       CASE rc.situacao WHEN 'presente' THEN 'present' WHEN 'ausente' THEN 'absent' WHEN 'falta_justificada' THEN 'excused' END AS status,
       rc.observacao AS note, t.nome_turma AS class_name
     FROM REGISTRO_CHAMADA rc JOIN CHAMADA c ON c.id = rc.chamada_id
     JOIN TURMA t ON t.id = c.turma_id JOIN ALUNO a ON a.id = rc.aluno_id
     LEFT JOIN LOTACAO l ON l.id = c.id_lotacao
     WHERE a.id = $1 AND ($2 = 'admin' OR a.escola_id = $3)
       AND ($2 <> 'teacher' OR l.id_professor = $4)
     ORDER BY c.data_aula DESC LIMIT 180`, [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ frequencia: rows });
});

router.get('/:id/grades', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.id, COALESCE(d.nome, n.disciplina) AS subject, n.avaliacao AS assessment, n.periodo AS period,
       n.valor AS value, n.atualizacao AS updated_at, t.nome_turma AS class_name
     FROM NOTA n JOIN TURMA t ON t.id = n.turma_id JOIN ALUNO a ON a.id = n.aluno_id
     LEFT JOIN LOTACAO l ON l.id = n.id_lotacao
     LEFT JOIN DISCIPLINA d ON d.id = l.id_disciplina
     WHERE a.id = $1 AND ($2 = 'admin' OR a.escola_id = $3)
       AND ($2 <> 'teacher' OR l.id_professor = $4)
     ORDER BY n.atualizacao DESC LIMIT 180`, [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ notas: rows });
});

export default router;
