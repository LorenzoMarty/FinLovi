import { Router } from 'express';
import { z } from 'zod';
import { categoryCreateSchema } from '@finlovi/shared';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { list, create, update, remove } from '../controllers/categoriesController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const idSchema = z.object({ id: z.coerce.number().int().positive() });

export const categoryRoutes = Router();

categoryRoutes.get('/', requireAuth, asyncHandler(list));
categoryRoutes.post('/', requireAuth, validate(categoryCreateSchema), asyncHandler(create));
categoryRoutes.put(
  '/:id',
  requireAuth,
  validate(idSchema, 'params'),
  validate(categoryCreateSchema),
  asyncHandler(update),
);
categoryRoutes.delete('/:id', requireAuth, validate(idSchema, 'params'), asyncHandler(remove));
