import type { Pool } from 'mysql2/promise';
import type { Category, CategoryCreate } from '@finlovi/shared';

export async function listCategories(db: Pool): Promise<Category[]> {
  const [rows] = await db.execute<Category[]>('SELECT id, name FROM categories ORDER BY name ASC');
  return rows;
}

export async function createCategory(db: Pool, payload: CategoryCreate) {
  await db.execute('INSERT INTO categories (name) VALUES (?)', [payload.name]);
}

export async function updateCategory(db: Pool, id: number, payload: CategoryCreate) {
  await db.execute('UPDATE categories SET name = ? WHERE id = ?', [payload.name, id]);
}

export async function deleteCategory(db: Pool, id: number) {
  await db.execute('DELETE FROM categories WHERE id = ?', [id]);
}
