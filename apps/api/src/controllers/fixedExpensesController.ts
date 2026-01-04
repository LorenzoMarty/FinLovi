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

export async function list(_req: Request, res: Response) {
  try {
    const rows = await listFixedExpenses(db);
    res.json(ok(rows));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao listar gastos fixos';
    res.status(503).json(fail('Erro ao listar gastos fixos', 'DB_ERROR', message));
  }
}

export async function upcoming(req: Request, res: Response) {
  try {
    const days = Number(req.query.days || 7);
    const rows = await listFixedExpenses(db);
    const upcomingRows = rows
      .map((row) => ({ ...row, days_until_due: daysUntilDue(Number(row.due_day)) }))
      .filter((row) => row.days_until_due <= days)
      .sort((a, b) => a.days_until_due - b.days_until_due);
    res.json(ok(upcomingRows));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao listar próximos vencimentos';
    res.status(503).json(fail('Erro ao listar próximos vencimentos', 'DB_ERROR', message));
  }
}

export async function get(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await getFixedExpense(db, id);
    if (!row) {
      res.status(404).json(fail('Gasto fixo não encontrado', 'NOT_FOUND'));
      return;
    }
    res.json(ok(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar gasto fixo';
    res.status(503).json(fail('Erro ao buscar gasto fixo', 'DB_ERROR', message));
  }
}

export async function create(req: Request, res: Response) {
  try {
    await createFixedExpense(db, req.body);
    res.status(201).json(ok({ message: 'Gasto fixo criado' }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar gasto fixo';
    res.status(503).json(fail('Erro ao criar gasto fixo', 'DB_ERROR', message));
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const existing = await getFixedExpense(db, id);
    if (!existing) {
      res.status(404).json(fail('Gasto fixo não encontrado', 'NOT_FOUND'));
      return;
    }
    await updateFixedExpense(db, id, req.body);
    res.json(ok({ message: 'Gasto fixo atualizado' }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar gasto fixo';
    res.status(503).json(fail('Erro ao atualizar gasto fixo', 'DB_ERROR', message));
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deleteFixedExpense(db, id);
    res.json(ok({ message: 'Gasto fixo removido' }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao remover gasto fixo';
    res.status(503).json(fail('Erro ao remover gasto fixo', 'DB_ERROR', message));
  }
}
