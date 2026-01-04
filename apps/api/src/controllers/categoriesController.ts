import type { Request, Response } from 'express';
import { db } from '../config/db.js';
import { defaultCategories } from '@finlovi/shared';
import { fail, ok } from '../utils/response.js';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../repositories/categoriesRepo.js';

function isMissingTable(error: unknown) {
  return error instanceof Error && error.message.includes('categories');
}

export async function list(req: Request, res: Response) {
  try {
    const rows = await listCategories(db);
    res.json(ok(rows));
  } catch (err) {
    if (isMissingTable(err)) {
      const fallback = defaultCategories.map((name, index) => ({ id: index + 1, name }));
      res.json(ok(fallback));
      return;
    }
    res.status(500).json(fail('Erro ao listar categorias'));
  }
}

export async function create(req: Request, res: Response) {
  try {
    await createCategory(db, req.body);
    res.status(201).json(ok({ message: 'Categoria criada' }));
  } catch (err) {
    if (isMissingTable(err)) {
      res.status(501).json(fail('Categorias requerem migration', 'MIGRATION_REQUIRED'));
      return;
    }
    res.status(500).json(fail('Erro ao criar categoria'));
  }
}

export async function update(req: Request, res: Response) {
  try {
    await updateCategory(db, Number(req.params.id), req.body);
    res.json(ok({ message: 'Categoria atualizada' }));
  } catch (err) {
    if (isMissingTable(err)) {
      res.status(501).json(fail('Categorias requerem migration', 'MIGRATION_REQUIRED'));
      return;
    }
    res.status(500).json(fail('Erro ao atualizar categoria'));
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await deleteCategory(db, Number(req.params.id));
    res.json(ok({ message: 'Categoria removida' }));
  } catch (err) {
    if (isMissingTable(err)) {
      res.status(501).json(fail('Categorias requerem migration', 'MIGRATION_REQUIRED'));
      return;
    }
    res.status(500).json(fail('Erro ao remover categoria'));
  }
}
