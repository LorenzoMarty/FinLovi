import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!env.AUTH_ENABLED) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json(fail('Token ausente', 'UNAUTHORIZED'));
  }

  const token = header.replace('Bearer ', '').trim();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET || 'changeme');
    (req as Request & { user?: unknown }).user = payload;
    return next();
  } catch (_err) {
    return res.status(401).json(fail('Token inválido', 'UNAUTHORIZED'));
  }
}
