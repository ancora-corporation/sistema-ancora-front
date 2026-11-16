import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const schema = z.object({ body: z.object({ schoolId: z.uuid().optional(), enrollment: z.string().trim().min(2).max(40), name: z.string().trim().min(2).max(160), birthDate: z.iso.date().optional() }) });
router.post('/', authenticate, allowRoles('admin', 'director'), validate(schema), async (req, res) => {
  const student = req.validated.body;
  const schoolId = req.user.role === 'admin' ? student.schoolId : req.user.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'Informe a escola do aluno.' });
  try {
    const { rows: [created] } = await pool.query(
      `INSERT INTO students (school_id, enrollment, name, birth_date)
       SELECT id, $2, $3, $4 FROM schools WHERE id = $1 AND is_active
       RETURNING id, school_id, enrollment, name, birth_date, is_active`,
      [schoolId, student.enrollment, student.name, student.birthDate || null],
    );
    if (!created) return res.status(404).json({ error: 'Escola não encontrada ou inativa.' });
    res.status(201).json({ aluno: created });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Já existe um aluno com esta matrícula.' });
    throw error;
  }
});

export default router;
