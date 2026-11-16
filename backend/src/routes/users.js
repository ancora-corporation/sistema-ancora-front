import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const createSchema = z.object({ body: z.object({ nome: z.string().trim().min(2).max(120), email: z.email().transform((value) => value.toLowerCase()), senha: z.string().min(10).max(200), matricula: z.string().trim().max(40).optional(), telefone: z.string().trim().max(30).optional(), role: z.enum(['director', 'social', 'teacher']), escolaId: z.uuid() }) });
router.use(authenticate);

router.get('/', allowRoles('admin'), async (_req, res) => {
  const { rows } = await pool.query('SELECT u.id, u.name, u.email, u.registry_number, u.phone, u.role, u.school_id, u.is_active, s.name AS school_name, u.created_at FROM users u LEFT JOIN schools s ON s.id = u.school_id ORDER BY u.name');
  res.json({ usuarios: rows });
});

router.post('/', allowRoles('admin'), validate(createSchema), async (req, res) => {
  const { nome, email, senha, matricula, telefone, role, escolaId } = req.validated.body;
  const passwordHash = await bcrypt.hash(senha, 12);
  try {
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (name, email, registry_number, phone, password_hash, role, school_id)
       SELECT $1, $2, $3, $4, $5, $6, s.id FROM schools s WHERE s.id = $7 AND s.is_active
       RETURNING id, name, email, registry_number, phone, role, school_id, is_active, created_at`,
      [nome, email, matricula || null, telefone || null, passwordHash, role, escolaId],
    );
    if (!user) return res.status(404).json({ error: 'Escola não encontrada ou inativa.' });
    return res.status(201).json({ usuario: user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
    throw error;
  }
});

router.patch('/:id/status', allowRoles('admin'), async (req, res) => {
  const { rows: [user] } = await pool.query(
    'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, is_active', [req.params.id],
  );
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ usuario: user });
});

export default router;
