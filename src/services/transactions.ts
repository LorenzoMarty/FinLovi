import api from '../lib/api';
import type { Transaction, TransactionCreate } from '@finlovi/shared';

type TransactionList = {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
};

export async function fetchTransactions(params: Record<string, string | number | undefined>) {
  const res = await api.get('/transactions', { params });
  return res.data.data as TransactionList;
}

export async function createTransaction(payload: TransactionCreate) {
  const res = await api.post('/transactions', payload);
  return res.data.data as { message: string };
}
