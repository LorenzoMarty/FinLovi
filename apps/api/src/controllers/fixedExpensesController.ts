import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { fail, ok } from '../utils/response.js';
import {
  createFixedExpense,
  deleteFixedExpense,
  getFixedExpense,
  listFixedExpenses,
  updateFixedExpense,
} from '../repositories/fixedExpensesRepo.js';

function daysUntilDue(dueDay: number) {
  const today = new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }
  const diff = due.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function list(req: Request, res: Response) {
  const rows = await listFixedExpenses(db);
  res.json(ok(rows));
}

export async function upcoming(req: Request, res: Response) {
  const days = Number(req.query.days || 7);
  const rows = await listFixedExpenses(db);
  const upcomingRows = rows
    .map((row) => ({ ...row, days_until_due: daysUntilDue(Number(row.due_day)) }))
    .filter((row) => row.days_until_due <= days)
    .sort((a, b) => a.days_until_due - b.days_until_due);
  res.json(ok(upcomingRows));
}

export async function get(req: Request, res: Response) {
  const id = Number(req.params.id);
  const row = await getFixedExpense(db, id);
  if (!row) {
    res.status(404).json(fail('Gasto fixo não encontrado', 'NOT_FOUND'));
    return;
  }
  res.json(ok(row));
}

export async function create(req: Request, res: Response) {
  await createFixedExpense(db, req.body);
  res.status(201).json(ok({ message: 'Gasto fixo criado' }));
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await getFixedExpense(db, id);
  if (!existing) {
    res.status(404).json(fail('Gasto fixo não encontrado', 'NOT_FOUND'));
    return;
  }
  await updateFixedExpense(db, id, req.body);
  res.json(ok({ message: 'Gasto fixo atualizado' }));
}

export async function remove(req: Request, res: Response) {
  await deleteFixedExpense(db, Number(req.params.id));
  res.json(ok({ message: 'Gasto fixo removido' }));
}
