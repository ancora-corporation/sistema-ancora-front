import { Router } from 'express';
import { z } from 'zod';
import { pool, inTransaction } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, allowRoles('admin', 'director', 'social'));

const studentParams = z.object({ params: z.object({ id: z.uuid() }) });
const addSchema = z.object({
  params: z.object({ id: z.uuid() }),
  body: z.union([
    z.object({ responsavelId: z.uuid(), parentesco: z.string().trim().min(2).max(60), principal: z.boolean().default(false) }),
    z.object({
      nome: z.string().trim().min(2).max(120),
      telefone: z.string().trim().min(8).max(30),
      email: z.email().trim().transform((value) => value.toLowerCase()).optional(),
      possuiWhatsapp: z.boolean().default(false),
      parentesco: z.string().trim().min(2).max(60),
      principal: z.boolean().default(false),
    }),
  ]),
});
const updateSchema = z.object({
  params: z.object({ id: z.uuid(), responsavelId: z.uuid() }),
  body: z.object({ parentesco: z.string().trim().min(2).max(60), principal: z.boolean() }),
});
const unlinkSchema = z.object({ params: z.object({ id: z.uuid(), responsavelId: z.uuid() }) });

async function alunoAcessivel(idAluno, usuario, alterar = false) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM ALUNO a JOIN ESCOLA e ON e.id = a.escola_id
     WHERE a.id = $1 AND ($2 = 'admin' OR a.escola_id = $3)
       AND (NOT $4::boolean OR $2 <> 'director' OR e.diretor_responsavel_id = $5)`,
    [idAluno, usuario.role, usuario.schoolId, alterar, usuario.id],
  );
  return rowCount > 0;
}

router.get('/:id/responsaveis', validate(studentParams), async (req, res) => {
  if (!await alunoAcessivel(req.validated.params.id, req.user)) {
    return res.status(404).json({ error: 'Aluno não encontrado nesta escola.' });
  }
  const { rows } = await pool.query(
    `SELECT r.id, r.nome, r.telefone, r.email, r.possui_whatsapp AS possui_whatsapp,
       ar.parentesco, ar.principal, ar.registro AS vinculado_em
     FROM ALUNO_RESPONSAVEL ar JOIN RESPONSAVEL r ON r.id = ar.id_responsavel
     WHERE ar.id_aluno = $1 ORDER BY ar.principal DESC, r.nome`, [req.validated.params.id],
  );
  res.json({ responsaveis: rows });
});

router.post('/:id/responsaveis', validate(addSchema), async (req, res) => {
  const { id: idAluno } = req.validated.params;
  if (!await alunoAcessivel(idAluno, req.user, true)) {
    return res.status(404).json({ error: 'Aluno não encontrado nesta escola ou sem permissão para editar.' });
  }
  const dados = req.validated.body;
  try {
    const responsavel = await inTransaction(async (client) => {
      let idResponsavel = dados.responsavelId;
      if (!idResponsavel) {
        const { rows: [novo] } = await client.query(
          `INSERT INTO RESPONSAVEL (nome, telefone, email, possui_whatsapp)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [dados.nome, dados.telefone, dados.email || null, dados.possuiWhatsapp],
        );
        idResponsavel = novo.id;
      } else {
        const { rowCount } = await client.query(
          `SELECT 1 FROM RESPONSAVEL r
           WHERE r.id = $1 AND ($2 = 'admin' OR EXISTS (
             SELECT 1 FROM ALUNO_RESPONSAVEL ar JOIN ALUNO a ON a.id = ar.id_aluno
             WHERE ar.id_responsavel = r.id AND a.escola_id = $3
           ))`, [idResponsavel, req.user.role, req.user.schoolId],
        );
        if (!rowCount) return null;
      }
      if (dados.principal) {
        await client.query('UPDATE ALUNO_RESPONSAVEL SET principal = FALSE WHERE id_aluno = $1 AND principal', [idAluno]);
      }
      await client.query(
        `INSERT INTO ALUNO_RESPONSAVEL (id_aluno, id_responsavel, parentesco, principal)
         VALUES ($1, $2, $3, $4)`, [idAluno, idResponsavel, dados.parentesco, dados.principal],
      );
      const { rows: [registro] } = await client.query(
        `SELECT r.id, r.nome, r.telefone, r.email, r.possui_whatsapp AS possui_whatsapp,
           ar.parentesco, ar.principal, ar.registro AS vinculado_em
         FROM ALUNO_RESPONSAVEL ar JOIN RESPONSAVEL r ON r.id = ar.id_responsavel
         WHERE ar.id_aluno = $1 AND ar.id_responsavel = $2`, [idAluno, idResponsavel],
      );
      return registro;
    });
    if (!responsavel) return res.status(404).json({ error: 'Responsável não encontrado.' });
    res.status(201).json({ responsavel });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Este responsável já está vinculado a este aluno.' });
    throw error;
  }
});

router.patch('/:id/responsaveis/:responsavelId', validate(updateSchema), async (req, res) => {
  const { id, responsavelId } = req.validated.params;
  if (!await alunoAcessivel(id, req.user, true)) {
    return res.status(404).json({ error: 'Aluno não encontrado nesta escola ou sem permissão para editar.' });
  }
  const { parentesco, principal } = req.validated.body;
  const registro = await inTransaction(async (client) => {
    const { rowCount: vinculoExiste } = await client.query(
      'SELECT 1 FROM ALUNO_RESPONSAVEL WHERE id_aluno = $1 AND id_responsavel = $2 FOR UPDATE', [id, responsavelId],
    );
    if (!vinculoExiste) return null;
    if (principal) await client.query('UPDATE ALUNO_RESPONSAVEL SET principal = FALSE WHERE id_aluno = $1 AND principal', [id]);
    const { rows: [updated] } = await client.query(
      `UPDATE ALUNO_RESPONSAVEL SET parentesco = $3, principal = $4
       WHERE id_aluno = $1 AND id_responsavel = $2
       RETURNING id_responsavel, parentesco, principal, registro AS vinculado_em`,
      [id, responsavelId, parentesco, principal],
    );
    return updated || null;
  });
  if (!registro) return res.status(404).json({ error: 'Vínculo de responsável não encontrado.' });
  res.json({ vinculo: registro });
});

router.delete('/:id/responsaveis/:responsavelId', validate(unlinkSchema), async (req, res) => {
  const { id, responsavelId } = req.validated.params;
  if (!await alunoAcessivel(id, req.user, true)) {
    return res.status(404).json({ error: 'Aluno não encontrado nesta escola ou sem permissão para editar.' });
  }
  const { rowCount } = await pool.query(
    'DELETE FROM ALUNO_RESPONSAVEL WHERE id_aluno = $1 AND id_responsavel = $2', [id, responsavelId],
  );
  if (!rowCount) return res.status(404).json({ error: 'Vínculo de responsável não encontrado.' });
  res.status(204).end();
});

export default router;
