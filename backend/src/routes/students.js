import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, allowRoles('admin', 'director', 'social', 'teacher'));

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
     LEFT JOIN ALUNO_TURMA at ON at.aluno_id = a.id
     LEFT JOIN TURMA t ON t.id = at.turma_id AND t.status_turma
     LEFT JOIN LATERAL (SELECT al.nivel_risco FROM ALERTA al WHERE al.aluno_id = a.id ORDER BY al.registro DESC LIMIT 1) recente ON TRUE
     WHERE a.status_aluno AND ($1 = 'admin' OR a.escola_id = $2)
       AND ($1 <> 'teacher' OR EXISTS (SELECT 1 FROM ALUNO_TURMA at2 JOIN LOTACAO l ON l.id_turma = at2.turma_id JOIN TURMA t2 ON t2.id = l.id_turma WHERE at2.aluno_id = a.id AND l.id_professor = $3 AND l.ativa AND l.ano_letivo = t2.ano_letivo))
       AND ($4 = '' OR a.nome_aluno ILIKE '%' || $4 || '%' OR a.matricula::text ILIKE '%' || $4 || '%')
     GROUP BY a.id, e.nome_escola, recente.nivel_risco ORDER BY a.nome_aluno LIMIT 200`, [req.user.role, req.user.schoolId, req.user.id, search],
  );
  res.json({ alunos: rows });
});

router.get('/:id', async (req, res) => {
  const { rows: [student] } = await pool.query(
    `SELECT a.id, a.nome_aluno AS name, a.matricula AS enrollment,
       a.data_nascimento AS birth_date, a.escola_id AS school_id, e.nome_escola AS school_name,
       COALESCE(string_agg(DISTINCT t.nome_turma, ', '), '—') AS class_names
     FROM ALUNO a JOIN ESCOLA e ON e.id = a.escola_id
     LEFT JOIN ALUNO_TURMA at ON at.aluno_id = a.id
     LEFT JOIN TURMA t ON t.id = at.turma_id AND t.status_turma
     WHERE a.id = $1 AND a.status_aluno AND ($2 = 'admin' OR a.escola_id = $3)
       AND ($2 <> 'teacher' OR EXISTS (SELECT 1 FROM ALUNO_TURMA at2 JOIN LOTACAO l ON l.id_turma = at2.turma_id JOIN TURMA t2 ON t2.id = l.id_turma WHERE at2.aluno_id = a.id AND l.id_professor = $4 AND l.ativa AND l.ano_letivo = t2.ano_letivo))
     GROUP BY a.id, e.nome_escola`,
    [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  if (!student) return res.status(404).json({ error: 'Aluno não encontrado.' });
  res.json({ aluno: student });
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
