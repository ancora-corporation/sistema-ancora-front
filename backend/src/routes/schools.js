import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, allowRoles('admin', 'director'));

router.get('/', async (req, res) => {
  const values = [];
  const restriction = req.user.role === 'admin' ? '' : (values.push(req.user.schoolId), 'WHERE s.id = $1');
  const { rows } = await pool.query(
    `SELECT s.id, s.name, s.code, s.district,
      COUNT(DISTINCT st.id)::int AS student_count,
      COUNT(DISTINCT c.id)::int AS class_count
     FROM schools s LEFT JOIN students st ON st.school_id = s.id AND st.is_active
     LEFT JOIN classes c ON c.school_id = s.id AND c.is_active ${restriction}
     GROUP BY s.id ORDER BY s.name`, values,
  );
  res.json({ escolas: rows });
});

const createSchema = z.object({ body: z.object({ name: z.string().trim().min(3).max(160), code: z.string().trim().min(2).max(30).toUpperCase(), district: z.string().trim().max(120).optional() }) });
router.post('/', allowRoles('admin'), validate(createSchema), async (req, res) => {
  const { name, code, district } = req.validated.body;
  try {
    const { rows: [school] } = await pool.query(
      'INSERT INTO schools (name, code, district) VALUES ($1, $2, $3) RETURNING id, name, code, district, is_active',
      [name, code, district || null],
    );
    res.status(201).json({ escola: school });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Já existe uma escola com este código.' });
    throw error;
  }
});

export default router;
