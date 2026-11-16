import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';

export async function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Autenticação necessária.' });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const { rows: [user] } = await pool.query(
      'SELECT id, name, email, role, school_id, is_active FROM users WHERE id = $1', [payload.sub],
    );
    if (!user?.is_active) return res.status(401).json({ error: 'Sessão inválida ou conta inativa.' });
    req.user = { id: user.id, nome: user.name, email: user.email, role: user.role, schoolId: user.school_id };
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
