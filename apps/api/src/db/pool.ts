import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

type RequiredKey = 'DB_HOST' | 'DB_NAME' | 'DB_USER';
const requiredKeys: RequiredKey[] = ['DB_HOST', 'DB_NAME', 'DB_USER'];
const missing = requiredKeys.filter((key) => !String(env[key] ?? '').trim());
if (missing.length) {
  console.warn(`[db] variaveis ausentes: ${missing.join(', ')} (conexao pode falhar)`);
}

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10_000,
  decimalNumbers: true,
  charset: 'utf8mb4_general_ci',
});

pool.on('error', (err) => {
  console.error('[db] pool error', err.message);
});

export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.execute<T[]>(sql, params);
  return rows;
}

export async function exec(sql: string, params: unknown[] = []) {
  await pool.execute(sql, params);
}

export async function pingDb() {
  try {
    await pool.query('SELECT 1');
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false as const,
      error: message,
      host: env.DB_HOST,
      database: env.DB_NAME,
    };
  }
}
