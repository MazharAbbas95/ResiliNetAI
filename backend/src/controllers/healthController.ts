import { Request, Response } from 'express';

export const getBackendHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = {
      success: true,
      service: 'ResiliNet AI Backend',
      status: 'online',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(payload);
  } catch (error) {
    const response = {
      success: false,
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};
