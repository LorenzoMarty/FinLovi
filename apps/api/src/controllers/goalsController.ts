import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { fail, ok } from '../utils/response.js';
import {
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  updateGoal,
} from '../repositories/goalsRepo.js';

export async function list(req: Request, res: Response) {
  const rows = await listGoals(db);
  const enriched = rows.map((row) => ({
    ...row,
    progress: row.target_amount > 0 ? Math.min(100, Math.round((row.saved_amount / row.target_amount) * 100)) : 0,
  }));
  res.json(ok(enriched));
}

export async function get(req: Request, res: Response) {
  const id = Number(req.params.id);
  const row = await getGoal(db, id);
  if (!row) {
    res.status(404).json(fail('Meta não encontrada', 'NOT_FOUND'));
    return;
  }
  res.json(ok(row));
}

export async function create(req: Request, res: Response) {
  await createGoal(db, req.body);
  res.status(201).json(ok({ message: 'Meta criada' }));
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await getGoal(db, id);
  if (!existing) {
    res.status(404).json(fail('Meta não encontrada', 'NOT_FOUND'));
    return;
  }
  await updateGoal(db, id, req.body);
  res.json(ok({ message: 'Meta atualizada' }));
}

export async function remove(req: Request, res: Response) {
  await deleteGoal(db, Number(req.params.id));
  res.json(ok({ message: 'Meta removida' }));
}
