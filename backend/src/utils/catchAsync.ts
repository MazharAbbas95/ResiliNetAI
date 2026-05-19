import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async controllers to automatically catch unhandled promise rejections
 * and forward them to the global Express error handler.
 */
export const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
