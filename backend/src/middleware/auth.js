import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Autenticação necessária.' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const { rows: [user] } = await pool.query(
      `SELECT u.id, u.nome_usuario AS name, u.email, u.telefone AS phone,
         CASE
           WHEN adm.id_usuario IS NOT NULL THEN 'admin'
           WHEN dir.id_usuario IS NOT NULL THEN 'director'
           WHEN ass.id_usuario IS NOT NULL THEN 'social'
           WHEN prof.id_usuario IS NOT NULL THEN 'teacher'
         END AS role,
         COALESCE(dir.id_escola, ass.id_escola, prof.id_escola) AS school_id,
         u.status_usuario AS is_active
       FROM USUARIO u
       LEFT JOIN ADMINISTRADOR adm ON adm.id_usuario = u.id
       LEFT JOIN DIRETOR dir ON dir.id_usuario = u.id
       LEFT JOIN ASSISTENTE_SOCIAL ass ON ass.id_usuario = u.id
       LEFT JOIN PROFESSOR prof ON prof.id_usuario = u.id
       WHERE u.id = $1`, [payload.sub],
    );
    if (!user?.is_active) return res.status(401).json({ error: 'Sessão inválida ou conta inativa.' });
    req.user = { id: user.id, nome: user.name, email: user.email, telefone: user.phone, role: user.role, schoolId: user.school_id };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Perfil sem permissão para esta ação.' });
    return next();
  };
}

export function canAccessSchool(user, schoolId) {
  return user.role === 'admin' || user.schoolId === schoolId;
}
