import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { fail, ok } from '../utils/response.js';
import { getPagination } from '../utils/pagination.js';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '../repositories/transactionsRepo.js';

export async function list(req: Request, res: Response) {
  const { page, limit, type, category, from, to } = req.query as Record<string, string>;
  const { page: safePage, limit: safeLimit, offset } = getPagination(
    Number(page || 1),
    Number(limit || 20),
  );

  const { rows, total } = await listTransactions(
    db,
    { type, category, from, to },
    safeLimit,
    offset,
  );

  res.json(ok({ items: rows, total, page: safePage, limit: safeLimit }));
}

export async function get(req: Request, res: Response) {
  const id = Number(req.params.id);
  const row = await getTransaction(db, id);
  if (!row) {
    res.status(404).json(fail('Lançamento não encontrado', 'NOT_FOUND'));
    return;
  }
  res.json(ok(row));
}

export async function create(req: Request, res: Response) {
  await createTransaction(db, req.body);
  res.status(201).json(ok({ message: 'Lançamento criado' }));
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await getTransaction(db, id);
  if (!existing) {
    res.status(404).json(fail('Lançamento não encontrado', 'NOT_FOUND'));
    return;
  }
  await updateTransaction(db, id, req.body);
  res.json(ok({ message: 'Lançamento atualizado' }));
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  await deleteTransaction(db, id);
  res.json(ok({ message: 'Lançamento removido' }));
}
