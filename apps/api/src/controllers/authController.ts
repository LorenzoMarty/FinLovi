import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail, ok } from '../utils/response.js';
import type { Request, Response } from 'express';

function ensureAuthConfig(res: Response) {
  if (!env.AUTH_ENABLED) {
    res.status(501).json(fail('Autenticação desabilitada', 'AUTH_DISABLED'));
    return false;
  }
  if (!env.JWT_SECRET || !env.AUTH_EMAIL || !env.AUTH_PASSWORD) {
    res.status(500).json(fail('Configuração de autenticação incompleta', 'AUTH_CONFIG'));
    return false;
  }
  return true;
}

export function login(req: Request, res: Response) {
  if (!ensureAuthConfig(res)) return;
  const { email, password } = req.body as { email: string; password: string };

  if (email !== env.AUTH_EMAIL || password !== env.AUTH_PASSWORD) {
    res.status(401).json(fail('Credenciais inválidas', 'UNAUTHORIZED'));
    return;
  }

  const accessToken = jwt.sign({ email }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = env.JWT_REFRESH_SECRET
    ? jwt.sign({ email }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
    : null;

  res.json(ok({ accessToken, refreshToken }));
}

export function refresh(req: Request, res: Response) {
  if (!ensureAuthConfig(res)) return;
  if (!env.JWT_REFRESH_SECRET) {
    res.status(501).json(fail('Refresh token desabilitado', 'REFRESH_DISABLED'));
    return;
  }

  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json(fail('Refresh token ausente', 'VALIDATION_ERROR'));
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { email: string };
    const accessToken = jwt.sign({ email: payload.email }, env.JWT_SECRET || 'changeme', { expiresIn: '15m' });
    res.json(ok({ accessToken }));
  } catch (_err) {
    res.status(401).json(fail('Refresh token inválido', 'UNAUTHORIZED'));
  }
}

export function logout(_req: Request, res: Response) {
  if (!env.AUTH_ENABLED) {
    res.json(ok({ message: 'Logout não necessário' }));
    return;
  }
  res.json(ok({ message: 'Logout efetuado' }));
}

export function me(_req: Request, res: Response) {
  if (!env.AUTH_ENABLED) {
    res.json(ok({ enabled: false }));
    return;
  }
  res.json(ok({ enabled: true, email: env.AUTH_EMAIL }));
}
