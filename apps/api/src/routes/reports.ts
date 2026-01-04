import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { monthly } from '../controllers/reportsController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportRoutes = Router();

reportRoutes.get('/monthly', requireAuth, asyncHandler(monthly));
