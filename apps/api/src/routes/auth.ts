import { Router } from 'express';
import { loginSchema } from '@finlovi/shared';
import { validate } from '../middlewares/validate.js';
import { login, refresh, logout, me } from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), asyncHandler(login));
authRoutes.post('/refresh', asyncHandler(refresh));
authRoutes.post('/logout', asyncHandler(logout));
authRoutes.get('/me', asyncHandler(me));
