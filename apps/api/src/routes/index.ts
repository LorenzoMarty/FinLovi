import { Router } from 'express';
import { authRoutes } from './auth.js';
import { transactionRoutes } from './transactions.js';
import { categoryRoutes } from './categories.js';
import { fixedExpenseRoutes } from './fixedExpenses.js';
import { goalRoutes } from './goals.js';
import { dashboardRoutes } from './dashboard.js';
import { reportRoutes } from './reports.js';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ ok: true });
});

routes.use('/auth', authRoutes);
routes.use('/transactions', transactionRoutes);
routes.use('/categories', categoryRoutes);
routes.use('/fixed-expenses', fixedExpenseRoutes);
routes.use('/goals', goalRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/reports', reportRoutes);
