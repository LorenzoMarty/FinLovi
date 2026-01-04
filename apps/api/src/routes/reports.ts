import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { monthly } from '../controllers/reportsController.js';

export const reportRoutes = Router();

reportRoutes.get('/monthly', requireAuth, monthly);
