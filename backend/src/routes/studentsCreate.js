import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const schema = z.object({ body: z.object({ schoolId: z.uuid().optional(), name: z.string().trim().min(2).max(160), birthDate: z.iso.date().optional() }) });
router.post('/', authenticate, allowRoles('admin', 'director'), validate(schema), async (req, res) => {
  const student = req.validated.body;
  const schoolId = req.user.role === 'admin' ? student.schoolId : req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'Informe a escola do aluno.' });
  if (req.user.role === 'director') {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM ESCOLA WHERE id = $1 AND status_escola AND diretor_responsavel_id = $2',
      [schoolId, req.user.id],
    );
    if (!rowCount) return res.status(403).json({ error: 'Somente o diretor designado pelo administrador pode cadastrar alunos.' });
  }
  const { rows: [created] } = await pool.query(
    `INSERT INTO ALUNO (escola_id, nome_aluno, data_nascimento)
     SELECT id, $2, $3 FROM ESCOLA WHERE id = $1 AND status_escola
     RETURNING id, escola_id AS school_id, matricula AS enrollment, nome_aluno AS name,
       data_nascimento AS birth_date, status_aluno AS is_active`,
    [schoolId, student.name, student.birthDate || null],
  );
  if (!created) return res.status(404).json({ error: 'Escola não encontrada ou inativa.' });
  res.status(201).json({ aluno: created });
});

export default router;
