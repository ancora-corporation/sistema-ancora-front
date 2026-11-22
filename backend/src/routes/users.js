import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const createSchema = z.object({ body: z.object({ nome: z.string().trim().min(2).max(120), email: z.email().transform((value) => value.toLowerCase()), senha: z.string().min(10).max(200), matricula: z.string().trim().max(40).optional(), telefone: z.string().trim().max(30).optional(), role: z.enum(['admin', 'director', 'social', 'teacher']), escolaId: z.uuid().optional(), lotacoes: z.array(z.object({ turmaId: z.uuid(), disciplina: z.string().trim().min(1).max(100) })).max(50).optional().default([]) }) });
router.use(authenticate);

router.get('/', allowRoles('admin', 'director'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nome_usuario AS name, u.email,
       COALESCE(prof.registro_funcional, ass.registro_profissional) AS registry_number,
       u.telefone AS phone,
       CASE WHEN adm.id_usuario IS NOT NULL THEN 'admin' WHEN dir.id_usuario IS NOT NULL THEN 'director'
         WHEN ass.id_usuario IS NOT NULL THEN 'social' WHEN prof.id_usuario IS NOT NULL THEN 'teacher' END AS role,
       COALESCE(dir.id_escola, ass.id_escola, prof.id_escola) AS school_id,
       u.status_usuario AS is_active, e.nome_escola AS school_name, u.registro AS created_at
     FROM USUARIO u
     LEFT JOIN ADMINISTRADOR adm ON adm.id_usuario = u.id
     LEFT JOIN DIRETOR dir ON dir.id_usuario = u.id
     LEFT JOIN ASSISTENTE_SOCIAL ass ON ass.id_usuario = u.id
     LEFT JOIN PROFESSOR prof ON prof.id_usuario = u.id
     LEFT JOIN ESCOLA e ON e.id = COALESCE(dir.id_escola, ass.id_escola, prof.id_escola)
     WHERE ($1 = 'admin' OR COALESCE(dir.id_escola, ass.id_escola, prof.id_escola) = $2)
     ORDER BY u.nome_usuario`,
    [req.user.role, req.user.schoolId],
  );
  res.json({ usuarios: rows });
});

router.post('/', allowRoles('admin', 'director'), validate(createSchema), async (req, res) => {
  const { nome, email, senha, matricula, telefone, role, escolaId, lotacoes } = req.validated.body;
  const isDirector = req.user.role === 'director';
  if (isDirector && !['social', 'teacher'].includes(role)) {
    return res.status(403).json({ error: 'Diretores podem cadastrar somente professores e assistentes sociais.' });
  }
  if (role === 'admin' && isDirector) {
    return res.status(403).json({ error: 'Somente um administrador pode criar outra conta de administrador.' });
  }
  const schoolId = isDirector ? req.user.schoolId : (escolaId || null);
  if (role !== 'admin' && !schoolId) return res.status(400).json({ error: 'Selecione a escola para este perfil.' });
  if (role === 'teacher' && !lotacoes.length) return res.status(400).json({ error: 'Informe ao menos uma matéria e turma para o professor.' });
  if (role !== 'teacher' && lotacoes.length) return res.status(400).json({ error: 'Matérias e turmas só podem ser informadas para professores.' });
  if (isDirector) {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM ESCOLA WHERE id = $1 AND status_escola AND diretor_responsavel_id = $2`,
      [schoolId, req.user.id],
    );
    if (!rowCount) return res.status(403).json({ error: 'Somente o diretor designado pelo administrador pode cadastrar a equipe.' });
  }
  const passwordHash = await bcrypt.hash(senha, 12);
  try {
    if (schoolId) {
      const { rowCount } = await pool.query('SELECT 1 FROM ESCOLA WHERE id = $1 AND status_escola', [schoolId]);
      if (!rowCount) return res.status(404).json({ error: 'Escola não encontrada ou inativa.' });
    }
    if (role === 'teacher') {
      const pares = lotacoes.map((item) => `${item.turmaId}:${item.disciplina.toLocaleLowerCase('pt-BR')}`);
      if (new Set(pares).size !== pares.length) return res.status(400).json({ error: 'A mesma matéria e turma foram informadas mais de uma vez.' });
      const turmaIds = [...new Set(lotacoes.map((item) => item.turmaId))];
      const { rows: turmas } = await pool.query(
        'SELECT id FROM TURMA WHERE id = ANY($1::uuid[]) AND escola_id = $2 AND status_turma', [turmaIds, schoolId],
      );
      if (turmas.length !== turmaIds.length) return res.status(400).json({ error: 'Todas as turmas precisam estar ativas e pertencer à escola selecionada.' });
    }
    const user = await inTransaction(async (client) => {
      const { rows: [created] } = await client.query(
        `INSERT INTO USUARIO (nome_usuario, email, telefone, senha_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nome_usuario AS name, email, telefone AS phone,
           status_usuario AS is_active, registro AS created_at`,
        [nome, email, telefone || null, passwordHash],
      );
      if (role === 'admin') await client.query('INSERT INTO ADMINISTRADOR (id_usuario) VALUES ($1)', [created.id]);
      if (role === 'director') await client.query('INSERT INTO DIRETOR (id_usuario, id_escola) VALUES ($1, $2)', [created.id, schoolId]);
      if (role === 'social') await client.query('INSERT INTO ASSISTENTE_SOCIAL (id_usuario, id_escola, registro_profissional) VALUES ($1, $2, $3)', [created.id, schoolId, matricula || null]);
      if (role === 'teacher') {
        await client.query('INSERT INTO PROFESSOR (id_usuario, id_escola, registro_funcional) VALUES ($1, $2, $3)', [created.id, schoolId, matricula || null]);
        for (const item of lotacoes) {
          const { rows: [disciplina] } = await client.query(
            'INSERT INTO DISCIPLINA (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET ativa = TRUE RETURNING id', [item.disciplina],
          );
          const { rows: [turma] } = await client.query('SELECT ano_letivo FROM TURMA WHERE id = $1', [item.turmaId]);
          await client.query(
            `INSERT INTO LOTACAO (id_professor, id_turma, id_disciplina, ano_letivo)
             VALUES ($1, $2, $3, $4)`, [created.id, item.turmaId, disciplina.id, turma.ano_letivo],
          );
        }
      }
      return { ...created, role, school_id: schoolId, lotacoes_criadas: role === 'teacher' ? lotacoes.length : 0 };
    });
    return res.status(201).json({ usuario: user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
    throw error;
  }
});

router.patch('/:id/status', allowRoles('admin'), async (req, res) => {
  const { rows: [user] } = await pool.query(
    'UPDATE USUARIO SET status_usuario = NOT status_usuario, atualizacao = NOW() WHERE id = $1 RETURNING id, status_usuario AS is_active',
    [req.params.id],
  );
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ usuario: user });
});

export default router;
