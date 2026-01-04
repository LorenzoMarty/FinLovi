import api from '../lib/api';
import type { Goal, GoalCreate } from '@finlovi/shared';

export async function fetchGoals() {
  const res = await api.get('/goals');
  return res.data.data as Goal[];
}

export async function createGoal(payload: GoalCreate) {
  const res = await api.post('/goals', payload);
  return res.data.data as { message: string };
}
