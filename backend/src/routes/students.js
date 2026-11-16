import { Router } from 'express';
import { pool } from '../db/pool.js';
import { authenticate, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, allowRoles('admin', 'director', 'social', 'teacher'));

router.get('/', async (req, res) => {
  const search = String(req.query.busca || '').trim();
  const { rows } = await pool.query(
    `SELECT st.id, st.name, st.enrollment, st.school_id, s.name AS school_name,
       COALESCE(string_agg(DISTINCT c.name, ', '), '—') AS class_names,
       COALESCE(string_agg(DISTINCT c.grade_level, ', '), '—') AS grade_levels,
       COALESCE(string_agg(DISTINCT c.shift, ', '), '—') AS shifts,
       recent.risk_level AS latest_risk_level
     FROM students st JOIN schools s ON s.id = st.school_id
     LEFT JOIN class_students cs ON cs.student_id = st.id
     LEFT JOIN classes c ON c.id = cs.class_id AND c.is_active
     LEFT JOIN LATERAL (SELECT a.risk_level FROM alerts a WHERE a.student_id = st.id ORDER BY a.created_at DESC LIMIT 1) recent ON TRUE
     WHERE st.is_active AND ($1 = 'admin' OR st.school_id = $2)
       AND ($1 <> 'teacher' OR c.teacher_id = $3)
       AND ($4 = '' OR st.name ILIKE '%' || $4 || '%' OR st.enrollment ILIKE '%' || $4 || '%')
     GROUP BY st.id, s.name, recent.risk_level ORDER BY st.name LIMIT 200`, [req.user.role, req.user.schoolId, req.user.id, search],
  );
  res.json({ alunos: rows });
});

router.get('/:id', async (req, res) => {
  const { rows: [student] } = await pool.query(
    `SELECT st.id, st.name, st.enrollment, st.birth_date, st.school_id, s.name AS school_name,
       COALESCE(string_agg(DISTINCT c.name, ', '), '—') AS class_names
     FROM students st JOIN schools s ON s.id = st.school_id
     LEFT JOIN class_students cs ON cs.student_id = st.id
     LEFT JOIN classes c ON c.id = cs.class_id AND c.is_active
     WHERE st.id = $1 AND st.is_active AND ($2 = 'admin' OR st.school_id = $3)
       AND ($2 <> 'teacher' OR c.teacher_id = $4)
     GROUP BY st.id, s.name`,
    [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  if (!student) return res.status(404).json({ error: 'Aluno não encontrado.' });
  res.json({ aluno: student });
});

router.get('/:id/attendance', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ss.lesson_date, ar.status, ar.note, c.name AS class_name
     FROM attendance_records ar JOIN attendance_sessions ss ON ss.id = ar.session_id
     JOIN classes c ON c.id = ss.class_id JOIN students st ON st.id = ar.student_id
     WHERE st.id = $1 AND ($2 = 'admin' OR st.school_id = $3)
       AND ($2 <> 'teacher' OR c.teacher_id = $4)
     ORDER BY ss.lesson_date DESC LIMIT 180`, [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ frequencia: rows });
});

router.get('/:id/grades', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT g.id, g.subject, g.assessment, g.period, g.value, g.updated_at, c.name AS class_name
     FROM grades g JOIN classes c ON c.id = g.class_id JOIN students st ON st.id = g.student_id
     WHERE st.id = $1 AND ($2 = 'admin' OR st.school_id = $3)
       AND ($2 <> 'teacher' OR c.teacher_id = $4)
     ORDER BY g.updated_at DESC LIMIT 180`, [req.params.id, req.user.role, req.user.schoolId, req.user.id],
  );
  res.json({ notas: rows });
});

export default router;
