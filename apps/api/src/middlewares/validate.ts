import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { fail } from '../utils/response.js';

export function validate(schema: AnyZodObject, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json(fail('Dados inválidos', 'VALIDATION_ERROR', result.error.flatten()));
    }
    req[target] = result.data;
    return next();
  };
}
