import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.ts';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${req.method} ${req.url}`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendError(res, err, message, statusCode);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.warn(`[NotFound] ${req.method} ${req.originalUrl}`);
  const err = new Error('Route not found');
  // attach requested path for easier debugging (non-sensitive)
  (err as any).requestedPath = req.originalUrl;
  sendError(res, err, 'Route not found', 404);
};
