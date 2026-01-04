import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Wraps async handlers so rejections go to Express error middleware instead of crashing the process.
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
