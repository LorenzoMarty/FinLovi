import type { Pool } from 'mysql2/promise';
import type { TransactionCreate, Transaction } from '@finlovi/shared';

export type TransactionFilters = {
  type?: string;
  category?: string;
  from?: string;
  to?: string;
};

export async function listTransactions(
  db: Pool,
  filters: TransactionFilters,
  limit: number,
  offset: number,
) {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.from) {
    conditions.push('date >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    conditions.push('date <= ?');
    params.push(filters.to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await db.execute<{ total: number }[]>(
    `SELECT COUNT(*) as total FROM transactions ${where}`,
    params,
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await db.execute<Transaction[]>(
    `SELECT id, description, amount, category, type, date
     FROM transactions ${where}
     ORDER BY date DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return { rows, total };
}

export async function getTransaction(db: Pool, id: number) {
  const [rows] = await db.execute<Transaction[]>(
    'SELECT id, description, amount, category, type, date FROM transactions WHERE id = ?',
    [id],
  );
  return rows[0] || null;
}

export async function createTransaction(db: Pool, payload: TransactionCreate) {
  const { description, amount, category, type, date } = payload;
  await db.execute(
    'INSERT INTO transactions (description, amount, category, type, date) VALUES (?, ?, ?, ?, ?)',
    [description, amount, category, type, date],
  );
}

export async function updateTransaction(db: Pool, id: number, payload: TransactionCreate) {
  const { description, amount, category, type, date } = payload;
  await db.execute(
    'UPDATE transactions SET description = ?, amount = ?, category = ?, type = ?, date = ? WHERE id = ?',
    [description, amount, category, type, date, id],
  );
}

export async function deleteTransaction(db: Pool, id: number) {
  await db.execute('DELETE FROM transactions WHERE id = ?', [id]);
}
