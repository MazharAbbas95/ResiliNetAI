import { Response } from 'express';
import { ApiResponse } from '../types/index.ts';

export const sendSuccess = <T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: any, message: string = 'An error occurred', statusCode: number = 500): void => {
  const response: ApiResponse<null> = {
    success: false,
    message,
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
};
