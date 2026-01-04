import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { summary } from '../controllers/dashboardController.js';

export const dashboardRoutes = Router();

dashboardRoutes.get('/summary', requireAuth, summary);
