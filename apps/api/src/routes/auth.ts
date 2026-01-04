import { Router } from 'express';
import { loginSchema } from '@finlovi/shared';
import { validate } from '../middlewares/validate.js';
import { login, refresh, logout, me } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginSchema), login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
authRoutes.get('/me', me);
