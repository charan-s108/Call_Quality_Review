/**
 * PostgreSQL storage adapter — drop-in replacement for storage.js
 *
 * To activate:
 *   1. npm install pg
 *   2. Set DATABASE_URL in your environment
 *   3. Run the CREATE TABLE statement below once against your database
 *   4. In routes/calls.js, change the import:
 *        from: import { ... } from '../storage.js'
 *        to:   import { ... } from '../pg-storage.js'
 *
 * No other file changes required.
 *
 * Schema:
 *   CREATE TABLE calls (
 *     id         TEXT PRIMARY KEY,
 *     data       JSONB NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function saveCall(id, data) {
  await pool.query(
    'INSERT INTO calls (id, data) VALUES ($1, $2)',
    [id, JSON.stringify(data)]
  );
}

export async function getCall(id) {
  const { rows } = await pool.query(
    'SELECT data FROM calls WHERE id = $1',
    [id]
  );
  return rows.length > 0 ? rows[0].data : null;
}

export async function getAllCalls() {
  const { rows } = await pool.query(
    'SELECT data FROM calls ORDER BY created_at DESC'
  );
  return rows.map(r => r.data);
}

export async function callExists(id) {
  const { rows } = await pool.query(
    'SELECT 1 FROM calls WHERE id = $1',
    [id]
  );
  return rows.length > 0;
}

export async function deleteCall(id) {
  await pool.query('DELETE FROM calls WHERE id = $1', [id]);
}
