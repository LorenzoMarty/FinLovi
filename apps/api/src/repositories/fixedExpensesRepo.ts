import type { Pool } from 'mysql2/promise';
import type { FixedExpense, FixedExpenseCreate } from '@finlovi/shared';

export async function listFixedExpenses(db: Pool) {
  const [rows] = await db.execute<FixedExpense[]>(
    'SELECT id, description, amount, category, due_day FROM fixed_expenses ORDER BY due_day ASC, id DESC',
  );
  return rows;
}

export async function getFixedExpense(db: Pool, id: number) {
  const [rows] = await db.execute<FixedExpense[]>(
    'SELECT id, description, amount, category, due_day FROM fixed_expenses WHERE id = ?',
    [id],
  );
  return rows[0] || null;
}

export async function createFixedExpense(db: Pool, payload: FixedExpenseCreate) {
  const { description, amount, category, due_day } = payload;
  await db.execute(
    'INSERT INTO fixed_expenses (description, amount, category, due_day) VALUES (?, ?, ?, ?)',
    [description, amount, category, due_day],
  );
}

export async function updateFixedExpense(db: Pool, id: number, payload: FixedExpenseCreate) {
  const { description, amount, category, due_day } = payload;
  await db.execute(
    'UPDATE fixed_expenses SET description = ?, amount = ?, category = ?, due_day = ? WHERE id = ?',
    [description, amount, category, due_day, id],
  );
}

export async function deleteFixedExpense(db: Pool, id: number) {
  await db.execute('DELETE FROM fixed_expenses WHERE id = ?', [id]);
}
