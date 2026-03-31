import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export const query = async (text: string, params?: unknown[]) => {
  const result = await pool.query(text, params);
  return result.rows;
};

export const queryOne = async (text: string, params?: unknown[]) => {
  const result = await pool.query(text, params);
  return result.rows[0] || null;
};

export const execute = async (text: string, params?: unknown[]) => {
  await pool.query(text, params);
};

export const closePool = async () => {
  await pool.end();
};
