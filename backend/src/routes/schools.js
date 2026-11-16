import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, allowRoles('admin', 'director'));

router.get('/', async (req, res) => {
  const values = [];
  const restriction = req.user.role === 'admin' ? '' : (values.push(req.user.schoolId), 'WHERE e.id = $1');
  const { rows } = await pool.query(
    `SELECT e.id, e.nome_escola AS name, e.codigo_escola AS code, e.bairro_escola AS district,
      e.diretor_responsavel_id AS director_id, d.nome_usuario AS director_name, d.email AS director_email,
      COUNT(DISTINCT a.id)::int AS student_count,
      COUNT(DISTINCT t.id)::int AS class_count
     FROM ESCOLA e
     LEFT JOIN DIRETOR dr ON dr.id_usuario = e.diretor_responsavel_id AND dr.id_escola = e.id
     LEFT JOIN USUARIO d ON d.id = dr.id_usuario
     LEFT JOIN ALUNO a ON a.escola_id = e.id AND a.status_aluno
     LEFT JOIN TURMA t ON t.escola_id = e.id AND t.status_turma ${restriction}
     GROUP BY e.id, d.nome_usuario, d.email ORDER BY e.nome_escola`, values,
  );
  res.json({ escolas: rows });
});

const createSchema = z.object({ body: z.object({ name: z.string().trim().min(3).max(160), code: z.string().trim().min(2).max(30).toUpperCase(), district: z.string().trim().max(120).optional() }) });
router.post('/', allowRoles('admin'), validate(createSchema), async (req, res) => {
  const { name, code, district } = req.validated.body;
  try {
    const { rows: [school] } = await pool.query(
      'INSERT INTO ESCOLA (nome_escola, codigo_escola, bairro_escola) VALUES ($1, $2, $3) RETURNING id, nome_escola AS name, codigo_escola AS code, bairro_escola AS district, status_escola AS is_active',
      [name, code, district || 'Não informado'],
    );
    res.status(201).json({ escola: school });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Já existe uma escola com este código.' });
    throw error;
  }
});

const assignDirectorSchema = z.object({ body: z.object({ directorId: z.uuid().nullable() }) });
router.patch('/:id/diretor', allowRoles('admin'), validate(assignDirectorSchema), async (req, res) => {
  const { directorId } = req.validated.body;
  if (directorId) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM DIRETOR d JOIN USUARIO u ON u.id = d.id_usuario
       WHERE d.id_usuario = $1 AND d.id_escola = $2 AND u.status_usuario`, [directorId, req.params.id],
    );
    if (!rowCount) return res.status(400).json({ error: 'Selecione um diretor ativo vinculado a esta escola.' });
  }
  const { rows: [school] } = await pool.query(
    `UPDATE ESCOLA SET diretor_responsavel_id = $2, atualizacao = NOW()
     WHERE id = $1
     RETURNING id, diretor_responsavel_id AS director_id`, [req.params.id, directorId],
  );
  if (!school) return res.status(404).json({ error: 'Escola não encontrada.' });
  res.json({ escola: school });
});

export default router;
