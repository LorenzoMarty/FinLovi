import api from '../lib/api';

type DashboardSummary = {
  period: { start: string; end: string };
  total_income: number;
  total_expense: number;
  net: number;
  income_count: number;
  expense_count: number;
  top_category: { category: string; total: number } | null;
};

export async function fetchDashboardSummary(period: string) {
  const res = await api.get('/dashboard/summary', { params: { period } });
  return res.data.data as DashboardSummary;
}
