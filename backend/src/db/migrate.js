import { readFile } from 'node:fs/promises';
import { pool } from './pool.js';

const version = '001_initial';
try {
  const { rows } = await pool.query('SELECT to_regclass($1) AS table_name', ['public.schema_migrations']);
  let alreadyApplied = false;
  if (rows[0].table_name) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]);
    alreadyApplied = Boolean(applied.rowCount);
  }
  if (alreadyApplied) {
    console.log(`Migração ${version} já aplicada.`);
  } else {
    const sql = await readFile(new URL('./migrations/001_initial.sql', import.meta.url), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING', [version]);
      await client.query('COMMIT');
      console.log(`Migração ${version} aplicada.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} catch (error) {
  console.error('Falha ao aplicar migrações:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
