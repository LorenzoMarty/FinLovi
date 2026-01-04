import api from '../lib/api';
import type { FixedExpense, FixedExpenseCreate } from '@finlovi/shared';

type FixedExpenseUpcoming = FixedExpense & { days_until_due: number };

export async function fetchFixedExpenses() {
  const res = await api.get('/fixed-expenses');
  return res.data.data as FixedExpense[];
}

export async function fetchUpcomingFixedExpenses(days = 7) {
  const res = await api.get('/fixed-expenses/upcoming', { params: { days } });
  return res.data.data as FixedExpenseUpcoming[];
}

export async function createFixedExpense(payload: FixedExpenseCreate) {
  const res = await api.post('/fixed-expenses', payload);
  return res.data.data as { message: string };
}
