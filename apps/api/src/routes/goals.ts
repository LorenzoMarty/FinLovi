import { Router } from 'express';
import { z } from 'zod';
import { goalCreateSchema } from '@finlovi/shared';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { list, get, create, update, remove } from '../controllers/goalsController.js';

const idSchema = z.object({ id: z.coerce.number().int().positive() });

export const goalRoutes = Router();

goalRoutes.get('/', requireAuth, list);
goalRoutes.get('/:id', requireAuth, validate(idSchema, 'params'), get);
goalRoutes.post('/', requireAuth, validate(goalCreateSchema), create);
goalRoutes.put('/:id', requireAuth, validate(idSchema, 'params'), validate(goalCreateSchema), update);
goalRoutes.delete('/:id', requireAuth, validate(idSchema, 'params'), remove);
