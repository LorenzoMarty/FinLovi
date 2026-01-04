import { Router } from 'express';
import { authRoutes } from './auth.js';
import { transactionRoutes } from './transactions.js';
import { categoryRoutes } from './categories.js';
import { fixedExpenseRoutes } from './fixedExpenses.js';
import { goalRoutes } from './goals.js';
import { dashboardRoutes } from './dashboard.js';
import { reportRoutes } from './reports.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { pingDb } from '../config/db.js';

export const routes = Router();

routes.get('/health', asyncHandler(async (_req, res) => {
  const dbStatus = await pingDb();
  res.json({ ok: true, db: dbStatus.ok ? 'up' : 'down', dbError: dbStatus.ok ? undefined : dbStatus.error });
}));

routes.use('/auth', authRoutes);
routes.use('/transactions', transactionRoutes);
routes.use('/categories', categoryRoutes);
routes.use('/fixed-expenses', fixedExpenseRoutes);
routes.use('/goals', goalRoutes);
routes.use('/acquisition-goals', goalRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/reports', reportRoutes);
