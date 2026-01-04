import { Router } from 'express';
import { z } from 'zod';
import { transactionCreateSchema, transactionTypeSchema } from '@finlovi/shared';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { list, get, create, update, remove } from '../controllers/transactionsController.js';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: transactionTypeSchema.optional(),
  category: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
const idSchema = z.object({ id: z.coerce.number().int().positive() });

export const transactionRoutes = Router();

transactionRoutes.get('/', requireAuth, validate(querySchema, 'query'), list);
transactionRoutes.get('/:id', requireAuth, validate(idSchema, 'params'), get);
transactionRoutes.post('/', requireAuth, validate(transactionCreateSchema), create);
transactionRoutes.put('/:id', requireAuth, validate(idSchema, 'params'), validate(transactionCreateSchema), update);
transactionRoutes.delete('/:id', requireAuth, validate(idSchema, 'params'), remove);
