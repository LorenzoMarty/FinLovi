import { Router } from 'express';
import { z } from 'zod';
import { fixedExpenseCreateSchema } from '@finlovi/shared';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { list, get, create, update, remove, upcoming } from '../controllers/fixedExpensesController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const idSchema = z.object({ id: z.coerce.number().int().positive() });

export const fixedExpenseRoutes = Router();

fixedExpenseRoutes.get('/', requireAuth, asyncHandler(list));
fixedExpenseRoutes.get('/upcoming', requireAuth, asyncHandler(upcoming));
fixedExpenseRoutes.get('/:id', requireAuth, validate(idSchema, 'params'), asyncHandler(get));
fixedExpenseRoutes.post('/', requireAuth, validate(fixedExpenseCreateSchema), asyncHandler(create));
fixedExpenseRoutes.put(
  '/:id',
  requireAuth,
  validate(idSchema, 'params'),
  validate(fixedExpenseCreateSchema),
  asyncHandler(update),
);
fixedExpenseRoutes.delete('/:id', requireAuth, validate(idSchema, 'params'), asyncHandler(remove));
