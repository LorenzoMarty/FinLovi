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
  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao listar transacoes';
    res.status(503).json(fail('Erro ao listar transacoes', 'DB_ERROR', message));
  }
}

export async function get(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const row = await getTransaction(db, id);
    if (!row) {
      res.status(404).json(fail('Lancamento nao encontrado', 'NOT_FOUND'));
      return;
    }
    res.json(ok(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao buscar transacao';
    res.status(503).json(fail('Erro ao buscar transacao', 'DB_ERROR', message));
  }
}

export async function create(req: Request, res: Response) {
  try {
    await createTransaction(db, req.body);
    res.status(201).json(ok({ message: 'Lancamento criado' }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar transacao';
    res.status(503).json(fail('Erro ao criar transacao', 'DB_ERROR', message));
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const existing = await getTransaction(db, id);
    if (!existing) {
      res.status(404).json(fail('Lancamento nao encontrado', 'NOT_FOUND'));
      return;
    }
    await updateTransaction(db, id, req.body);
    res.json(ok({ message: 'Lancamento atualizado' }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar transacao';
    res.status(503).json(fail('Erro ao atualizar transacao', 'DB_ERROR', message));
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deleteTransaction(db, id);
    res.json(ok({ message: 'Lancamento removido' }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao remover transacao';
    res.status(503).json(fail('Erro ao remover transacao', 'DB_ERROR', message));
  }
}
