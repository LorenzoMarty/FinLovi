import api from '../lib/api';
import type { Category, CategoryCreate } from '@finlovi/shared';

export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data.data as Category[];
}

export async function createCategory(payload: CategoryCreate) {
  const res = await api.post('/categories', payload);
  return res.data.data as { message: string };
}
