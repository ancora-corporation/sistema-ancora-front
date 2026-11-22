import { readdir, readFile } from 'node:fs/promises';
import { pool } from './pool.js';

try {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS MIGRACAO_ESQUEMA (versao TEXT PRIMARY KEY, aplicada_em TIMESTAMPTZ NOT NULL DEFAULT NOW())',
  );
  const files = (await readdir(new URL('./migrations/', import.meta.url)))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/i.test(file))
    .sort();

  for (const file of files) {
    const version = file.replace(/\.sql$/i, '');
    const { rowCount } = await pool.query('SELECT 1 FROM MIGRACAO_ESQUEMA WHERE versao = $1', [version]);
    if (rowCount) {
      console.log(`Migração ${version} já aplicada.`);
      continue;
    }

    const sql = await readFile(new URL(`./migrations/${file}`, import.meta.url), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO MIGRACAO_ESQUEMA (versao) VALUES ($1) ON CONFLICT DO NOTHING', [version]);
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
