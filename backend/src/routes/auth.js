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
    `SELECT u.id, u.nome_usuario AS name, u.email, u.telefone AS phone,
       CASE
         WHEN adm.id_usuario IS NOT NULL THEN 'admin'
         WHEN dir.id_usuario IS NOT NULL THEN 'director'
         WHEN ass.id_usuario IS NOT NULL THEN 'social'
         WHEN prof.id_usuario IS NOT NULL THEN 'teacher'
       END AS role,
       COALESCE(dir.id_escola, ass.id_escola, prof.id_escola) AS school_id,
       u.senha_hash AS password_hash,
       u.status_usuario AS is_active, e.nome_escola AS school_name
     FROM USUARIO u
     LEFT JOIN ADMINISTRADOR adm ON adm.id_usuario = u.id
     LEFT JOIN DIRETOR dir ON dir.id_usuario = u.id
     LEFT JOIN ASSISTENTE_SOCIAL ass ON ass.id_usuario = u.id
     LEFT JOIN PROFESSOR prof ON prof.id_usuario = u.id
     LEFT JOIN ESCOLA e ON e.id = COALESCE(dir.id_escola, ass.id_escola, prof.id_escola)
     WHERE u.email = $1`, [email],
  );
  if (!user?.is_active || !await bcrypt.compare(senha, user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN, algorithm: 'HS256' });
  return res.json({ token, usuario: { id: user.id, nome: user.name, email: user.email, telefone: user.phone, role: user.role, nivel: ({ social: 1, director: 2, admin: 3, teacher: 4 })[user.role], escolaId: user.school_id, escola: user.school_name } });
});

router.get('/me', authenticate, async (req, res) => res.json({ usuario: req.user }));

const atualizarContaSchema = z.object({ body: z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.email().trim().transform((value) => value.toLowerCase()),
  telefone: z.string().trim().max(30).optional().default(''),
  senhaAtual: z.string().min(1).max(200),
  novaSenha: z.string().max(200).optional().default(''),
  confirmarNovaSenha: z.string().max(200).optional().default(''),
}).refine((dados) => !dados.novaSenha || dados.novaSenha.length >= 10, {
  path: ['novaSenha'], message: 'A nova senha deve ter pelo menos 10 caracteres.',
}).refine((dados) => dados.novaSenha === dados.confirmarNovaSenha, {
  path: ['confirmarNovaSenha'], message: 'A confirmação da nova senha não confere.',
}) });

router.patch('/me', authenticate, validate(atualizarContaSchema), async (req, res) => {
  const { nome, email, telefone, senhaAtual, novaSenha } = req.validated.body;
  const { rows: [user] } = await pool.query('SELECT senha_hash FROM USUARIO WHERE id = $1', [req.user.id]);
  if (!user || !await bcrypt.compare(senhaAtual, user.senha_hash)) {
    return res.status(400).json({ error: 'A senha atual está incorreta.' });
  }

  const senhaHash = novaSenha ? await bcrypt.hash(novaSenha, 12) : user.senha_hash;
  try {
    const { rows: [atualizado] } = await pool.query(
      `UPDATE USUARIO SET nome_usuario = $2, email = $3, telefone = $4,
         senha_hash = $5, atualizacao = NOW()
       WHERE id = $1
       RETURNING id, nome_usuario AS nome, email, telefone`,
      [req.user.id, nome, email, telefone || null, senhaHash],
    );
    return res.json({ usuario: atualizado });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Este e-mail já está sendo usado por outra conta.' });
    throw error;
  }
});

export default router;
