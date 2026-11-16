import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const loginSchema = z.object({ body: z.object({ email: z.email().transform((value) => value.toLowerCase()), senha: z.string().min(6).max(200) }) });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' } });

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, senha } = req.validated.body;
  const { rows: [user] } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.school_id, u.password_hash, u.is_active, s.name AS school_name
     FROM users u LEFT JOIN schools s ON s.id = u.school_id WHERE u.email = $1`, [email],
  );
  if (!user?.is_active || !await bcrypt.compare(senha, user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN, algorithm: 'HS256' });
  return res.json({ token, usuario: { id: user.id, nome: user.name, email: user.email, role: user.role, nivel: ({ social: 1, director: 2, admin: 3, teacher: 4 })[user.role], escolaId: user.school_id, escola: user.school_name } });
});

router.get('/me', authenticate, async (req, res) => res.json({ usuario: req.user }));
export default router;
