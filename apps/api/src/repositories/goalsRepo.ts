import type { Pool } from 'mysql2/promise';
import type { Goal, GoalCreate } from '@finlovi/shared';

export async function listGoals(db: Pool) {
  const [rows] = await db.execute<Goal[]>(
    'SELECT id, name, target_amount, saved_amount, deadline, created_at FROM acquisition_goals ORDER BY deadline IS NULL, deadline ASC, id DESC',
  );
  return rows.map((row) => ({ ...row, deadline: row.deadline ?? null }));
}

export async function getGoal(db: Pool, id: number) {
  const [rows] = await db.execute<Goal[]>(
    'SELECT id, name, target_amount, saved_amount, deadline, created_at FROM acquisition_goals WHERE id = ?',
    [id],
  );
  const row = rows[0];
  return row ? { ...row, deadline: row.deadline ?? null } : null;
}

export async function createGoal(db: Pool, payload: GoalCreate) {
  const { name, target_amount, saved_amount, deadline } = payload;
  await db.execute(
    'INSERT INTO acquisition_goals (name, target_amount, saved_amount, deadline) VALUES (?, ?, ?, ?)',
    [name, target_amount, saved_amount, deadline],
  );
}

export async function updateGoal(db: Pool, id: number, payload: GoalCreate) {
  const { name, target_amount, saved_amount, deadline } = payload;
  await db.execute(
    'UPDATE acquisition_goals SET name = ?, target_amount = ?, saved_amount = ?, deadline = ? WHERE id = ?',
    [name, target_amount, saved_amount, deadline, id],
  );
}

export async function deleteGoal(db: Pool, id: number) {
  await db.execute('DELETE FROM acquisition_goals WHERE id = ?', [id]);
}
