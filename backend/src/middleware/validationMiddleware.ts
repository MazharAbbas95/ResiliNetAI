import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.ts';

/**
 * Validates incoming requests against a provided Zod schema.
 */
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error && error.name === 'ZodError') {
        const message = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return sendError(res, error.errors, `Validation failed: ${message}`, 400);
      }
      next(error);
    }
  };
};
