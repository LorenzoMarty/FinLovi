import api from '../lib/api';

type ReportRow = {
  month: string;
  total_income: number;
  total_expense: number;
};

export async function fetchMonthlyReport(params: { from?: string; to?: string }) {
  const res = await api.get('/reports/monthly', { params });
  return res.data.data as ReportRow[];
}
